// chat/route.ts

import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure your API key is set in environment variables
});

const SYSTEM_MESSAGE = {
  role: 'system',
  //content: 'You are a helpful assistant. For any task given to you, your primary job is to break it down into subtasks and complete each subtask seperately. Before moving to the next sub-task you always ask for approval from the user on the satisfaction on the current subtask. You always explain how you used the provided context by adding a thought section at the end of all your reponses where you mention how you used the context by referencing it via the number tag. For example, based on [4] I decided to..',
  content: 'You are a helpful assistant.'
};

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    console.log(messages);

     // Prepend the single system message
    const formattedMessages = [SYSTEM_MESSAGE, ...messages];

    console.log(formattedMessages);

    // Validate the messages format
    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
    }

    // Create a completion using the OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // Use the specified model
      temperature: 0, // Adjust temperature as needed
      messages: formattedMessages, // Pass the conversation history
    });

    const responseMessage = completion.choices[0].message;

    return NextResponse.json({ message: responseMessage });
  } catch (error) {
    console.error('Error in chat API route:', error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}
