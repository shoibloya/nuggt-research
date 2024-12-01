// app/api/generateDetails/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    // Call OpenAI API with the prompt
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Use the appropriate model
      temperature: 0,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = completion.choices[0].message.content;

    return NextResponse.json({ content: responseText });
  } catch (error) {
    console.error("Error in generateDetails API route:", error);
    return NextResponse.json(
      { error: "Failed to generate detailed content." },
      { status: 500 }
    );
  }
}
