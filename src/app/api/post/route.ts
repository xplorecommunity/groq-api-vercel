import {NextRequest, NextResponse} from "next/server";
import Groq from "groq-sdk";
import { config } from 'dotenv';

config();


const PostGenerationPrompt = async (context: string) => {
  return `

  Transform this Input Context into a punchy, narrative-driven post mimicking viral social media storytelling
  
  1. **Hook Creation**:
     - Start with a bold, attention-grabbing statement
     - Use dramatic, personal tone
     - Hint at insider knowledge
     - Leverage curiosity gap
  
  2. **Content Transformation Rules**:
     - Write as if sharing a personal, high-stakes narrative
     - Use short, punchy sentences, short paragraphs (separated by new lines)
     - Leverage numbered/bulleted insights
     - Embed rhetorical questions
     - Create tension and anticipation
  
  3. **Tone Mandates**:
     - Sound like an insider with exclusive information
     - Use conversational, direct language
     - Inject personal commentary
     - Maintain high-energy, motivational undertone
  
  4. **Structural Requirements**:
     - Maximum 1000 characters
     - Include 3-4 key insights
     - End with a call-to-action or provocative question
     - Optional: Include personal credibility statement
  
  5. **Stylistic Signatures**:
     - Use dramatized language
     - Hint at "secret" or "little-known" information
     - Create sense of urgency
     - Imply transformative potential of shared knowledge
  
  STRICTLY Jump give me post content - no introduction or explanation of what you are giving/doing
  
  **Avoid:**
  - Excessive commentary or lengthy introductions.
  - Greetings ("Hey there"), meta-statements, or first-person perspectives ("I think...").
  - Redundant details or overly technical jargon.
  - phrases like *"Here's a rewritten version..."*.
  
  --- For other non-main takeaways ---
  Just the bullet points (short and straight to point)
  
  Input Context:  ${context}
  Goal: Transform the provided context into a compelling, insightful post that sparks interest and discussion among professionals. Cover all the points in the given context.
  
  `;
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
    model:"llama-3.1-8b-instant",
    "temperature": 1,
    "top_p": 1,
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
