// app/api/researchIdea/route.ts
import { NextResponse } from "next/server";

const perplexityToken = process.env.PERPLEXITY_TOKEN || "";

const MAX_TRIES = 3; // Retain if needed, though we do a single Perplexity call here

export async function POST(request: Request) {
  try {
    // We still retrieve ideaNode (and rootNodeId if needed) from the request JSON
    const { ideaNode, rootNodeId } = await request.json(); // { nodeId, searchQuery }
    console.log(ideaNode);

    const { nodeId, searchQuery } = ideaNode;

    // --- Replace all the Tavily/Firecrawl/OpenAI logic with a single Perplexity request. ---
    // If you need multiple attempts, you can wrap this in a retry loop or handle errors accordingly.

    // Build the request body for Perplexity
    const perplexityBody = {
      model: "sonar-pro",
      messages: [
        {
          role: "system",
          content:
            "Be precise and detailed. Write your answer in 3-4 detailed paragraphs. No subheadings. No bullet points. Highlight important parts by making the text bold. Always provide in-text citations in markdown e.g. [NYT](https://nytimes.com)",
        },
        { role: "user", content: searchQuery },
      ],
      temperature: 0.2,
      top_p: 0.9,
      search_domain_filter: ["perplexity.ai"],
      return_images: false,
      return_related_questions: false,
      search_recency_filter: "month",
      top_k: 0,
      stream: false,
      presence_penalty: 0,
      frequency_penalty: 1,
      response_format: null,
    };

    // Make the Perplexity API call
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${perplexityToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(perplexityBody),
    });

    if (!res.ok) {
      console.error(`Failed to fetch from Perplexity. Status: ${res.status}`);
      return NextResponse.json(
        { error: "Failed to fetch from Perplexity." },
        { status: 500 }
      );
    }

    const data = await res.json();
    console.log("Fetched Perplexity response:", data);

    // The main text answer from Perplexity
    const responseTextFinal =
      data?.choices?.[0]?.message?.content?.trim() || "Information Not Found";

    // Build your sources object from the Perplexity `citations` array
    const allSources: { [key: string]: any } = {};
    if (data?.citations && Array.isArray(data.citations)) {
      data.citations.forEach((citationUrl: string) => {
        allSources[citationUrl] = {
          title: "",
          summary: "",
          rawContent: "",
        };
      });
    }

    // --- Return the response in the same final structure as before ---
    return NextResponse.json({
      response: {
        nodeId,
        bulletPoints: responseTextFinal, // The Perplexity answer as bulletPoints equivalent
        sources: allSources,            // The new source mapping from Perplexity citations
      },
    });
  } catch (error) {
    console.error("Error in researchIdea API route:", error);
    return NextResponse.json(
      { error: "Failed to fetch data from Perplexity." },
      { status: 500 }
    );
  }
}
