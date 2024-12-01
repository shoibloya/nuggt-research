// app/api/generateSpreadsheetColumns/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure you have your API key in environment variables
});

export async function POST(request: Request) {
  try {
    const { purpose } = await request.json();

    // Define the prompt for ChatGPT
    const prompt = `
You are an expert spreadsheet designer. Based on the user's purpose for a spreadsheet, design the most suitable spreadsheet structure.

The user's purpose is:
"${purpose}"

Possible column types include:
- Text
- Number
- Currency
- Date d-m-y
- Date m-d-y
- Checkbox
- Select
- Label

For each column, specify:
- id: Unique identifier for the column.
- name: The name of the column.
- description: A brief description of what data the column holds.
- type: The column type (from the possible types above).
- options: For Select and Label types, specify the options available.

Please provide a JSON response in the following format without any additional text:

{
  "columns": [
    {
      "id": "<Unique ID>",
      "name": "<Column Name>",
      "description": "<Column Description>",
      "type": "<Column Type>",
      "options": [ "<Option1>", "<Option2>" ] // Include if type is Select or Label
    }
    // Add more columns as needed
  ]
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = completion.choices[0].message.content;
    const cleanResponse = responseText.replace("```json", "").replace("```", "");
    console.log(cleanResponse);

    // Parse the responseText to JSON
    const data = JSON.parse(cleanResponse);

    // Ensure each column has a unique ID
    data.columns = data.columns.map((col: any) => ({
      ...col,
      id: col.id || require("crypto").randomBytes(16).toString("hex"),
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in generateSpreadsheetColumns API route:", error);
    return NextResponse.json(
      { error: "Failed to generate column definitions" },
      { status: 500 }
    );
  }
}
