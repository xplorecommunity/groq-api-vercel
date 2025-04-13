import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { config } from 'dotenv';

config(); // Load environment variables from .env file

// --- Prompt Definition ---
const PostGenerationPrompt = async (context: string) => {
  // Note: Instructions within the prompt remain crucial even with response_format,
  // as they guide the *content* and *structure* of the JSON fields.
  return `
  Transform this Input Context into a punchy, narrative-driven post mimicking viral social media storytelling, outputting the result as a JSON object.

  **Instructions & Rules:**

  1.  **Hook Creation**:
      * Start the post content with a bold, attention-grabbing statement.
      * Use a dramatic, personal tone.
      * Hint at insider knowledge.
      * Leverage curiosity gap.

  2.  **Content Transformation Rules**:
      * Write the post content as if sharing a personal, high-stakes narrative.
      * Use short, punchy sentences, short paragraphs (separated by new lines).
      * Leverage numbered/bulleted insights where appropriate within the narrative flow.
      * Embed rhetorical phrases.
      * Embed justifying summary with numbers/data if present in the context.
      * Create tension and anticipation.

  3.  **Tone Mandates**:
      * Sound like an insider with exclusive information.
      * Use conversational, direct language.
      * Inject personal commentary where it enhances the narrative.
      * Maintain high-energy, motivational undertone.

  4.  **Structural Requirements (for postContent)**:
      * Maximum 1500 characters for the post content.
      * Include 3-4 key insights derived from the context.
      * End the post content with a call-to-action or provocative question.
      * Optional: Include a personal credibility statement if it fits the narrative.

  5.  **Stylistic Signatures (for postContent)**:
      * Use dramatized language.
      * Hint at "secret" or "little-known" information.
      * Create sense of urgency.
      * Imply transformative potential of shared knowledge.

  6.  **Completeness Mandate**:
      * **Crucially, ensure every single detail, nuance, fact, and key point from the Input Context is fully and accurately incorporated into the generated post content.**
      * **Do not omit *any* information, however small.** The summarization must be exhaustive, clear, and fully cover the provided context.

  7.  **Output Format**:
      * **Strictly provide the response *only* as a valid JSON object.** (Reinforced by API parameter)
      * The JSON object must have exactly two keys:
          * `"title"`: A compelling, short title for the post (less than 70 characters ideally).
          * `"postContent"`: The generated post string, adhering to all the rules above.
      * **Example JSON structure:** \`{"title": "Example Title Here", "postContent": "The full generated post content adhering to all rules..."}\`
      * **Do not include any introductory text, explanations, greetings, apologies, or anything outside the single JSON object.**

  **Avoid (in the final JSON output):**
  -   Any text before or after the JSON object.
  -   Greetings ("Hey there"), meta-statements ("Here's the JSON..."), or first-person perspectives ("I think...").
  -   Redundant details or overly technical jargon unless present in the input context.
  -   Phrases like *"Here's a rewritten version..."*.

  --- For other non-main takeaways (If applicable based on context, include within the postContent structure, e.g., as bullet points if appropriate) ---
  Just the bullet points (short and straight to point) integrated naturally into the post.

  **Input Context:** ${context}

  **Goal:** Transform the provided context into a compelling, insightful post, presented as a JSON object containing a title and the full post content. The post content must completely and accurately represent *all* information from the input context. The output *must* be a valid JSON object.
  `;
};

// --- Groq Client Initialization ---
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
if (!process.env.GROQ_API_KEY) {
    console.warn("GROQ_API_KEY environment variable not set. Groq client will not be initialized.");
}

