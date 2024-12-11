import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { nodeContent, highlightedText } = await request.json();

    const prompt = `
You are a researcher. Given the full node content below and a highlighted portion the user is interested in, generate exactly 3 Google search queries that would help find more details about the highlighted part.

Node Content:
"${nodeContent}"

Highlighted Text:
"${highlightedText}"

Output as JSON:
{
  "searchQueries": [
    "query_1",
    "query_2",
    "query_3"
  ]
}
    `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // Use the appropriate model
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = completion.choices[0].message.content;
    const cleanResponse = responseText.trim().replace(/```json|```/g, '');
    const data = JSON.parse(cleanResponse);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in generateSearchQueries API route:', error);
    return NextResponse.json(
      { error: 'Failed to generate search queries.' },
      { status: 500 }
    );
  }
}
