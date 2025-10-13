import React from 'react';
import { MODELS, OPTIMIZATION_GOALS } from '../constants';
import { type Model, type OptimizationGoal, type AppState } from '../types';
import { Target, Cpu, TrendingUp, Brain, Zap, ChevronRight, Play, Pause, RotateCcw } from 'lucide-react';

interface ConfigPanelProps {
  userInput: string;
  setUserInput: (value: string) => void;
  selectedModel: Model;
  setSelectedModel: (model: Model) => void;
  optimizationGoal: OptimizationGoal;
  setOptimizationGoal: (goal: OptimizationGoal) => void;
  userResources: string;
  setUserResources: (value: string) => void;
  currentSkills: string;
  setCurrentSkills: (value: string) => void;
  timeCommitment: string;
  setTimeCommitment: (value: string) => void;
  onOptimize: () => void;
  onReset: () => void;
  onStop: () => void;
  appState: AppState;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  userInput,
  setUserInput,
  selectedModel,
  setSelectedModel,
  optimizationGoal,
  setOptimizationGoal,
  userResources,
  setUserResources,
  currentSkills,
  setCurrentSkills,
  timeCommitment,
  setTimeCommitment,
  onOptimize,
  onReset,
  onStop,
  appState
}) => {
  const isRunning = appState === 'stage1_running';
  const isProcessing = appState.includes('running');

  const handleMainAction = () => {
    if (isRunning) {
      onStop();
    } else {
      onOptimize();
    }
  };

  const getMainActionButton = () => {
    const disabled = !userInput.trim() || appState === 'stage2_running';
    let icon = <Play className="w-6 h-6" />;
    let text = "Start Local Evolution";
    let style = "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700";

    if (isRunning) {
      icon = <Pause className="w-6 h-6" />;
      text = "Pause Evolution";
      style = "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700";
    } else if (appState === 'stage1_paused' || appState === 'stage1_complete') {
        text = "Resume Evolution";
    } else if (appState === 'stage2_running') {
        icon = <Brain className="w-6 h-6 animate-pulse" />;
        text = "Refining with AI...";
        style = "bg-indigo-600";
    }

    return (
       <button
        onClick={handleMainAction}
        disabled={disabled}
        className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 text-md shadow-lg ${
          disabled ? 'bg-slate-600 cursor-not-allowed opacity-70' : style + ' shadow-indigo-500/50 hover:shadow-indigo-500/70'
        }`}
      >
        {icon}
        <span>{text}</span>
      </button>
    );
  };

  return (
    <aside className="w-[380px] flex-shrink-0 bg-indigo-900 border-r border-indigo-700 flex flex-col p-4 space-y-4 overflow-y-auto custom-scrollbar">
      <div className="flex-grow space-y-4">
        {/* Section 1: Input */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2"><Target className="text-violet-400"/>1. Initial Prompt</h2>
          <div className="bg-indigo-800 rounded-lg border border-indigo-700 focus-within:border-violet-500">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              rows={5}
              className="w-full bg-transparent p-2 text-slate-200 focus:outline-none resize-none custom-scrollbar"
              placeholder="e.g., A marketing plan for a new sci-fi movie..."
              disabled={isProcessing}
            />
          </div>
        </div>

        {/* Section 2: Target Model */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2"><Cpu className="text-violet-400"/>2. Target Model</h2>
          <div className="grid grid-cols-2 gap-2">
            {MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => setSelectedModel(model.id)}
                disabled={isProcessing}
                className={`border rounded-lg p-2 text-left transition-all text-sm ${
                  selectedModel === model.id ? 'border-violet-500 bg-violet-950/50' : 'border-indigo-600 hover:bg-indigo-700'
                } ${isProcessing ? 'opacity-50' : ''}`}
              >
                <h3 className="font-semibold">{model.name}</h3>
                <p className="text-xs text-indigo-400">{model.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: Optimization Goal */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2"><TrendingUp className="text-violet-400"/>3. Optimization Goal</h2>
          <select
            value={optimizationGoal}
            onChange={(e) => setOptimizationGoal(e.target.value as OptimizationGoal)}
            disabled={isProcessing}
            className="w-full bg-indigo-800 border border-indigo-600 rounded-lg p-2 text-white focus:ring-violet-500 disabled:opacity-50"
          >
            {OPTIMIZATION_GOALS.map((goal) => <option key={goal} value={goal}>{goal}</option>)}
          </select>
        </div>

        {/* Section 4: Personalization */}
        <details className="group -my-1">
            <summary className="text-lg font-semibold text-white list-none flex items-center cursor-pointer p-2 -m-2 rounded-md hover:bg-indigo-800">
                <ChevronRight className="w-5 h-5 mr-1 transition-transform duration-200 group-open:rotate-90" />
                4. Personalization (Optional)
            </summary>
            <div className="mt-2 space-y-2 pl-2">
                <textarea value={userResources} onChange={e => setUserResources(e.target.value)} rows={2} disabled={isProcessing} className="w-full text-sm bg-indigo-800 border border-indigo-700 rounded-md p-2 focus:outline-none resize-none custom-scrollbar disabled:opacity-50" placeholder="Available Resources..."/>
                <textarea value={currentSkills} onChange={e => setCurrentSkills(e.target.value)} rows={2} disabled={isProcessing} className="w-full text-sm bg-indigo-800 border border-indigo-700 rounded-md p-2 focus:outline-none resize-none custom-scrollbar disabled:opacity-50" placeholder="Current Skills..."/>
                <textarea value={timeCommitment} onChange={e => setTimeCommitment(e.target.value)} rows={2} disabled={isProcessing} className="w-full text-sm bg-indigo-800 border border-indigo-700 rounded-md p-2 focus:outline-none resize-none custom-scrollbar disabled:opacity-50" placeholder="Time Commitment..."/>
            </div>
        </details>
      </div>

      {/* Action Buttons */}
      <div className="flex-shrink-0 space-y-2">
        <div className="flex gap-2">
          {getMainActionButton()}
          <button
            onClick={onReset}
            disabled={appState === 'idle'}
            className="p-3 bg-red-600 hover:bg-red-700 rounded-lg disabled:bg-slate-600 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
        </div>
      </div>
    </aside>
  );
};
