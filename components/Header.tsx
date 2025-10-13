import React from 'react';
import { Sparkles, BarChart } from 'lucide-react';

interface HeaderProps {
  stats: {
    totalOptimizations: number;
    avgClarity: number;
    avgRobustness: number;
  };
}

export const Header: React.FC<HeaderProps> = ({ stats }) => {
  return (
    <header className="bg-indigo-950/50 backdrop-blur-sm border-b border-indigo-700 px-4 py-2 flex-shrink-0">
      <div className="max-w-full mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Sparkles className="w-8 h-8 text-violet-400" />
          <div>
            <h1 className="text-xl font-bold text-white">Yaprompt Studio</h1>
            <p className="text-xs text-indigo-300">Hybrid AI Prompt Engineering</p>
          </div>
        </div>
        <div className="flex items-center space-x-6 text-sm">
           <div className="flex items-center gap-2 text-indigo-400">
             <BarChart className="w-5 h-5"/>
             <span className="font-semibold">Cloud AI Stats:</span>
           </div>
          <div className="text-center">
            <div className="text-violet-400 font-bold text-lg">{stats.totalOptimizations}</div>
            <div className="text-xs text-indigo-400">Refinements</div>
          </div>
          <div className="text-center">
            <div className="text-green-400 font-bold text-lg">{(stats.avgClarity * 10).toFixed(1)}</div>
            <div className="text-xs text-indigo-400">Avg Clarity</div>
          </div>
          <div className="text-center">
            <div className="text-sky-400 font-bold text-lg">{(stats.avgRobustness * 10).toFixed(1)}</div>
            <div className="text-xs text-indigo-400">Avg Robustness</div>
          </div>
        </div>
      </div>
    </header>
  );
};
