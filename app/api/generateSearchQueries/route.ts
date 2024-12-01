// app/api/generateSearchQueries/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { bulletPointText } = await request.json();

    // Construct the prompt
    const prompt = `
Given the following topic: "${bulletPointText}", generate 3 related Google search queries that would help in researching this topic in depth.

Provide the queries as a JSON array.

Example:
{
    "First search query", 
    "Second search query", 
    "Third search query"
}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // Use the appropriate model
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = completion.choices[0].message.content;
    const cleanResponse = responseText.replace("\`\`\`json", "").replace("\`\`\`", "")

    // Parse the responseText to get the array of search queries
    const searchQueries = JSON.parse(cleanResponse);

    return NextResponse.json({ searchQueries });
  } catch (error) {
    console.error('Error in generateSearchQueries API route:', error);
    return NextResponse.json(
      { error: 'Failed to generate search queries.' },
      { status: 500 }
    );
  }
}
