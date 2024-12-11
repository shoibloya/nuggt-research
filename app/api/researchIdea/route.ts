// app/api/researchIdea/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { tavily } from "@tavily/core";
import FirecrawlApp, { ScrapeResponse } from '@mendable/firecrawl-js'; // Added Firecrawl import

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure your OpenAI API key is set in environment variables
});

const firecrawlApp = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY }); // Initialized FirecrawlApp

const MAX_TRIES = 3; // Define the maximum number of retry attempts

// Helper function to scrape URL with retries
async function scrapeWithRetries(url: string, options: any, retries: number = MAX_TRIES): Promise<ScrapeResponse | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Attempt ${attempt}: Starting...`);
      const result = await firecrawlApp.scrapeUrl(url, options) as ScrapeResponse;
      if (result.success) {
        return result;
      } else {
        console.error(`Attempt ${attempt}: Failed to scrape ${url}: ${result.error}`);
      }
    } catch (error) {
      console.error(`Attempt ${attempt}: Unexpected error while scraping ${url}:`, error);
    }
    // Optional: Add a delay before retrying (e.g., exponential backoff)
    await new Promise(res => setTimeout(res, 1000 * attempt));
  }
  return null;
}

// Helper function to search Tavily with retries
async function tavilySearchWithRetries(tvly: any, query: string, options: any, retries: number = MAX_TRIES): Promise<any> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Attempt ${attempt}: Tavily Search Starting...`);
      const response = await tvly.search(query, options);
      if (response && response.results && response.results.length > 0) {
        return response;
      } else if (response && (!response.results || response.results.length === 0)) {
        return response; // If no results after successful call, just return
      }
    } catch (error) {
      console.error(`Attempt ${attempt}: Unexpected error while searching Tavily for "${query}":`, error);
    }
    await new Promise(res => setTimeout(res, 1000 * attempt));
  }
  return { results: [] }; // Return empty results if all attempts fail
}

