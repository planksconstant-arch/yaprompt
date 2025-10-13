import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Award, Brain, Database, Target, Zap, Bot, ChevronDown, ChevronUp } from 'lucide-react';
import { type AppState, type OptimizationHistoryEntry, type RLInsights, type PopulationMember, type Log } from '../types';

const Placeholder: React.FC = () => (
    <div className="flex h-full flex-col items-center justify-center text-indigo-500 text-center p-4">
        <Database className="w-16 h-16 mb-4" />
        <h2 className="text-xl font-semibold text-slate-300">Local Evolution Dashboard</h2>
        <p className="mt-2 max-w-md text-indigo-400">Configure your prompt on the left and click "Start Local Evolution" to begin the client-side optimization process. Real-time data will appear here.</p>
    </div>
);

const CollapsibleSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode, defaultOpen?: boolean }> = ({ title, icon, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="bg-white/5 backdrop-blur-lg rounded-lg border border-purple-500/30">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-3 text-left">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">{icon}{title}</h2>
                {isOpen ? <ChevronUp className="text-purple-300"/> : <ChevronDown className="text-purple-300"/>}
            </button>
            {isOpen && <div className="p-3 pt-0">{children}</div>}
        </div>
    )
}

interface DashboardPanelProps {
    appState: AppState;
    generation: number;
    optimizationHistory: OptimizationHistoryEntry[];
    currentMetrics: any;
    rlInsights: RLInsights;
    population: PopulationMember[];
    bestPrompts: PopulationMember[];
    logs: Log[];
    onRefine: (prompt: string) => void;
}

export const DashboardPanel: React.FC<DashboardPanelProps> = ({
    appState, generation, optimizationHistory, currentMetrics, rlInsights, population, bestPrompts, logs, onRefine
}) => {

    if (appState === 'idle' || appState === 'error') {
        return (
            <section className="flex-grow bg-slate-900 flex flex-col p-4">
                <Placeholder />
            </section>
        )
    }

    const isEvolving = appState === 'stage1_running';

    return (
        <section className="flex-grow bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col p-4 space-y-4 overflow-y-auto custom-scrollbar">
            {/* Progress Chart */}
            <CollapsibleSection title="Optimization Progress" icon={<TrendingUp className="text-green-400"/>} defaultOpen={true}>
                <div className="flex justify-between text-sm text-purple-200 mb-2">
                    <span>Generation: {generation}/50</span>
                    <span>{((generation / 50) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2.5 mb-2">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full" style={{ width: `${(generation / 50) * 100}%` }}></div>
                </div>
                <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={optimizationHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis dataKey="generation" stroke="#888" fontSize={12} />
                        <YAxis stroke="#888" domain={[0, 1]} fontSize={12}/>
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #6366f1' }} />
                        <Legend />
                        <Line type="monotone" dataKey="bestFitness" stroke="#8b5cf6" strokeWidth={2} name="Best" dot={false} />
                        <Line type="monotone" dataKey="avgFitness" stroke="#06b6d4" strokeWidth={2} name="Avg" dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </CollapsibleSection>
            
            {/* Top Prompts */}
            <CollapsibleSection title="Top Evolved Prompts" icon={<Target className="text-orange-400"/>} defaultOpen={true}>
                 <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                    {bestPrompts.slice(0, 5).map((item, idx) => (
                        <div key={idx} className="bg-slate-800/50 rounded-lg p-2 border border-purple-500/30">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-semibold text-green-400">Fitness: {item.fitness.toFixed(3)}</span>
                                <button
                                    onClick={() => onRefine(item.prompt)}
                                    disabled={isEvolving || appState === 'stage2_running'}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-0.5 rounded text-xs flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Bot size={12}/> Refine with AI
                                </button>
                            </div>
                            <p className="text-white text-xs">{item.prompt}</p>
                        </div>
                    ))}
                </div>
            </CollapsibleSection>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Metrics */}
                 <CollapsibleSection title="Quality Metrics" icon={<Award className="text-yellow-400"/>}>
                     <div className="space-y-2">
                        {Object.entries(currentMetrics).map(([key, value]: [string, any]) => (
                            <div key={key}>
                                <div className="flex justify-between text-xs text-purple-200 mb-1">
                                    <span className="capitalize">{key}</span>
                                    <span>{(value * 100).toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-slate-700 rounded-full h-1.5"><div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${value * 100}%` }}></div></div>
                            </div>
                        ))}
                    </div>
                </CollapsibleSection>

                {/* RL Insights */}
                 <CollapsibleSection title="RL Insights" icon={<Brain className="text-purple-400"/>}>
                    <div className="space-y-1 text-xs text-purple-200">
                        <div className="flex justify-between"><span>Avg Reward:</span><span className="font-semibold">{rlInsights.avgReward?.toFixed(3) || 'N/A'}</span></div>
                        <div className="flex justify-between"><span>Epsilon:</span><span className="font-semibold">{(rlInsights.epsilon! * 100)?.toFixed(1) || 'N/A'}%</span></div>
                        <div className="flex justify-between"><span>Episodes:</span><span className="font-semibold">{rlInsights.episodeCount || 'N/A'}</span></div>
                    </div>
                </CollapsibleSection>
            </div>
            
             {/* Activity Log */}
            <CollapsibleSection title="Activity Log" icon={<Zap className="text-yellow-400"/>}>
                <div className="bg-slate-900/50 rounded-md p-2 h-32 overflow-y-auto font-mono text-xs custom-scrollbar">
                    {logs.map((log, idx) => (
                        <div key={idx} className="text-green-400 mb-1">
                            <span className="text-purple-400">[{log.timestamp}]</span> {log.message}
                        </div>
                    ))}
                </div>
            </CollapsibleSection>

        </section>
    );
}
