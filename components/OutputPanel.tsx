import React from 'react';
import { type AppState, type FullResult, type Critique } from '../types';
import { Sparkles, AlertCircle, Network, Brain, Copy, Check, ArrowRight, Bot, Cpu } from 'lucide-react';

const Placeholder: React.FC = () => (
    <div className="flex h-full flex-col items-center justify-center text-indigo-500 text-center p-4">
        <Sparkles className="w-16 h-16 mb-4" />
        <h2 className="text-xl font-semibold text-slate-300">Final Output Panel</h2>
        <p className="mt-2 max-w-md text-indigo-400">After running the Local Evolution, select a top prompt and click "Refine with Cloud AI". The final, API-enhanced prompt will appear here.</p>
    </div>
);

const Loader: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex h-full flex-col items-center justify-center text-center p-4">
        <div className="relative">
            <Brain className="w-16 h-16 text-violet-400 animate-pulse" />
        </div>
        <h2 className="text-xl font-semibold mt-6 text-slate-300">Executing Cloud Refinement...</h2>
        <p className="mt-2 text-indigo-400 max-w-md">{message}</p>
    </div>
);

const ErrorDisplay: React.FC<{ message: string | null }> = ({ message }) => (
    <div className="flex h-full flex-col items-center justify-center text-center p-4">
        <AlertCircle className="w-16 h-16 mb-4 text-red-400" />
        <h2 className="text-xl font-semibold text-red-300">Refinement Failed</h2>
        <p className="mt-2 text-indigo-400 max-w-md">{message || "An unknown error occurred."}</p>
    </div>
);

const ScoreBar: React.FC<{ label: string; score: number }> = ({ label, score }) => {
    const width = `${score * 10}%`;
    const color = score > 7 ? 'bg-green-500' : score > 4 ? 'bg-yellow-500' : 'bg-red-500';
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-indigo-200">{label}</span>
                <span className="text-sm font-bold text-white">{score}/10</span>
            </div>
            <div className="w-full bg-indigo-700 rounded-full h-2">
                <div className={`${color} h-2 rounded-full`} style={{ width }}></div>
            </div>
        </div>
    );
};

const CritiqueDisplay: React.FC<{ critique: Critique }> = ({ critique }) => (
    <div>
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2"><AlertCircle className="text-violet-400"/>AI Critique & Reward</h3>
        <div className="bg-indigo-900 rounded-lg p-3 text-sm text-indigo-200 border border-indigo-700">
            <div className="space-y-2 mb-3">
                <ScoreBar label="Clarity" score={critique.clarity} />
                <ScoreBar label="Robustness" score={critique.robustness} />
                <ScoreBar label="Efficiency" score={critique.efficiency} />
            </div>
            <div className="border-t border-indigo-700 pt-2 whitespace-pre-wrap font-mono text-xs custom-scrollbar overflow-y-auto max-h-32">
                {critique.text}
            </div>
        </div>
    </div>
);

const ResultDisplay: React.FC<{ result: FullResult }> = ({ result }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(result.stage2.prompt).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    
    return (
        <div className="flex flex-col space-y-4 h-full">
            {/* Stage 1 Input */}
            <div>
                <h3 className="text-md font-semibold text-indigo-300 mb-1 flex items-center gap-2"><Cpu />Input to Cloud AI (from Stage 1)</h3>
                <div className="bg-indigo-950 rounded p-2 text-xs text-indigo-300 max-h-24 overflow-y-auto border border-indigo-700 custom-scrollbar">
                    {result.stage1.prompt}
                </div>
            </div>

            <div className="border-t border-indigo-700 my-2"></div>

            {/* Stage 2 Output */}
            <div className="flex-grow flex flex-col">
                 <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Sparkles className="text-violet-400"/>Final Optimized Prompt</h2>
                    <button onClick={handleCopy} className="bg-indigo-700 hover:bg-violet-600 font-semibold py-1 px-3 rounded-lg flex items-center space-x-2 text-sm">
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                </div>
                <div className="bg-indigo-950 rounded-lg p-3 text-violet-300 flex-grow overflow-y-auto whitespace-pre-wrap border border-violet-500/50 custom-scrollbar">
                    {result.stage2.prompt}
                </div>
            </div>
            
            {result.stage2.critique && <CritiqueDisplay critique={result.stage2.critique} />}
        </div>
    );
};

interface OutputPanelProps {
    appState: AppState;
    result: FullResult | null;
    error: string | null;
    loadingMessage: string;
}

export const OutputPanel: React.FC<OutputPanelProps> = ({ appState, result, error, loadingMessage }) => {
    const renderContent = () => {
        switch (appState) {
            case 'stage2_running':
                return <Loader message={loadingMessage} />;
            case 'stage2_complete':
                return result ? <ResultDisplay result={result} /> : <ErrorDisplay message="Result data is missing."/>;
            case 'error':
                 return <ErrorDisplay message={error} />;
            case 'idle':
            case 'stage1_running':
            case 'stage1_paused':
            case 'stage1_complete':
            default:
                return <Placeholder />;
        }
    };

    return (
        <section className="w-[450px] flex-shrink-0 bg-indigo-950/70 backdrop-blur-sm border-l border-indigo-700 flex flex-col p-4">
            {renderContent()}
        </section>
    );
};