export async function POST(request: Request) {
  try {
    const { ideaNode, rootNodeId } = await request.json(); // ideaNode is a single { nodeId, searchQuery }
    const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY }); // Ensure your Tavily API key is set in environment variables
    console.log(ideaNode);

    const { nodeId, searchQuery } = ideaNode;

    // Fetch search results with retries
    const response = await tavilySearchWithRetries(tvly, searchQuery, {
      searchDepth: "advanced",
      includeRawContent: true,
      maxResults: 3,
    });

    console.log("Fetched Tavily results.");

    // Check if there are any results
    if (!response.results || response.results.length === 0) {
      return NextResponse.json({
        response: {
          nodeId,
          bulletPoints: "Information Not Found",
          sources: {},
        },
      });
    }

    // Store raw content, title, summary, and URL for each result
    const allSources: { [key: string]: any } = {}; // Will store the raw content etc. for all URLs, indexed by URL

    for (const result of response.results) {
      const { url, title, content, rawContent } = result;

      if (rawContent && rawContent.trim() !== "") {
        // If rawContent is already available, use it directly
        allSources[url] = {
          title,
          summary: content,
          rawContent: rawContent, // Use existing rawContent
        };
        continue; // Skip scraping with Firecrawl
      }

      // Scrape the URL using Firecrawl with retries only if rawContent is null or empty
      const scrapeResult = await scrapeWithRetries(url, { formats: ['markdown'] });

      if (!scrapeResult) {
        console.error(`All retry attempts failed for ${url}.`);
        allSources[url] = {
          title,
          summary: content,
          rawContent: "",
        };
        continue;
      }

      if (!scrapeResult.success) {
        console.error(`Failed to scrape ${url}: ${scrapeResult.error}`);
        allSources[url] = {
          title,
          summary: content,
          rawContent: "",
        };
        continue;
      }

      allSources[url] = {
        title,
        summary: content,
        rawContent: scrapeResult.markdown, // Use scraped content from Firecrawl
      };
    }

    // After processing all results, filter out those with empty rawContent
    const validSources = Object.entries(allSources).filter(
      ([url, source]: [string, any]) => source.rawContent && source.rawContent.trim() !== ""
    );

    console.log(validSources);

    if (validSources.length === 0) {
      return NextResponse.json({
        response: {
          nodeId,
          bulletPoints: "Information Not Found",
          sources: {},
        },
      });
    }

    // Function to generate prompt for each result (single paragraph)
    const generatePrompt = (url: string, result: any): string => {
      const { title, content, rawContent } = result;

      console.log(`Focussing on: ${url}`);
      return `
You are a research assistant. Extract all content related to the topic "${searchQuery}". Mention all key information, details, and statistics in 3-4 detailed bullet points. At the end of each bullet point, insert the source URL using Markdown format by listing the source as the website name (e.g., NYT, Bloomberg).
Search results for query "${searchQuery}":
**Title:** ${title}
**URL:** ${url}
**Summary:** ${content}
**Raw Content:** ${rawContent}

Provide the output in Markdown format. If no information related to "${searchQuery}" is found, please reply with "Information Not Found". 
If no information directly related to "${searchQuery}" is found however, some information related to the broader topic is found then please reply with "I did not find information that directly addresses the topic however, I found the following points interesting to expand on: <mention the information in bullet points as explained earlier>".
`;
    };

    // Array to hold all paragraphs from each OpenAI response
    const allParagraphs: string[] = [];

    // Prepare all OpenAI calls concurrently
    const openaiPromises = validSources.map(async ([url, source]) => {
      const prompt = generatePrompt(url, source);

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o", // Use your specified model
          temperature: 0,
          messages: [{ role: "user", content: prompt }],
        });

        const responseText = completion.choices[0].message.content.trim();

        if (responseText !== "Information Not Found") {
          return responseText;
        } else {
          // Handle case where no information is found for this result
          return `*No information found for [${source.title}](${url}).*`;
        }
      } catch (openAIError) {
        console.error(`OpenAI API error for result ${url}:`, openAIError);
        return `*Failed to fetch information for [${source.title}](${url}).*`;
      }
    });

    const resolvedParagraphs = await Promise.all(openaiPromises);
    resolvedParagraphs.forEach(paragraph => {
      allParagraphs.push(paragraph);
    });

    // Combine all paragraphs into bullet points
    const combinedBulletPoints = allParagraphs
      .map(paragraph => `- ${paragraph}`)
      .join("\n\n");
    
    console.log(combinedBulletPoints);

    const finalPrompt = `The user wants to know: '${searchQuery}'\n\nFrom the following content:\n\n${combinedBulletPoints}\n\nPlease write a response that directly addresses the user's needs. Please insert the source URL (in-line) using Markdown format by listing the source as the website name (e.g., [New York Times](https://www.nytimes.com)). If there are multiple responses to ${searchQuery}, please mention all of them. If multiple sources point to the same information, then please mention the information once however insert the source URL using Markdown format (in-line) by listing the sources next to each other by their website name (e.g., NYT, Bloomberg). Please provide sources for all information in the same markdown format. 
Please ensure that your response directly addresses the user's needs. It is preferred to have a detailed response that directly addresses ${searchQuery}. However, we do **not** prefer a response that is detailed but the details do not address ${searchQuery} directly but are only related to the broad topic. For example, when talking about best practices for topic X, you do not need to define topic X just mention the best practices.
Lastly, we do not want the user to read your entire detailed answer, so be strategic about highlighting the important points by making them bold using markdown. Phrase your answer in such a way where if the user only reads the highlighted lines, the user is able to understand 80% of all the details. Ensure that the lines you highlight, if I remove everything else but the highlighted lines and put the highlighted lines together, then the resulting answer is actually a summary of your detailed answer. 
So be strategic about what you highlight, it should flow well. Lastly, Do not use bullet points in your answer. Write your answer in paragraphs.`

    const completionFinal = await openai.chat.completions.create({
      model: "gpt-4o", // Use your specified model
      temperature: 0,
      messages: [{ role: "user", content: finalPrompt }],
    }); 

    const responseTextFinal = completionFinal.choices[0].message.content.trim();

    // Return the combined response for this ideaNode
    return NextResponse.json({
      response: {
        nodeId,
        bulletPoints: responseTextFinal,
        sources: allSources, // Include the sources relevant to this node
      },
    });

  } catch (error) {
    console.error("Error in researchIdea API route:", error);
    return NextResponse.json(
      { error: "Failed to fetch data from OpenAI." },
      { status: 500 }
    );
  }
}
