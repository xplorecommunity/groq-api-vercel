import {NextRequest, NextResponse} from "next/server";
import Groq from "groq-sdk";
import { config } from 'dotenv';

config();


const PostGenerationPrompt1 = async (context: string) => {
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
1. Opening hook → engaging question or observation (Optional)
2. Key Insights → Share key data or points in 2-3 brief, engaging sentences.
3. Core concept → clear explanation with examples (Straight to point)
4. Practical insights → real-world applications (Optional)
- Keep your post brief and engaging. Aim for around 10 short paragraphs, each 1-2 lines long, to ensure easy readability with emojis and bullet points.

Style Requirements:
- STRICLTY Keep the total response under 1000 characters
- Tone: Warm and informational
- Language: Clear and straightforward, Idiomatic
- Format: Natural paragraphs with smooth transitions, short and crisp, idiomatic.

Voice Examples:
✓ "Ever wondered why distributed systems are so challenging?"
✓ "The beauty of modern databases lies in their simplicity"
✓ "Looking at successful cloud architectures reveals a pattern"
✗ Avoid: "Today we'll explore..." or "In this article..."
✗ Avoid: First-person singular ("I think...")
✗ Avoid: Greetings ("Hey there...")
✗ Avoid: "Let's dive into the world of ..."

Essential Guidelines:
- Focus on valuable insights over basic facts
- Build natural connections between ideas
- Create relatable, practical examples
- End with meaningful takeaways
- Skip meta-references about writing
- Begin directly with substantive content
- Avoid "Imagine a world where...", "welcome to the world of ...", 
- STRICTLY jump directly into the content - no introduction or explanation of what you are giving/doing.

Use this Context:
${context}

The goal: Create engaging, insightful content that feels like knowledge shared among professionals.`;
};


const PostGenerationPrompt = async (context: string) => {
  return `
Transform this content into an engaging, knowledge-sharing discussion that resonates with a broad audience while preserving essential details.
**Transformation Guidelines:**
jump directly into the content - no introduction or explanation
1. **Engaging Start**: Open with a concise and intriguing hook or observation to draw in the reader. For example:  
   *"Anthropic and NVIDIA are making waves in AI—here’s why!"*
2. **Core Content**: Present the key points in an accessible, conversational tone. Maintain focus on the main message without losing the richness of the details.  
   Example:  
   *"Anthropic now commands 24% of the enterprise AI market, marking a significant rise, while OpenAI has seen a 16% drop. This trend highlights shifting industry dynamics."*
3. **Brevity with Depth**: Ensure the content feels full of insights without being overwhelming. Avoid overloading with unnecessary context or technical jargon. 
4. **Relatable Takeaways**: Conclude with meaningful insights or questions to encourage reflection or discussion.  
   Example:  
   *"What does this mean for the future of enterprise AI investments?"*
**Tone and Style:**
- Tone: Professional yet conversational, striking a balance between informative and engaging.
- Format: Short paragraphs or bullet points for readability.
- Voice: Use collective pronouns ("we," "our") and avoid first-person singular or meta-references (e.g., "In this article, we’ll explore...").
- Emojis: Use sparingly and only for emphasis or tone enhancement.  
  Example: *"Anthropic and NVIDIA Growing 💥"*

STRICTLY jump directly into the content - no introduction or explanation of what you are giving/doing.

**Avoid:**
- Excessive commentary or lengthy introductions.
- Greetings ("Hey there"), meta-statements, or first-person perspectives ("I think...").
- Redundant details or overly technical jargon.
- phrases like *"Here's a rewritten version..."*.


**Structure Flow:**
1. **Headline**: Punchy, engaging, and aligned with the main takeaway.  
   Example: *"Anthropic and NVIDIA Growing 💥"*
2. **Key Insights**: Share key data or points in 2-3 brief, engaging sentences.  
   Example: *"Anthropic now holds 24% of the enterprise AI market, while OpenAI has lost 16%. This shift underlines the growing demand for specialized AI solutions."*
3. **Closing Thought**: Offer practical implications or thought-provoking takeaways.  
   Example: *"Could this signal a broader shift in how enterprises approach AI strategy?"*
Input Context:  ${context}
Goal: Transform the provided context into a compelling, insightful post that sparks interest and discussion among professionals.`;
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
