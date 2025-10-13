export type Model = 'gemini' | 'claude' | 'gpt' | 'qwen';

export type OptimizationGoal =
  | 'Chain-of-Thought Reasoning'
  | 'Creative Ideation & Brainstorming'
  | 'Factual Precision & Detail'
  | 'Role-Playing & Persona Adoption'
  | 'Code Generation & Explanation';

export interface ModelInfo {
  id: Model;
  name: string;
  description: string;
}

export interface Critique {
  text: string;
  clarity: number;
  robustness: number;
  efficiency: number;
}

export type AppState = 
  | 'idle' 
  | 'stage1_running' 
  | 'stage1_paused'
  | 'stage1_complete' 
  | 'stage2_running' 
  | 'stage2_complete' 
  | 'error';

export interface Stage1Result {
  reasoning: string;
  prompt: string;
}

export interface Stage2Result {
  reasoning: string;
  prompt: string;
  critique: Critique | null;
}

export interface FullResult {
  stage1: Stage1Result;
  stage2: Stage2Result;
}

export interface Log {
    timestamp: string;
    message: string;
}

export interface RLInsights {
  avgReward?: number;
  epsilon?: number;
  episodeCount?: number;
  bestActions?: { [key: string]: string };
  historyLength?: number;
}

export interface PopulationMember {
  prompt: string;
  fitness: number;
  age: number;
  mutations: number;
}

export interface OptimizationHistoryEntry {
  generation: number;
  bestFitness: number;
  avgFitness: number;
}
