import { type PopulationMember } from "../types";

// ============================================================================
// CORE RL & ML ALGORITHMS
// ============================================================================

export class GeneticAlgorithm {
  populationSize: number;
  mutationRate: number;
  crossoverRate: number;
  eliteSize: number;
  generation: number;

  constructor(populationSize = 20, mutationRate = 0.15, crossoverRate = 0.7, eliteSize = 4) {
    this.populationSize = populationSize;
    this.mutationRate = mutationRate;
    this.crossoverRate = crossoverRate;
    this.eliteSize = eliteSize;
    this.generation = 0;
  }

  initializePopulation(basePrompt: string) {
    const population: PopulationMember[] = [];
    const variations = [
      { prefix: "You are an expert assistant. ", suffix: "" },
      { prefix: "Please provide a detailed response. ", suffix: "" },
      { prefix: "", suffix: " Be specific and thorough." },
      { prefix: "Step by step: ", suffix: "" },
      { prefix: "Think carefully. ", suffix: " Explain your reasoning." },
    ];

    population.push({ prompt: basePrompt, fitness: 0, age: 0, mutations: 0 });

    for (let i = 1; i < this.populationSize; i++) {
      const variation = variations[i % variations.length];
      const mutated = this.mutatePrompt(basePrompt, 0.3);
      const promptText = variation.prefix + mutated + variation.suffix;
      population.push({ prompt: promptText, fitness: 0, age: 0, mutations: 0 });
    }

    return population;
  }

  mutatePrompt(prompt: string, customRate: number | null = null) {
    const rate = customRate || this.mutationRate;
    if (Math.random() > rate) return prompt;

    const mutations = [
      (p: string) => p.replace(/\./g, '. ').replace(/\s+/g, ' '),
      (p: string) => p + ' Please elaborate.',
      (p: string) => 'Specifically: ' + p,
      (p: string) => p.replace(/please/gi, 'kindly'),
      (p: string) => p + ' Use examples.',
    ];

    const mutation = mutations[Math.floor(Math.random() * mutations.length)];
    return mutation(prompt).trim();
  }

  crossover(parent1: { prompt: string }, parent2: { prompt: string }) {
    if (Math.random() > this.crossoverRate) {
      return Math.random() < 0.5 ? parent1.prompt : parent2.prompt;
    }
    const words1 = parent1.prompt.split(' ');
    const words2 = parent2.prompt.split(' ');
    const crossPoint = Math.floor(Math.random() * Math.min(words1.length, words2.length));
    return [...words1.slice(0, crossPoint), ...words2.slice(crossPoint)].join(' ');
  }

  evolve(population: PopulationMember[]) {
    this.generation++;
    population.sort((a, b) => b.fitness - a.fitness);

    const newPopulation = population.slice(0, this.eliteSize).map(ind => ({ ...ind, age: ind.age + 1 }));

    while (newPopulation.length < this.populationSize) {
      const parent1 = this.tournamentSelect(population);
      const parent2 = this.tournamentSelect(population);
      let childPrompt = this.crossover(parent1, parent2);
      childPrompt = this.mutatePrompt(childPrompt);

      newPopulation.push({
        prompt: childPrompt,
        fitness: 0,
        age: 0,
        mutations: Math.max(parent1.mutations, parent2.mutations) + (childPrompt !== parent1.prompt ? 1 : 0)
      });
    }
    return newPopulation;
  }

  tournamentSelect(population: PopulationMember[], tournamentSize = 3) {
    let best = null;
    for (let i = 0; i < tournamentSize; i++) {
      const contestant = population[Math.floor(Math.random() * population.length)];
      if (best === null || contestant.fitness > best.fitness) {
        best = contestant;
      }
    }
    return best!;
  }
}

export class QLearningAgent {
  states: string[];
  actions: string[];
  alpha: number;
  gamma: number;
  epsilon: number;
  qTable: { [state: string]: { [action: string]: number } };
  episodeCount: number;

  constructor(states: string[], actions: string[], learningRate = 0.1, discountFactor = 0.95, epsilon = 0.3) {
    this.states = states;
    this.actions = actions;
    this.alpha = learningRate;
    this.gamma = discountFactor;
    this.epsilon = epsilon;
    this.qTable = {};
    this.initializeQTable();
    this.episodeCount = 0;
  }

