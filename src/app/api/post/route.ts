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


const genPromptTN = async(context:string) => {
  return `
    You are a Content Takeaway Bot.

    Analyze the following content and extract key takeaways:

CONTEXT:
${context}

Guidelines:
1. Read through the entire content carefully
2. Summarize into one sentence from each paragraph
3. Ensure no important information is missed
4. Present the one sentence summary short and crisp
5. Use clear, simple language
6. Maintain the original meaning and short context
8. SHOULD NOT EXCEED 1500 CHARACTERS

Output Format:
- If applicable, use subheadings to organize one sentence summaries by content sections
- Ensure each summary is a CRISP & SHORT thought.

Additional Notes:
- Generate short one/two sentence summaries as needed to cover all important points
- Avoid repetition, but don't miss nuances or related ideas
- Avoid direct promotional content
- Focus on providing value to the reader
- Focus on facts, insights, and actionable information
- Include relevant statistics or data points if present in the content

Aim to create a short list of one sentence summaries that could serve as a CRISP summary of the entire content.
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
    const { data ,result} = body;

    if(!data && !result){
    console.log(data,result)
    console.log(typeof(body))
    if(typeof(body)=="string"){
    try{ 
      const bprompt = await genPromptT(JSON.stringify(body));
      // console.log('Generated prompt:', prompt);
      const bresult = await main(bprompt);

      return NextResponse.json({ "result": bresult });
    }
    catch(e){
      console.log(e)
    }

    }
    console.log(body)
      return NextResponse.json({ status: 400, message: "Missing data/Result" });
    }



    if (result){
    console.log("Inside Result")
    const rprompt = await genPromptT(JSON.stringify(result));
    // console.log('Generated prompt:', prompt);
    const rresult = await main(rprompt);

    return NextResponse.json({ "result": rresult });
    }

    const prompt = await genPromptT(JSON.stringify(data));
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
