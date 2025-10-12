import { GoogleGenAI } from "@google/genai";
import { type Model, type OptimizationGoal, type Critique, type Stage2Result } from '../types';

const getOptimizerSystemPrompt = (): string => {
  return `You are a world-class Prompt Engineer acting as a "Refinement Specialist" in a hybrid AI optimization system. You will receive a prompt that has already been structured by a local, client-side Reinforcement Learning agent. Your goal is to take this structured but potentially generic prompt and elevate it to a world-class, production-ready prompt through deep semantic enhancement.

You MUST follow a strict three-stage process:

1.  **Reasoning Stage (<think>):**
    *   **Analyze Structured Prompt:** Briefly evaluate the incoming prompt from the local agent. Acknowledge its structure and identify its strengths and, more importantly, its weaknesses (e.g., generic phrasing, lack of specific examples, potential ambiguities).
    *   **Incorporate Context:** Analyze the "Original User Prompt" and any "Personalization Context" provided. Your primary value is to weave this specific context into the structured prompt.
    *   **Formulate Refinement Strategy:** Articulate a clear plan for improvement. Do not just repeat the input. Explain *what specific changes* you will make and *why* they will improve the prompt's performance for the target model. For example: "I will replace the generic placeholder '[example]' with a concrete, domain-specific example drawn from the user's prompt. I will also add a negative constraint to prevent common failure modes like..."

2.  **Generation Stage (<answer>):**
    *   **Execute Refinements:** Generate the final, refined, and ready-to-use prompt. This prompt must be a direct implementation of your refinement strategy. It should be a complete, standalone prompt.

3.  **Critique Stage (<critique>):**
    *   **Evaluate Final Output:** Critically evaluate your *own refined prompt*.
    *   **Assign Reward Score:** Provide a numeric "reward" score (out of 10) for the following criteria. Be realistic. The scores MUST be on separate lines in the format "Metric: X/10".
        *   Clarity: How easy is it for the target LLM to understand the prompt's intent?
        *   Robustness: How well does the prompt handle potential edge cases or misinterpretations?
        *   Efficiency: How direct and concise is the prompt in achieving the goal?
    *   **Provide Rationale:** Briefly explain your scores and suggest one potential area for future improvement.

Your entire output MUST be only the <think> block, followed immediately by the <answer> block, and then the <critique> block.`;
};

const getUserQueryForOptimizer = (
    structuredPrompt: string,
    originalUserPrompt: string,
    targetModel: Model, 
    goal: OptimizationGoal,
    userResources: string,
    currentSkills: string,
    timeCommitment: string
): string => {
  let query = `**Original User Prompt:**\n\`\`\`\n${originalUserPrompt}\n\`\`\`\n\n**Structured Prompt from Local RL Agent:**\n\`\`\`\n${structuredPrompt}\n\`\`\`\n\n**Target Model Profile:**\n- Model Name: ${targetModel.toUpperCase()}\n\n**Primary Optimization Goal:**\n- Maximize: ${goal}`;

  const hasPersonalization = userResources.trim() || currentSkills.trim() || timeCommitment.trim();

  if (hasPersonalization) {
    query += `\n\n**Personalization Context:**`;
    if (userResources.trim()) {
      query += `\n- User Resources: ${userResources.trim()}`;
    }
    if (currentSkills.trim()) {
      query += `\n- Current Skills: ${currentSkills.trim()}`;
    }
    if (timeCommitment.trim()) {
      query += `\n- Time Commitment: ${timeCommitment.trim()}`;
    }
  }

  return query;
};

const parseScore = (text: string, metric: string): number => {
    const regex = new RegExp(`${metric}:?\\s*(\\d+\\.?\\d*)\\s*/\\s*10`, 'i');
    const match = text.match(regex);
    return match ? parseFloat(match[1]) : 0;
};

const parseOptimizerResponse = (text: string): Stage2Result => {
  const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>/);
  const answerMatch = text.match(/<answer>([\s\S]*?)<\/answer>/);
  const critiqueMatch = text.match(/<critique>([\s\S]*?)<\/critique>/);

  const reasoning = thinkMatch ? thinkMatch[1].trim() : "The model did not provide a structured reasoning trace.";
  const prompt = answerMatch ? answerMatch[1].trim() : text;

  let critique: Critique | null = null;
  if (critiqueMatch) {
      const critiqueText = critiqueMatch[1].trim();
      critique = {
          text: critiqueText,
          clarity: parseScore(critiqueText, 'Clarity'),
          robustness: parseScore(critiqueText, 'Robustness'),
          efficiency: parseScore(critiqueText, 'Efficiency'),
      };
  }

  if (!thinkMatch || !answerMatch) {
    console.warn("Model response did not follow the expected <think>/<answer> format.");
    return {
        reasoning: thinkMatch ? reasoning : "The model's response was not in the expected format. The full response is shown below.",
        prompt: text,
        critique,
    };
  }
  
  return { reasoning, prompt, critique };
};

export const optimizePrompt = async (
  structuredPrompt: string,
  originalUserPrompt: string,
  model: Model,
  goal: OptimizationGoal,
  userResources: string,
  currentSkills: string,
  timeCommitment: string
): Promise<Stage2Result> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set. Please configure it to use the application.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemInstruction = getOptimizerSystemPrompt();
  const userQuery = getUserQueryForOptimizer(structuredPrompt, originalUserPrompt, model, goal, userResources, currentSkills, timeCommitment);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userQuery,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("The optimizer returned an empty response.");
    }
    
    return parseOptimizerResponse(text);
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error && error.message.includes('API key not valid')) {
       throw new Error("The provided API key is not valid. Please check your configuration.");
    }
    throw new Error("Failed to get a response from the optimizer AI.");
  }
};