// --- Helper function to generate response using Groq ---
async function generateGroqResponse(content: string): Promise<{ title: string; postContent: string }> {
  if (!groq) {
    throw new Error("GROQ client not initialized. Check GROQ_API_KEY environment variable.");
  }

  const prompt = await PostGenerationPrompt(content);
  // Optional: Log the prompt for debugging
  // console.log("Generated Prompt:", prompt);

  try {
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.1-8b-instant", // Ensure this model supports JSON mode well
        temperature: 0.7,
        top_p: 1,
        // --- Use JSON mode ---
        response_format: { type: "json_object" },
      });

      const rawResponse = completion.choices[0]?.message?.content;
      // Optional: Log the raw response
      // console.log("Raw Groq Response:", rawResponse);

      if (!rawResponse) {
          throw new Error("Received empty response content from Groq");
      }

      // --- Parse and Validate JSON (Still Recommended as a Safeguard) ---
      let parsedJson: any;
      try {
        parsedJson = JSON.parse(rawResponse);
      } catch (parseError) {
        console.error("Failed to parse Groq response as JSON:", parseError);
        console.error("Raw response that failed parsing:", rawResponse);
        throw new Error(`Groq response was not valid JSON despite requesting JSON mode. Response received: ${rawResponse}`);
      }

      // Validate the structure
      if (typeof parsedJson !== 'object' || parsedJson === null || typeof parsedJson.title !== 'string' || typeof parsedJson.postContent !== 'string') {
          console.error("Parsed JSON structure is invalid:", parsedJson);
          throw new Error(`Groq response JSON did not match the expected structure ({title: string, postContent: string}). Received: ${JSON.stringify(parsedJson)}`);
      }

      return parsedJson as { title: string; postContent: string };

  } catch (groqError) {
      console.error("Error calling Groq API:", groqError);
      // Re-throw or handle specific Groq API errors
      throw new Error(`Failed to get completion from Groq: ${groqError instanceof Error ? groqError.message : String(groqError)}`);
  }
}

// --- Helper function to generate error response ---
function errorResponse(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

// --- API Route: POST Handler ---
export async function POST(request: NextRequest) {
  // Check if Groq client is available early
  if (!groq) {
    return errorResponse(503, "Service unavailable: GROQ client not initialized.");
  }

  try {
    // Validate API key
    const header = request.headers.get("x-api-key");
    if (!header || header !== process.env.API_KEY) {
      // It's often better not to reveal *which* key is invalid in production
      return errorResponse(401, "Unauthorized");
    }

    // Parse request body
    let body;
    try {
        body = await request.json();
    } catch (e) {
        return errorResponse(400, "Invalid JSON request body");
    }

    // --- Input Content Extraction ---
    let content: string;
    if (typeof body === "string") {
      content = body; // Allow raw string input
    } else if (body && typeof body === 'object') {
        // Prioritize specific keys, then fallback to stringifying the object
        if (body.content && typeof body.content === 'string') {
            content = body.content;
        } else if (body.text && typeof body.text === 'string') { // Added 'text' key check
            content = body.text;
        } else if (body.data && typeof body.data === 'string') {
            content = body.data;
        } else if (body.result && typeof body.result === 'string') {
            content = body.result;
        }
         else {
            // Fallback: Stringify the entire body object.
            // Might be useful if the input context *is* a structured JSON itself.
            content = JSON.stringify(body);
        }
    } else {
      // If body is not string or object (e.g., array, null, number)
      return errorResponse(400, "Invalid request body format. Expected JSON object or raw string.");
    }

    // Check for empty content after extraction
    if (!content || content.trim() === '{}' || content.trim() === '') {
         return errorResponse(400, "Missing or empty content provided");
    }

    // --- Generate Response using Groq ---
    const result = await generateGroqResponse(content); // result is { title: string, postContent: string }

    // --- Return Successful Response ---
    return NextResponse.json(result, { status: 200 });

  }
  catch (error) {
    // Log the detailed error server-side
    console.error("Error processing POST request:", error);

    // Provide a generic error message to the client
    const errorMessage = error instanceof Error ? error.message : "Internal server error processing request";
    // Determine status code based on common error messages if possible
    let statusCode = 500; // Default to Internal Server Error
    if (errorMessage.includes("Unauthorized") || errorMessage.includes("Invalid API Key")) {
        statusCode = 401;
    } else if (errorMessage.includes("Invalid JSON") || errorMessage.includes("Missing or empty content")) {
        statusCode = 400;
    } else if (errorMessage.includes("GROQ client not initialized")) {
        statusCode = 503; // Service Unavailable
    }

    return errorResponse(statusCode, `Failed to process request: ${errorMessage}`); // Include the caught error message for context
  }
}

// --- API Route: GET Handler ---
export async function GET (request: NextRequest){
    const statusMessage = "API is operational.";
    const timestamp = new Date().toISOString(); // Add timestamp for liveliness check
    const json = {
        message: statusMessage,
        status: "OK",
        currentTime: timestamp, // Based on server time
        currentDate_ISO: new Date().toISOString().split('T')[0], // Add date info
        currentLocation_Note: "Server location may differ from user location (Context: India)", // From user context
    };

    return NextResponse.json(json);
}
