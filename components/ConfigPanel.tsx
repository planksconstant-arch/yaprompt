import React from 'react';
import { MODELS, OPTIMIZATION_GOALS } from '../constants';
import { type Model, type OptimizationGoal } from '../types';
import { Target, Cpu, TrendingUp, Brain, Zap, ChevronRight } from 'lucide-react';


interface ConfigPanelProps {
  userInput: string;
  setUserInput: (value: string) => void;
  selectedModel: Model | null;
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
  isLoading: boolean;
}

const PersonalizationInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}> = ({ value, onChange, placeholder }) => (
  <div className="bg-indigo-800 rounded-lg border border-indigo-700 focus-within:border-violet-500 focus-within:shadow-lg focus-within:shadow-violet-500/20 transition-all">
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
      className="w-full bg-transparent p-3 rounded-lg text-slate-200 focus:outline-none resize-none custom-scrollbar"
      placeholder={placeholder}
    />
  </div>
);

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
  isLoading
}) => {
  return (
    <aside className="w-1/3 max-w-md bg-indigo-900 border-r border-indigo-700 flex flex-col p-6 space-y-6 overflow-y-auto custom-scrollbar">
      <div>
        <div className="flex items-center space-x-2 mb-2">
          <Target className="w-5 h-5 text-violet-400" />
          <h2 className="text-lg font-semibold text-white">1. Initial State</h2>
        </div>
        <p className="text-sm text-indigo-300">Define your core objective.</p>
      </div>
      <div className="bg-indigo-800 rounded-lg border border-indigo-700 focus-within:border-violet-500 focus-within:shadow-lg focus-within:shadow-violet-500/20 transition-all">
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          rows={6}
          className="w-full bg-transparent p-3 rounded-lg text-slate-200 focus:outline-none resize-none custom-scrollbar"
          placeholder="e.g., Create a marketing campaign for a new sci-fi movie..."
        />
      </div>

      <div>
        <div className="flex items-center space-x-2 mb-2">
          <Cpu className="w-5 h-5 text-violet-400" />
          <h2 className="text-lg font-semibold text-white">2. Target Model (Environment)</h2>
        </div>
        <p className="text-sm text-indigo-300 mb-3">The RL policy will adapt the prompt to the selected model.</p>
        <div className="grid grid-cols-2 gap-3">
          {MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => setSelectedModel(model.id)}
              className={`border-2 rounded-lg p-3 text-left transition-all duration-200 ${
                selectedModel === model.id
                  ? 'border-violet-500 bg-violet-950/50 shadow-lg shadow-violet-500/20'
                  : 'border-indigo-600 hover:bg-indigo-700'
              }`}
            >
              <h3 className="font-semibold text-sm">{model.name}</h3>
              <p className="text-xs text-indigo-400">{model.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center space-x-2 mb-2">
          <TrendingUp className="w-5 h-5 text-violet-400" />
          <h2 className="text-lg font-semibold text-white">3. Optimization Strategy (Reward)</h2>
        </div>
        <p className="text-sm text-indigo-300 mb-3">Define desired output characteristics.</p>
        <select
          value={optimizationGoal}
          onChange={(e) => setOptimizationGoal(e.target.value as OptimizationGoal)}
          className="w-full bg-indigo-800 border border-indigo-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 cursor-pointer"
        >
          {OPTIMIZATION_GOALS.map((goal) => (
            <option key={goal} value={goal}>Maximize: {goal}</option>
          ))}
        </select>
      </div>

       <details className="group -my-2">
        <summary className="text-lg font-semibold text-white list-none flex items-center cursor-pointer p-2 -m-2 rounded-md hover:bg-indigo-800">
          <ChevronRight className="w-5 h-5 mr-2 transition-transform duration-200 group-open:rotate-90" />
          4. Personalization (Optional)
        </summary>
        <div className="mt-4 space-y-4 pl-1">
           <p className="text-sm text-indigo-300 -mt-2 mb-3">Provide context to tailor the prompt to your specific situation.</p>
          <div>
            <label className="block text-sm text-indigo-300 mb-2">Available Resources</label>
            <PersonalizationInput 
              value={userResources}
              onChange={setUserResources}
              placeholder="e.g., A small budget, a team of two, social media..."
            />
          </div>
          <div>
            <label className="block text-sm text-indigo-300 mb-2">Current Skills</label>
            <PersonalizationInput 
              value={currentSkills}
              onChange={setCurrentSkills}
              placeholder="e.g., Proficient in Python, basic graphic design..."
            />
          </div>
          <div>
            <label className="block text-sm text-indigo-300 mb-2">Time Commitment</label>
            <PersonalizationInput 
              value={timeCommitment}
              onChange={setTimeCommitment}
              placeholder="e.g., 5 hours per week, a full-time sprint for one week..."
            />
          </div>
        </div>
      </details>

      <div className="flex-grow"></div>

      <button
        onClick={onOptimize}
        disabled={isLoading}
        className={`w-full font-bold py-4 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 text-lg shadow-lg ${
          isLoading
            ? 'bg-indigo-600 cursor-not-allowed'
            : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-indigo-500/50 hover:shadow-indigo-500/70'
        }`}
      >
        {isLoading ? (
          <>
            <Brain className="w-6 h-6 animate-pulse" />
            <span>Optimizing...</span>
          </>
        ) : (
          <>
            <Zap className="w-6 h-6" />
            <span>Optimize Prompt</span>
          </>
        )}
      </button>
    </aside>
  );
};