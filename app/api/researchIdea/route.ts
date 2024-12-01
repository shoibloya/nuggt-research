// app/api/researchIdea/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { tavily } from "@tavily/core";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure your OpenAI API key is set in environment variables
});

export async function POST(request: Request) {
  try {
    const { ideaNodes, rootNodeId } = await request.json(); // ideaNodes is an array of { nodeId, searchQuery }
    const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY }); // Ensure your Tavily API key is set in environment variables
    console.log(ideaNodes)
    let allIdeaNodeResponses = []; // Will store the responses for all ideaNodes under this root node
    let allSources = {}; // Will store the raw content etc. for all URLs, indexed by URL

    // Process each ideaNode one by one
    for (let i = 0; i < ideaNodes.length; i++) {
      const { nodeId, searchQuery } = ideaNodes[i];

      // Fetch search results
      const response = await tvly.search(searchQuery, {
        searchDepth: "advanced",
        includeRawContent: true,
        maxResults: 5,
      });

      console.log("I was here once");

      // Filter out results where rawContent is null
      const validResults = response.results.filter(
        (result) => result.rawContent && result.rawContent.trim() !== ""
      );

      // Store raw content, title, summary, and URL for each result
      validResults.forEach((result) => {
        const { url, title, content, rawContent } = result;
        allSources[url] = {
          title,
          summary: content,
          rawContent,
        };
      });

      // Prepare data for the LLM
      const formattedResults = validResults
        .map((result) => {
          return `Title: ${result.title}\nURL: ${result.url}\nSummary: ${result.content}\nRaw Content: ${result.rawContent}\n`;
        })
        .join("\n---\n");

      // Prepare previous responses for the prompt
      const previousResponsesText = allIdeaNodeResponses
        .map((resp) => resp.bulletPoints)
        .flat()
        .join("\n");

      // Construct the prompt (Unchanged as per your request)
      const prompt = `
You are a research assistant. Extract and summarize content related to the topic "${searchQuery}". Combine information from different sources to mention key information, details, and statistics in 3-4 detailed bullet points. At the end of each bullet point, insert all source URLs using Markdown format by listing the source as the website name (e.g., NYT, Bloomberg).

Do not repeat any points from the previous responses. Do not miss any relevant details.

${previousResponsesText ? `Previous responses:\n${previousResponsesText}` : ""}

Search results for query "${searchQuery}":

${formattedResults}

Provide the output in Markdown format. If no information related to "${searchQuery}" is found. Please reply with "Information Not Found". 
If no information directly related to "${searchQuery}" is found however, some information related to the broader topic is found then please reply with "I did not find information that directly addresses the topic however, I found the following points interesting to expand on: <mention the information in bullet points as explained earlier>".
      `;

      // Call OpenAI API with the prompt (Unchanged)
      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // Use the appropriate model
        temperature: 0,
        messages: [{ role: "user", content: prompt }],
      });

      const responseText = completion.choices[0].message.content;

      // Store the response for this ideaNode, including the associated sources
      allIdeaNodeResponses.push({
        nodeId,
        bulletPoints: responseText.trim(),
        sources: { ...allSources }, // Include the sources relevant to this node
      });

      // Clear allSources for the next iteration to prevent mixing sources between nodes
      allSources = {};
    }

    // Return the responses
    return NextResponse.json({
      rootNodeId,
      responses: allIdeaNodeResponses,
      // Note: The sources are now included within each response under 'sources'
    });
  } catch (error) {
    console.error("Error in researchIdea API route:", error);
    return NextResponse.json(
      { error: "Failed to fetch data from OpenAI." },
      { status: 500 }
    );
  }
}
