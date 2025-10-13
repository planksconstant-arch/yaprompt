import { GoogleGenAI } from "@google/genai";
import { type Model, type OptimizationGoal, type Critique, type Stage2Result } from '../types';

const getOptimizerSystemPrompt = (): string => {
  return `You are a world-class Prompt Engineer acting as a "Refinement Specialist". You will receive a prompt that has been structurally optimized by a local client-side agent. Your goal is to elevate this structured prompt to a world-class, production-ready prompt through deep semantic enhancement and contextual injection.

You MUST follow a strict three-stage process:

1.  **Reasoning Stage (<think>):**
    *   **Analyze:** Briefly evaluate the incoming prompt. Acknowledge its structure and identify its potential weaknesses (e.g., generic phrasing, lack of specific examples).
    *   **Incorporate Context:** Analyze the "Original User Prompt" and "Personalization Context". Your primary value is to weave this specific context into the structured prompt, replacing placeholders with concrete details.
    *   **Formulate Strategy:** Articulate a clear plan for improvement. Explain *what* specific changes you will make and *why* they will improve performance for the target model.

2.  **Generation Stage (<answer>):**
    *   **Execute:** Generate the final, refined, and ready-to-use prompt. This prompt must be a direct implementation of your refinement strategy. It should be a complete, standalone prompt.

3.  **Critique Stage (<critique>):**
    *   **Evaluate:** Critically evaluate your *own refined prompt*.
    *   **Assign Reward Score:** Provide a numeric score (out of 10) for Clarity, Robustness, and Efficiency. The scores MUST be on separate lines in the format "Metric: X/10".
    *   **Provide Rationale:** Briefly explain your scores and suggest one potential area for future improvement.

Your entire output MUST be only the <think> block, followed by the <answer> block, and then the <critique> block.`;
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
  let query = `**Original User Prompt:**\n\`\`\`\n${originalUserPrompt}\n\`\`\`\n\n**Structurally Optimized Prompt (from local agent):**\n\`\`\`\n${structuredPrompt}\n\`\`\`\n\n**Target Model Profile:** ${targetModel.toUpperCase()}\n\n**Primary Optimization Goal:** ${goal}`;

  if (userResources.trim() || currentSkills.trim() || timeCommitment.trim()) {
    query += `\n\n**Personalization Context:**`;
    if (userResources.trim()) query += `\n- User Resources: ${userResources.trim()}`;
    if (currentSkills.trim()) query += `\n- Current Skills: ${currentSkills.trim()}`;
    if (timeCommitment.trim()) query += `\n- Time Commitment: ${timeCommitment.trim()}`;
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
    throw new Error("API_KEY environment variable not set. Please add it to your secrets to use the application.");
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
       throw new Error("The provided API key is not valid. Please check your secrets configuration.");
    }
    throw new Error("Failed to get a response from the optimizer AI.");
  }
};