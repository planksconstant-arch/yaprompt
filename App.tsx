import React, { useState, useRef } from 'react';
import { Header } from './components/Header';
import { ConfigPanel } from './components/ConfigPanel';
import { OutputPanel } from './components/OutputPanel';
import { optimizePrompt } from './services/geminiService';
import { PromptOptimizer } from './lib/PromptOptimizer';
import type { Model, OptimizationGoal, FullResult, AppState } from './types';

export default function App() {
  const [appState, setAppState] = useState<AppState>('idle');
  const [result, setResult] = useState<FullResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  const optimizerRef = useRef(new PromptOptimizer());

  // Config State
  const [userInput, setUserInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [optimizationGoal, setOptimizationGoal] = useState<OptimizationGoal>('Chain-of-Thought Reasoning');

  // Personalization State
  const [userResources, setUserResources] = useState('');
  const [currentSkills, setCurrentSkills] = useState('');
  const [timeCommitment, setTimeCommitment] = useState('');

  // Stats
  const [stats, setStats] = useState({
    totalOptimizations: 0,
    avgClarity: 0,
    avgRobustness: 0,
  });

  const handleOptimize = async () => {
    if (!userInput.trim()) {
      alert('Please enter a prompt to optimize.');
      return;
    }
    if (!selectedModel) {
      alert('Please select a target model.');
      return;
    }

    setAppState('loading');
    setError(null);
    setResult(null);

    try {
      // Stage 1: Local RL Optimization
      setLoadingMessage('Stage 1: Applying structural template...');
      const stage1Result = await optimizerRef.current.optimize({
        prompt: userInput,
        model: selectedModel,
        goal: optimizationGoal,
      });

      // Stage 2: Gemini API Refinement
      setLoadingMessage('Stage 2: Refining with generative AI...');
      const stage2Result = await optimizePrompt(
        stage1Result.prompt, // Pass the structured prompt to the API
        userInput,
        selectedModel,
        optimizationGoal,
        userResources,
        currentSkills,
        timeCommitment
      );

      setResult({ stage1: stage1Result, stage2: stage2Result });
      setAppState('success');

      // Update stats based on final critique
      if (stage2Result.critique) {
        setStats(prev => {
          const newTotal = prev.totalOptimizations + 1;
          const newClarity = (prev.avgClarity * prev.totalOptimizations + stage2Result.critique.clarity) / newTotal;
          const newRobustness = (prev.avgRobustness * prev.totalOptimizations + stage2Result.critique.robustness) / newTotal;
          return {
            totalOptimizations: newTotal,
            avgClarity: newClarity,
            avgRobustness: newRobustness,
          };
        });
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      setAppState('error');
      console.error('Optimization failed:', err);
    } finally {
      setLoadingMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-950 text-slate-200 flex flex-col">
      <Header stats={stats} />
      <div className="flex flex-grow h-[calc(100vh-68px)]">
        <ConfigPanel
          userInput={userInput}
          setUserInput={setUserInput}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          optimizationGoal={optimizationGoal}
          setOptimizationGoal={setOptimizationGoal}
          userResources={userResources}
          setUserResources={setUserResources}
          currentSkills={currentSkills}
          setCurrentSkills={setCurrentSkills}
          timeCommitment={timeCommitment}
          setTimeCommitment={setTimeCommitment}
          onOptimize={handleOptimize}
          isLoading={appState === 'loading'}
        />
        <OutputPanel
          appState={appState}
          result={result}
          error={error}
          loadingMessage={loadingMessage}
        />
      </div>
    </div>
  );
}