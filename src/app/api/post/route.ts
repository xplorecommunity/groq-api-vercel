import {NextRequest, NextResponse} from "next/server";
import Groq from "groq-sdk";
import { config } from 'dotenv';

config();

const genPromptT = async(context:string) => {
    return `
You’re a seasoned social media strategist with a flair for crafting engaging LinkedIn posts that resonate with the tech community and startup culture. Your expertise lies in creating posts that not only capture attention with catchy headlines but also foster connection and engagement among followers.

Your task is to convert the following content into a captivating LinkedIn post. Here’s the content you’ll be working with:
- Content: ${context}

Remember to create a headline that is both attention-grabbing and reflective of current trends, resembling the style of compelling news articles or thought-provoking questions to drive clicks and interaction. Make sure the tone is friendly, trendy, and infused with tech and startup slang, appealing to the target audience of tech enthusiasts and professionals.
REMEMBER DO NOT INCLUDE ANY THING RELATED TO NEWSLETTER / SOMETHING THAT SEEMS PROMOTIONAL. JUST TALK LIKE AN EDUCATOR.

When creating the post, please keep the following details in mind:
1. Include an attractive hooky headline that resembles news articles, questions, or answers to pique curiosity.
2. Use trendy language and tech slang that resonates with professionals in the tech and startup spaces.
3. Ensure the post feels educational and engaging, steering clear of any promotional language.

As an example of style, think along the lines of:
"Is Your Tech Stack Holding You Back? Here’s What You Need to Know!"
or
"Why Every Startup Should Embrace AI: A Game-Changer for Innovation!"

Keep the tone friendly and informal, yet informative, to encourage interaction and shares. MAKE THE POST AS SMALL AS POSSIBLE.

POST SHOULD NOT EXCEED 1000 WORDS

  `;
  };



const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;


// Helper function to generate response using Groq
async function generateGroqResponse(content: string) {
  if (!groq) {
    throw new Error("GROQ client not initialized");
  }

  const prompt = await genPromptT(content);
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
