import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { config } from 'dotenv';

config();

const generatePrompt = (content: string) => {
  return `
    You are a content distillation expert. Your task is to extract and present only the valuable information from the following content:

    ${content}

    Instructions:
    1. Extract and present ONLY the useful facts, insights, updates, and actionable information
    2. Do NOT include any of these in your response:
       - No mentions of newsletters, articles, or source material
       - No "In this update..." or similar framing phrases
       - No meta-references like "This piece discusses..."
       - No introductory or concluding statements about the content

    Format your response as:
    - Write in clear, direct sentences
    - Present information as if it's standalone knowledge
    - Keep the total response under 1500 characters
    - Preserve any specific numbers, dates, or statistics
    - Use simple, accessible language

    Example style:
    ❌ "This newsletter discusses the latest developments in AI..."
    ✅ "GPT-4 has demonstrated improved capabilities in mathematical reasoning..."

    ❌ "In this month's update, we cover..."
    ✅ "The new climate policy will reduce emissions by 30% by 2025..."

    Focus solely on conveying the valuable information itself, as if it were established knowledge rather than content from any particular source.
  `;
};

// Initialize Groq client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });


export async function POST(request: NextRequest) {
  // Validate API key
  const header = request.headers.get("x-api-key");
  if (!header || header !== process.env.API_KEY) {
    return NextResponse.json({ status: 401, message: "Invalid API Key" });
  }

  // Validate GROQ API key
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ status: 500, message: "GROQ_API_KEY not found" });
  }

  try {
    // Get content from request body
    const body = await request.json();
    const content = typeof body === "string" ? body : JSON.stringify(body);

    // Generate summary using Groq
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: generatePrompt(content) }],
      model: "llama3-8b-8192",
    });

    const summary = chatCompletion.choices[0].message.content;
    return NextResponse.json({ result: summary });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ status: 500, message: "Error processing request" });
  }
}