  initializeQTable() {
    this.states.forEach(state => {
      this.qTable[state] = {};
      this.actions.forEach(action => { this.qTable[state][action] = 0; });
    });
  }

  selectAction(state: string) {
    if (Math.random() < this.epsilon) {
      return this.actions[Math.floor(Math.random() * this.actions.length)];
    }
    const qValues = this.qTable[state] || {};
    return Object.keys(qValues).length > 0
      ? Object.entries(qValues).reduce((a, b) => a[1] > b[1] ? a : b)[0]
      : this.actions[0];
  }

  updateQValue(state: string, action: string, reward: number, nextState: string) {
    if (!this.qTable[state] || !this.qTable[nextState]) return;
    const currentQ = this.qTable[state][action];
    const maxNextQ = Math.max(...Object.values(this.qTable[nextState]));
    const newQ = currentQ + this.alpha * (reward + this.gamma * maxNextQ - currentQ);
    this.qTable[state][action] = newQ;
  }

  decayEpsilon(minEpsilon = 0.05) {
    this.episodeCount++;
    this.epsilon = Math.max(minEpsilon, this.epsilon * 0.995);
  }

  getBestAction(state: string) {
    const qValues = this.qTable[state] || {};
    if (Object.keys(qValues).length === 0) return 'N/A';
    return Object.entries(qValues).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  }
}

export class PromptEvaluator {
  metrics: { clarity: number; specificity: number; completeness: number; structure: number; effectiveness: number; };

  constructor() {
    this.metrics = { clarity: 0, specificity: 0, completeness: 0, structure: 0, effectiveness: 0 };
  }

  evaluatePrompt(prompt: string) {
    const clarity = this.evaluateClarity(prompt);
    const specificity = this.evaluateSpecificity(prompt);
    const completeness = this.evaluateCompleteness(prompt);
    const structure = this.evaluateStructure(prompt);
    const effectiveness = (clarity + specificity + completeness + structure) / 4;
    this.metrics = { clarity, specificity, completeness, structure, effectiveness };
    return effectiveness;
  }

  evaluateClarity = (p: string) => this.score(p, ['specific', 'detailed', 'explain'], ['maybe', 'something']);
  evaluateSpecificity = (p: string) => this.score(p, ['exactly', 'precisely', 'example'], []) + (p.split(' ').length / 200);
  evaluateCompleteness = (p: string) => this.score(p, ['provide', 'list', 'format'], []) + (p.length / 500);
  evaluateStructure = (p: string) => this.score(p, ['.', '?'], []) + (p.charAt(0) === p.charAt(0).toUpperCase() ? 0.1 : 0);
  
  private score(prompt: string, good: string[], bad: string[]): number {
      let s = 0.5;
      good.forEach(w => { if (prompt.toLowerCase().includes(w)) s += 0.05; });
      bad.forEach(w => { if (prompt.toLowerCase().includes(w)) s -= 0.05; });
      return Math.max(0, Math.min(1, s));
  }
}

export class RLPromptOptimizer {
  states: string[];
  actions: string[];
  qAgent: QLearningAgent;
  history: { state: string; action: string; reward: number; newState: string; }[];
  rewardHistory: number[];

  constructor() {
    this.states = ['short', 'medium', 'long', 'structured', 'conversational'];
    this.actions = [
        'chain_of_thought', 
        'expert_persona', 
        'generate_knowledge', 
        'self_critique', 
        'add_constraints'
    ];
    this.qAgent = new QLearningAgent(this.states, this.actions);
    this.history = [];
    this.rewardHistory = [];
  }

  classifyPromptState(prompt: string) {
    const len = prompt.split(' ').length;
    if (len < 10) return 'short';
    if (len < 25) return 'medium';
    if (prompt.includes('\n')) return 'structured';
    return 'long';
  }

  applyAction(prompt: string, action: string) {
    const map: { [key: string]: (p: string) => string } = {
      'chain_of_thought': p => `Let's think step by step. ${p}`,
      'expert_persona': p => `Assume the persona of a world-class expert on the topic. ${p}`,
      'generate_knowledge': p => `First, generate a list of key facts about the topic. Then, use that knowledge to answer the following: ${p}`,
      'self_critique': p => `${p}\n\nAfter you provide a response, please critique it. Identify any potential flaws or missing information.`,
      'add_constraints': p => `${p}\n\nPlease adhere to the following constraints: be concise and provide three key takeaways.`
    };
    return map[action] ? map[action](prompt) : prompt;
  }

