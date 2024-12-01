// api/followUp/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure you have your API key in environment variables
});

export async function POST(request: Request) {
  try {
    const { topic, content } = await request.json();

    // Define the prompt for ChatGPT, including instructions to output JSON
    const prompt = `
      You are an expert researcher. The following is the content related to the topic "${topic}":

      "${content}"

      Based on this content, generate 5 follow-up Google search queries that would logically come next in researching this topic. Provide them in the following JSON format without any additional text:

      {
          "google_search":[
              "follow_up_one",
              "follow_up_two",
              "follow_up_three",
              "follow_up_four",
              "follow_up_five"
          ]
      }

      Please ensure that the output is valid JSON and does not include any additional explanation or text.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = completion.choices[0].message.content;
    const cleanResponse = responseText.replace("```json", "").replace("```", "").trim();
    console.log(cleanResponse);

    // Parse the responseText to JSON
    const data = JSON.parse(cleanResponse);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in followUp API route:", error);
    return NextResponse.json(
      { error: "Failed to generate follow-up queries" },
      { status: 500 }
    );
  }
}
