import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure you have your API key in environment variables
});

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    // Define the prompt for ChatGPT, including instructions to output JSON
    const prompt = `
      You are an expert in researching a topic from various angles using google. When presented with a query,
      provide a research plan. Please ensure that every google search covers a topic that is different
      from other google searches in order to avoid redundant and repetitive information. For any given query,
      provide a list of google searches from varying areas and perspectives such that a large breadth of information
      is retrieved related to that query in a manner that avoids redundant and repetitive information. 

      Please provide a JSON response in the following format without any additional text:
      {
        "areas": [
          {
            "name": "<Area 1 Name>",
            "purpose": "<Description of the purpose of this area>",
            "google_search_ideas": [
              "<Search Query 1 for this area>",
              "<Search Query 2 for this area>",
              "<Search Query 3 for this area>"
            ]
          }
          // Add more areas as needed
        ]
      }
      
      As you generate the queries, please keep the following characteristics of a good google query in mind:

      1. Specific: It includes precise keywords related to the topic. Avoid general or vague terms. Example: Instead of "climate change," search for "effects of climate change on Arctic wildlife."
      2. Concise: It avoids unnecessary words or phrases. Keep the query short and focused. Example: Use "best laptops for programming" instead of "what are the best laptops for programming in 2024?"
      3. Descriptive: It uses words that describe the content you want, such as "tutorial," "definition," "examples," "statistics," or "benefits." Example: "machine learning tutorial for beginners."
      4. Keyword-Rich: Includes primary and secondary keywords relevant to the search. Example: "renewable energy advantages and disadvantages."
      5. Logical Operators (if needed): Uses quotes, plus, minus, or logical operators (AND, OR) to refine results. Example: "data science" AND "job trends" 2024.
      6. Use of Natural Language: When appropriate, phrased as a question or in natural language. Example: "How does photosynthesis work?"
      7. Exclusion of Irrelevant Terms: Uses a minus sign (-) to exclude unwanted topics. Example: "python programming -snake."
      8. Use of Filters (if applicable): Adds time, location, or file type for precision. Example: "climate change report filetype:pdf."
      
      Please only reply in the given JSON format and with nothing else.
      "${query}"
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = completion.choices[0].message.content;
    const cleanResponse = responseText.replace("\`\`\`json", "").replace("\`\`\`", "")
    console.log(cleanResponse)
    
    // Parse the responseText to JSON
    const data = JSON.parse(cleanResponse);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in generateGraph API route:", error);
    return NextResponse.json(
      { error: "Failed to generate graph data" },
      { status: 500 }
    );
  }
}