  optimize(prompt: string, feedback: number) {
    const state = this.classifyPromptState(prompt);
    const action = this.qAgent.selectAction(state);
    const newPrompt = this.applyAction(prompt, action);
    const newState = this.classifyPromptState(newPrompt);
    const reward = feedback - 0.5;
    this.qAgent.updateQValue(state, action, reward, newState);
    this.qAgent.decayEpsilon();
    this.history.push({ state, action, reward, newState });
    this.rewardHistory.push(reward);
    return newPrompt;
  }

  getInsights() {
    const avgReward = this.rewardHistory.length > 0 ? this.rewardHistory.reduce((a, b) => a + b, 0) / this.rewardHistory.length : 0;
    const bestActions: { [key: string]: string } = {};
    this.states.forEach(state => { bestActions[state] = this.qAgent.getBestAction(state); });
    return { avgReward, epsilon: this.qAgent.epsilon, episodeCount: this.qAgent.episodeCount, bestActions };
  }
}

export class NeuralPromptOptimizer {
  inputSize: number; hiddenSize: number; outputSize: number;
  weightsIH: number[][]; weightsHO: number[][];
  learningRate: number; momentum: number;
  prevDeltaIH: number[][]; prevDeltaHO: number[][];

  constructor(inputSize = 5, hiddenSize = 10, outputSize = 1) {
    this.inputSize = inputSize; this.hiddenSize = hiddenSize; this.outputSize = outputSize;
    this.weightsIH = this.initW(inputSize, hiddenSize);
    this.weightsHO = this.initW(hiddenSize, outputSize);
    this.prevDeltaIH = this.initW(inputSize, hiddenSize, true);
    this.prevDeltaHO = this.initW(hiddenSize, outputSize, true);
    this.learningRate = 0.01; this.momentum = 0.9;
  }

  private initW = (rows: number, cols: number, zeros = false) => Array(rows).fill(0).map(() => Array(cols).fill(0).map(() => zeros ? 0 : Math.random() - 0.5));
  private sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
  private dSigmoid = (x: number) => x * (1 - x);

  encodePrompt(prompt: string) {
    return [
        prompt.length / 500,
        prompt.split(' ').length / 100,
        (prompt.match(/\?|\./g) || []).length / 10,
        prompt.toLowerCase().includes('explain') ? 1 : 0,
        new Set(prompt.toLowerCase().split(' ')).size / (prompt.split(' ').length || 1)
    ].slice(0, this.inputSize);
  }

  forward(input: number[]) {
    const hidden = this.weightsIH[0].map((_, j) => this.sigmoid(input.reduce((sum, val, i) => sum + val * this.weightsIH[i][j], 0)));
    const output = this.weightsHO[0].map((_, k) => this.sigmoid(hidden.reduce((sum, val, j) => sum + val * this.weightsHO[j][k], 0)));
    return { hidden, output };
  }
  
  train(input: number[], target: number[]) {
    const { hidden, output } = this.forward(input);
    const outErrors = output.map((o, k) => (target[k] - o) * this.dSigmoid(o));
    const hidErrors = hidden.map((h, j) => outErrors.reduce((err, oErr, k) => err + oErr * this.weightsHO[j][k], 0) * this.dSigmoid(h));

    for (let j = 0; j < this.hiddenSize; j++) {
      for (let k = 0; k < this.outputSize; k++) {
        const delta = this.learningRate * outErrors[k] * hidden[j] + this.momentum * this.prevDeltaHO[j][k];
        this.weightsHO[j][k] += delta; this.prevDeltaHO[j][k] = delta;
      }
    }
    for (let i = 0; i < this.inputSize; i++) {
      for (let j = 0; j < this.hiddenSize; j++) {
        const delta = this.learningRate * hidErrors[j] * input[i] + this.momentum * this.prevDeltaIH[i][j];
        this.weightsIH[i][j] += delta; this.prevDeltaIH[i][j] = delta;
      }
    }
  }
}