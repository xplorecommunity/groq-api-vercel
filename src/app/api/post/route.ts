import {NextRequest, NextResponse} from "next/server";
import Groq from "groq-sdk";
import { config } from 'dotenv';

config();

const PostGenerationPrompt = async (context: string) => {
  return `
Transform the content into a concise, engaging discussion with a headline-style structure that highlights key takeaways.

**Guidelines for Transformation:**
- **Headline Format**: Summarize the main idea in a punchy, eye-catching title (e.g., *"Anthropic and NVIDIA Growing 💥"*).
- **Core Content**: Present the data or key points succinctly with minimal context (e.g., *"Anthropic now holds 24% of the enterprise AI market, while OpenAI lost 16% share."*).
- Use emojis sparingly for emphasis or to convey excitement.
- Keep sentences short and impactful—avoid lengthy introductions or overly conversational tones.
- Focus on clarity and readability: prioritize direct insights over background or extended context.

**Do:**
- Use bullet points or clear paragraph breaks for structure.
- Keep responses crisp and to the point.
- Provide actionable or interesting takeaways (e.g., *"This shift highlights the growing demand for specialized AI solutions."*).

**Avoid:**
- Extended commentary or philosophical musings.
- Overly technical jargon unless the context demands it.
- First-person singular ("I") or casual openings like "Hey there" or "Let's dive in."

**Structure Example:**
- **Headline**: *"Anthropic and NVIDIA Growing 💥"*
- **Content**: *"Anthropic now holds 24% of the enterprise AI market, while OpenAI lost 16% share. This trend shows how enterprises are diversifying their AI investments."*

Input Context:  
${context}

Goal: Deliver professional, concise, and impactful content tailored for knowledge-sharing discussions.`;
};


const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;


// Helper function to generate response using Groq
async function generateGroqResponse(content: string) {
  if (!groq) {
    throw new Error("GROQ client not initialized");
  }

  const prompt = await PostGenerationPrompt(content);
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
