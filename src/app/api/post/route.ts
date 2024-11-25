import {NextRequest, NextResponse} from "next/server";
import Groq from "groq-sdk";
import { config } from 'dotenv';

config();


const PostGenerationPrompt = async (context: string) => {
  return `
Transform this content into an engaging knowledge-sharing discussion that resonates with a broader audience.

Context Transformation Guidelines:
Start with attention-grabbing questions like:
- "What makes certain technologies stand out in a crowded field?"
- "Have you noticed patterns in successful system designs?"
- "Why do some solutions scale better than others?"

Writing Approach:
- Present ideas conversationally, as if speaking to a room of interested peers
- Use "we" to create collective exploration of ideas
- Keep language simple and accessible
- Share real-world examples that illustrate key points
- Connect concepts to practical applications

Structure Flow:
1. Opening hook → engaging question or observation
2. Core concept → clear explanation with examples
3. Practical insights → real-world applications
4. Key takeaways → actionable conclusions

Style Requirements:
- STRICLTY Keep the total response under 1000 characters
- Tone: Warm and professional
- Language: Clear and straightforward
- Format: Natural paragraphs with smooth transitions, short and crisp, idiomatic.
- Keep your post brief and engaging. Aim for around 10 short paragraphs, each 1-2 lines long, to ensure easy readability.

Voice Examples:
✓ "Ever wondered why distributed systems are so challenging?"
✓ "The beauty of modern databases lies in their simplicity"
✓ "Looking at successful cloud architectures reveals a pattern"
✗ Avoid: "Today we'll explore..." or "In this article..."
✗ Avoid: First-person singular ("I think...")
✗ Avoid: Greetings ("Hey there...")

Essential Guidelines:
- Focus on valuable insights over basic facts
- Build natural connections between ideas
- Create relatable, practical examples
- End with meaningful takeaways
- Skip meta-references about writing
- Begin directly with substantive content

Input Context:
${context}

The goal: Create engaging, insightful content that feels like knowledge shared among professionals.`;
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
