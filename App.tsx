
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { type Model, type OptimizationGoal, type AppState, type FullResult, type Stage1Result, type Stage2Result, type Log, type RLInsights, type PopulationMember, type OptimizationHistoryEntry } from './types';

import { GeneticAlgorithm, PromptEvaluator, RLPromptOptimizer, NeuralPromptOptimizer } from './lib/algorithms';
import { optimizePrompt } from './services/geminiService';

import { Header } from './components/Header';
import { ConfigPanel } from './components/ConfigPanel';
import { DashboardPanel } from './components/DashboardPanel';
import { OutputPanel } from './components/OutputPanel';

export default function App() {
  // Config State
  const [userInput, setUserInput] = useState('Create a social media marketing campaign for a new sustainable coffee brand targeting Gen Z.');
  const [selectedModel, setSelectedModel] = useState<Model>('gemini');
  const [optimizationGoal, setOptimizationGoal] = useState<OptimizationGoal>('Creative Ideation & Brainstorming');
  const [userResources, setUserResources] = useState('');
  const [currentSkills, setCurrentSkills] = useState('');
  const [timeCommitment, setTimeCommitment] = useState('');

  // App Flow State
  const [appState, setAppState] = useState<AppState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Stage 1: Local Evolution State
  const [generation, setGeneration] = useState(0);
  const [population, setPopulation] = useState<PopulationMember[]>([]);
  const [bestPrompts, setBestPrompts] = useState<PopulationMember[]>([]);
  const [optimizationHistory, setOptimizationHistory] = useState<OptimizationHistoryEntry[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<any>({});
  const [rlInsights, setRlInsights] = useState<RLInsights>({});
  const [logs, setLogs] = useState<Log[]>([]);
  
  // Stage 2: Cloud Refinement State
  const [finalResult, setFinalResult] = useState<FullResult | null>(null);

  // Core Algorithm Refs
  const gaRef = useRef<GeneticAlgorithm | null>(null);
  const evaluatorRef = useRef<PromptEvaluator | null>(null);
  const rlOptimizerRef = useRef<RLPromptOptimizer | null>(null);
  const neuralOptimizerRef = useRef<NeuralPromptOptimizer | null>(null);
  // Fix: Changed NodeJS.Timeout to number as setInterval in the browser returns a number.
  const evolutionIntervalRef = useRef<number | null>(null);
  
  // Stats for Header
  const [stats, setStats] = useState({ totalOptimizations: 0, avgClarity: 0, avgRobustness: 0 });

  useEffect(() => {
    gaRef.current = new GeneticAlgorithm();
    evaluatorRef.current = new PromptEvaluator();
    rlOptimizerRef.current = new RLPromptOptimizer();
    neuralOptimizerRef.current = new NeuralPromptOptimizer();
    addLog('System initialized.');
  }, []);

  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev.slice(-100), {
      timestamp: new Date().toLocaleTimeString(),
      message
    }]);
  }, []);

  const stopEvolution = useCallback(() => {
    setAppState(prev => prev === 'stage1_running' ? 'stage1_paused' : prev);
    if (evolutionIntervalRef.current) {
      clearInterval(evolutionIntervalRef.current);
      evolutionIntervalRef.current = null;
    }
    addLog('Local evolution paused.');
  }, [addLog]);
  
  const resetEvolution = () => {
    stopEvolution();
    setAppState('idle');
    setPopulation([]);
    setGeneration(0);
    setBestPrompts([]);
    setOptimizationHistory([]);
    setCurrentMetrics({});
    setRlInsights({});
    setFinalResult(null);
    setLogs([]);
    addLog('System reset.');
  };

  const startLocalEvolution = () => {
    if (!userInput.trim() || !gaRef.current || !evaluatorRef.current) {
      setError('Please enter a prompt first.');
      setAppState('error');
      return;
    }

    setAppState('stage1_running');
    addLog('Starting Stage 1: Local Evolution...');
    setFinalResult(null);
    setError(null);
    
    const initialPop = gaRef.current.initializePopulation(userInput);
    let evaluatedPop = initialPop.map(ind => {
      const fitness = evaluatorRef.current!.evaluatePrompt(ind.prompt);
      return { ...ind, fitness };
    });

    setPopulation(evaluatedPop);
    setGeneration(0);
    setBestPrompts([]);
    setOptimizationHistory([]);

    addLog(`Initialized population with ${initialPop.length} candidates.`);

    let gen = 0;
    evolutionIntervalRef.current = window.setInterval(() => {
      const allRefsExist = gaRef.current && evaluatorRef.current && rlOptimizerRef.current && neuralOptimizerRef.current;
      if (!allRefsExist) {
        stopEvolution();
        return;
      }
      gen++;
      
      if (gen > 50) {
        stopEvolution();
        setAppState('stage1_complete');
        addLog('Evolution complete: 50 generations reached.');
        return;
      }

      const newPop = gaRef.current.evolve(evaluatedPop);
      
      const evaluated = newPop.map(ind => {
        let fitness = evaluatorRef.current!.evaluatePrompt(ind.prompt);
        if (fitness > 0.7 && Math.random() < 0.3) {
          const optimized = rlOptimizerRef.current!.optimize(ind.prompt, fitness);
          const newFitness = evaluatorRef.current!.evaluatePrompt(optimized);
          if (newFitness > fitness) {
            ind.prompt = optimized;
            fitness = newFitness;
          }
        }
        const input = neuralOptimizerRef.current!.encodePrompt(ind.prompt);
        neuralOptimizerRef.current!.train(input, [fitness, fitness, fitness, fitness, fitness]);
        return { ...ind, fitness };
      });

      evaluated.sort((a, b) => b.fitness - a.fitness);
      const best = evaluated[0];
      
      setPopulation(evaluated);
      setGeneration(gen);
      setBestPrompts(prev => [...prev, best].sort((a,b) => b.fitness - a.fitness).slice(0, 10));
      setCurrentMetrics(evaluatorRef.current!.metrics);
      setOptimizationHistory(prev => [...prev, {
        generation: gen,
        bestFitness: best.fitness,
        avgFitness: evaluated.reduce((sum, ind) => sum + ind.fitness, 0) / evaluated.length
      }]);
      setRlInsights(rlOptimizerRef.current!.getInsights());

      if (gen % 10 === 0) {
        addLog(`Gen ${gen}: Best Fitness=${best.fitness.toFixed(3)}`);
      }

      evaluatedPop = evaluated;
    }, 150);
  };

  const startCloudRefinement = async (evolvedPrompt: string) => {
    if (!selectedModel) {
      setError("Please select a target model before refinement.");
      setAppState('error');
      return;
    }

    stopEvolution();
    setAppState('stage2_running');
    setError(null);
    setLoadingMessage('Sending evolved prompt to Gemini for semantic refinement...');
    addLog('Starting Stage 2: Cloud Refinement...');
    
    try {
      const stage1Result: Stage1Result = {
        reasoning: "The client-side engine evolved the initial prompt over " + generation + " generations using a hybrid GA+RL model to optimize for structural effectiveness based on the goal: " + optimizationGoal,
        prompt: evolvedPrompt
      };

      const stage2Result: Stage2Result = await optimizePrompt(
        evolvedPrompt,
        userInput,
        selectedModel,
        optimizationGoal,
        userResources,
        currentSkills,
        timeCommitment
      );

      setFinalResult({ stage1: stage1Result, stage2: stage2Result });

      if (stage2Result.critique) {
        setStats(prev => ({
          totalOptimizations: prev.totalOptimizations + 1,
          avgClarity: (prev.avgClarity * prev.totalOptimizations + stage2Result.critique!.clarity) / (prev.totalOptimizations + 1),
          avgRobustness: (prev.avgRobustness * prev.totalOptimizations + stage2Result.critique!.robustness) / (prev.totalOptimizations + 1),
        }));
      }

      setAppState('stage2_complete');
      addLog('Cloud refinement successful.');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during cloud refinement.";
      setError(errorMessage);
      setAppState('error');
      addLog(`Error: ${errorMessage}`);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 font-sans">
      <Header stats={stats} />
      <div className="flex flex-grow overflow-hidden">
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
          onOptimize={startLocalEvolution}
          onReset={resetEvolution}
          onStop={stopEvolution}
          appState={appState}
        />
        <main className="flex-grow flex overflow-hidden">
          <DashboardPanel
            appState={appState}
            generation={generation}
            optimizationHistory={optimizationHistory}
            currentMetrics={currentMetrics}
            rlInsights={rlInsights}
            population={population}
            bestPrompts={bestPrompts}
            logs={logs}
            onRefine={startCloudRefinement}
          />
          <OutputPanel 
            appState={appState}
            result={finalResult}
            error={error}
            loadingMessage={loadingMessage}
          />
        </main>
      </div>
    </div>
  );
}
