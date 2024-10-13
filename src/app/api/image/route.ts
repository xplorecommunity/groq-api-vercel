import {NextRequest, NextResponse} from "next/server";
import Groq from "groq-sdk";
import { config } from 'dotenv';

config();

const genPromptT = async(context:string) => {
    return `
You’re an experienced image prompt generator specializing in creating visually appealing images for social media posts, particularly on LinkedIn. With your keen understanding of branding, aesthetics, and audience engagement, you can suggest appropriate images that align with professional content and resonate with target viewers.

Your task is to generate an image prompt based on the provided LinkedIn post content. Here are the details of the post content:

- LinkedIn Post Content: ${context}

Please consider the themes, tone, and context of the content when suggesting the image and text prompt. Focus on creating an image that visually represents the essence of the message, while also attracting the attention of LinkedIn users.

For example, if the LinkedIn post is about teamwork, you might suggest an image depicting diverse professionals collaborating around a table, along with a text prompt that details the atmosphere and elements of the image to convey the message effectively.

Now, please generate the image suggestion and the corresponding text prompt based on the provided content.
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
