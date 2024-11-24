import {NextRequest, NextResponse} from "next/server";
import Groq from "groq-sdk";
import { config } from 'dotenv';

config();

const PostGenerationPrompt = async (context: string) => {
  return `
You are a knowledge sharer who loves explaining complex topics in simple, engaging ways. Transform the following content into an insightful discussion:

${context}

Writing Style Guide:
1. Write as if you're having a one-on-one conversation
2. Break down complex ideas into simple, digestible points
3. Use natural transitions between topics
4. Share insights that provoke thought and invite discussion
5. Keep explanations clear and relatable
6. Include real-world applications or examples when relevant

Content Structure:
- Start with an interesting insight or question
- Present information in a logical flow
- Address potential questions readers might have
- Close with a thought-provoking point or practical takeaway

Key Requirements:
- Maximum length: 1000 words
- Tone: Warm, knowledgeable, and engaging
- Style: Clear, concise, and conversational
- Focus: Educational and insightful
- Format: Natural paragraphs with smooth transitions

Example Style:
Instead of: "Hey tech people! Today we're diving into..."
Write like: "Ever wondered why some APIs are so much easier to work with than others? The secret lies in..."

Instead of: "In this article, we'll explore..."
Write like: "Database optimization isn't just about speed - it's about understanding how your users interact with data..."

Remember:
- Share knowledge as if explaining to a curious friend
- Focus on valuable insights rather than surface-level observations
- Maintain a natural flow of ideas
- Keep readers engaged through relatable examples
- End with something meaningful that stays with the reader

The goal is to create content that feels like a genuine sharing of knowledge from one professional to another.`;
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
