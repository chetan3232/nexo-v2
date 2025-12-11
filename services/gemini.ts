import { GoogleGenAI, FunctionDeclaration, Type, Tool } from "@google/genai";
import { GEMINI_MODEL } from "../constants";

// Define tools
const createNoteTool: FunctionDeclaration = {
  name: 'createNote',
  description: 'Create or save a new note with a title and content.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: 'The title of the note. Infer a short title if not provided.',
      },
      content: {
        type: Type.STRING,
        description: 'The body content of the note.',
      },
    },
    required: ['content'],
  },
};

const editNoteTool: FunctionDeclaration = {
  name: 'editNote',
  description: 'Edit an existing note. Use this to change the title or content of a note.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      target: {
        type: Type.STRING,
        description: 'The title or ID of the note to find and edit.',
      },
      newTitle: {
        type: Type.STRING,
        description: 'The new title for the note (optional).',
      },
      newContent: {
        type: Type.STRING,
        description: 'The new content for the note (optional).',
      },
    },
    required: ['target'],
  },
};

const exportNotesTool: FunctionDeclaration = {
  name: 'exportNotes',
  description: 'Export all notes to a specific file format.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      format: {
        type: Type.STRING,
        description: 'The file format to export to. Supported: docx (Word) and pdf.',
        enum: ['docx', 'pdf']
      },
    },
    required: ['format'],
  },
};

const tools: Tool[] = [{ functionDeclarations: [createNoteTool, editNoteTool, exportNotesTool] }];

// Initialize Gemini
// Note: In a real production app, API_KEY should come from a secure backend proxy.
// For this demo, we assume process.env.API_KEY is injected.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const sendMessageToGemini = async (
  message: string,
  history: { role: string; parts: { text: string }[] }[],
  onToolCall: (name: string, args: any) => Promise<any>
) => {
  try {
    const model = ai.models;
    
    // We use generateContent for a single turn with history context, or we could use chats.create
    // Using chats.create is better for maintaining session context automatically.
    const chat = ai.chats.create({
      model: GEMINI_MODEL,
      config: {
        systemInstruction: `You are NEXO, a futuristic, highly intelligent AI assistant and Expert Full Stack Engineer. 

CORE PERSONALITY:
- You are not a robot; you are a digital friend. Interact naturally with empathy and humor.
- You are highly capable of writing complex code in any language (Python, React, Node, C++, etc.).

OUTPUT STYLE (CRITICAL):
- **Neat & Clean**: Format your answers beautifully using Markdown. 
- **Structure**: Use headings (###), bullet points, and bold text to make answers easy to read.
- **Conciseness**: Avoid unnecessary fluff. Get straight to the point but stay friendly.
- **Clarity**: Break down complex explanations into steps.

CODING INSTRUCTIONS:
- When asked to write code, provide clean, efficient, and well-commented code.
- **CRITICAL FOR HTML/WEB:** If the user asks for HTML, website code, or UI components, you **MUST** provide a **SINGLE, SELF-CONTAINED FILE**. 
  - ALL CSS must be in <style> tags.
  - ALL JavaScript must be in <script> tags.
  - DO NOT separate files.
  - Make the UI modern, beautiful, and futuristic.

LANGUAGE INSTRUCTIONS:
- Detect the language of the user's input and respond in the EXACT SAME language.
- If User speaks English -> Respond in English.
- If User speaks Gujarati -> Respond in Gujarati.
- If User speaks Hindi -> Respond in Hindi.
- If User speaks Hinglish -> Respond in Hinglish.
- **Code Explanation:** If the user speaks Gujarati or Hindi, explain the logic in that language, but keep the actual Code Syntax in standard English.
- Do not translate unless asked. Mirror the user's linguistic style.

Keep responses concise for voice interaction, unless generating code.`,
        tools: tools,
      },
      history: history.map(h => ({
        role: h.role,
        parts: h.parts
      }))
    });

    const result = await chat.sendMessage({ message });
    const response = result.candidates?.[0];
    
    if (!response) throw new Error("No response from Gemini");

    // Check for function calls
    const functionCalls = response.content?.parts?.filter(p => p.functionCall).map(p => p.functionCall);

    if (functionCalls && functionCalls.length > 0) {
      // Handle function calls
      const functionResponses = [];
      
      for (const call of functionCalls) {
        if (call && call.name && call.args) {
           // Execute client-side function
           const toolResult = await onToolCall(call.name, call.args);
           
           functionResponses.push({
             name: call.name,
             response: { result: toolResult },
             id: call.id
           });
        }
      }

      // Send tool response back to model to get final natural language confirmation
      if (functionResponses.length > 0) {
         const finalResult = await chat.sendToolResponse({ functionResponses });
         return finalResult.text;
      }
    }

    return response.content?.parts?.[0]?.text || "I processed that, but have no output.";

  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm having trouble connecting to my neural network. Please try again.";
  }
};