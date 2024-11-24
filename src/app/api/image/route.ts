import {NextRequest, NextResponse} from "next/server";
import Groq from "groq-sdk";
import { config } from 'dotenv';

config();

const GenerateImageCommentPrompt = async (context: string) => {
  return `
Analyze this content and create visual representation suggestions:

${context}

1. IMAGE SUGGESTION
Create a detailed prompt for generating an image that:
- Captures the main message visually
- Uses professional and clean aesthetics
- Avoids generic stock photo looks
- Incorporates subtle metaphors or symbolism
- Maintains simplicity and clarity

Format your image prompt (short and clear) as:
SCENE: [Describe the core visual setup in one sentence]
STYLE: [Specify artistic direction in one sentence]
COLORS: [Define color palette in one sentence]
MOOD: [Describe emotional tone in one sentence]
DETAILS: [List specific elements to include in one sentence]

Example Image Prompt:
SCENE: A minimalist workspace with a laptop displaying data visualizations
STYLE: Clean, modern, slightly abstract
COLORS: Deep blues, soft grays, accent of warm orange
MOOD: Professional yet innovative
DETAILS: Subtle tech elements, floating data points, gentle lighting

2. ENGAGEMENT HOOKS
Provide 3 thought-provoking discussion points that:
- Expand on the main topic
- Share practical insights
- Invite reader experiences
- Encourage professional dialogue
- in one sentence each

Provide 3 thought-provoking discussion points that:
- Expand on the main topic
- No Questioning, just give a statement what u feel about the future of this topic
- Any unknown fact about this topic
- max 1-2 sentences each

Format each hook as a single clear statement or question that prompts reflection or response. must be clear and concise - just 1-2 sentences each.

Remember:
- Keep visuals professional but innovative
- Avoid clichéd business imagery
- Focus on storytelling through visuals
- Ensure hooks align with content theme
- STRICLTY Keep the total response under 1500 characters

The goal is to create visual suggestions and discussion points that feel authentic and valuable to professionals.`;
};
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;


// Helper function to generate response using Groq
async function generateGroqResponse(content: string) {
  if (!groq) {
    throw new Error("GROQ client not initialized");
  }

  const prompt = await GenerateImageCommentPrompt(content);
  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama3-8b-8192",
  });
  return completion.choices[0].message.content;
}

// Helper function to generate error response
function errorResponse(status: number, message: string) {
  return NextResponse.json({ status, message });
}



export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const header = request.headers.get("x-api-key");
    if (!header || header !== process.env.API_KEY) {
      return errorResponse(401, "Invalid API Key");
    }

    // Check if Groq client is initialized
    if (!groq) {
      return errorResponse(500, "GROQ client not initialized");
    }

    // Parse request body
    const body = await request.json();

    // Handle different input formats
    let content: string;

    if (typeof body === "string") {
      content = body;
    } else if (body.result) {
      content = JSON.stringify(body.result);
    } else if (body.data) {
      content = JSON.stringify(body.data);
    } else {
      return errorResponse(400, "Missing content in request body");
    }

    // Generate and return response
    const result = await generateGroqResponse(content);
    return NextResponse.json({ result });

  } 
  catch (error) {
    console.error("Error processing request:", error);
    return errorResponse(500, 
      error instanceof Error ? error.message : "Error processing request"
    );
  }
}

export async function GET (request: NextRequest){
    const greeting = "Hello World!!"
    const json = {
        greeting
    };

    return NextResponse.json(json);
}
