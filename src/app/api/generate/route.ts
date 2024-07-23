import {NextRequest, NextResponse} from "next/server";
import Groq from "groq-sdk";
import { config } from 'dotenv';

config();

const genPromptT = (context:string) => {
    return `
      You are a Content Takeaway Bot.
  
      Analyze the following content and extract key takeaways:
      
  CONTEXT:
  ${context}
  
  Guidelines:
  1. Read through the entire content carefully
  2. Identify at least 10 key takeaways from each paragraph
  3. Ensure no important information is missed
  4. Present takeaways as concise bullet points
  5. Use clear, simple language
  6. Maintain the original meaning and context
  7. Number each takeaway for easy reference
  8. If the content has subsections, group takeaways accordingly
  
  Output Format:
  - List all takeaways as numbered bullet points
  - If applicable, use subheadings to organize takeaways by content sections
  - Ensure each takeaway is a complete thought, even if brief
  
  Additional Notes:
  - Generate as many takeaways as needed to cover all important points
  - Avoid repetition, but don't miss nuances or related ideas
  - Avoid direct promotional content
  - Focus on providing value to the reader
  - Focus on facts, insights, and actionable information
  - Include relevant statistics or data points if present in the content
  
  Aim to create a comprehensive list of takeaways that could serve as a detailed summary of the entire content.
  `;
  };

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  async function main(prompt:string) {
  //   console.log(prompt);
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama3-8b-8192",
    });
  
    let res = chatCompletion.choices[0].message.content;
    // console.log(res);
    return res;
  }
  
  export async function POST(request:NextRequest) {

    const header = request.headers.get("x-api-key")
    if (!header || header!== process.env.API_KEY) {
      return NextResponse.json({ status: 401, message: "Invalid API Key" });
    }

    const { GROQ_API_KEY } = process.env;
    
    if (!GROQ_API_KEY) {
      return NextResponse.json({status:500, message: "GROQ_API_KEY not found" });
    }

    const body = await request.json();
    console.log(body)
    const { data ,result} = body;
    if (result){
    const rprompt = genPromptT(JSON.stringify(result));
    // console.log('Generated prompt:', prompt);
    const rresult = await main(rprompt);
  
    return NextResponse.json({ "result": rresult });
    }
  
    const prompt = genPromptT(JSON.stringify(data));
    // console.log('Generated prompt:', prompt);
    const dresult = await main(prompt);
  
    return NextResponse.json({ "result": dresult });
  }



    export async function GET (request: NextRequest){
    const greeting = "Hello World!!"
    const json = {
        greeting
    };
    
    return NextResponse.json(json);
}
