// app/api/researchDetails/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { tavily } from '@tavily/core';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

    // Fetch search results
    const response = await tvly.search(query, {
      searchDepth: 'advanced',
      includeRawContent: true,
      maxResults: 3,
    });

    // Filter out results where rawContent is null
    const validResults = response.results.filter(
      (result) => result.rawContent && result.rawContent.trim() !== ''
    );

    // Store raw content, title, summary, and URL for each result
    const allSources = {};
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
      .join('\n---\n');

    // Construct the prompt
    const prompt = `
You are a skilled writer. Using the following search results, extract every detail (even the trivial ones) related to: "${query}". Include all relevant information. Do not miss any relevant details.

Write your findings in 4-5 detailed bullet points.

Please mention all sources in-line using markdown format for each bullet point. For the source, use the source name as display.

Search results:
${formattedResults}

Provide the output in Markdown format.
    `;

    // Call OpenAI API with the prompt
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // Use the appropriate model
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = completion.choices[0].message.content;

    return NextResponse.json({
      content: responseText.trim(),
      sources: allSources,
    });
  } catch (error) {
    console.error('Error in researchDetails API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from OpenAI.' },
      { status: 500 }
    );
  }
}
