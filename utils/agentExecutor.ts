import { ChatOpenAI } from "@langchain/openai";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { createOpenAIToolsAgent, AgentExecutor } from "langchain/agents";

// Initialize agentExecutor as a singleton
let agentExecutor: AgentExecutor | null = null;

export const getAgentExecutor = async () => {
  if (!agentExecutor) {
    // Define the system prompt
    const sys_prompt_search_agent = "You answer all questions using the search tool even if you know the answer yourself. For every point you make, you must provide the source link in markdown format.";

    // Initialize the prompt template
    const prompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(sys_prompt_search_agent),
      HumanMessagePromptTemplate.fromTemplate("{input}"),
      new MessagesPlaceholder("agent_scratchpad"),
    ]);

    // Initialize the LLM
    const llm = new ChatOpenAI({
      apiKey: process.env.OPENAI_API_KEY, // Replace with your API key or use an environment variable
      modelName: "gpt-4o",
      temperature: 0,
      verbose: true,
    });

    
    // Initialize the tools
    const tools = [
      new TavilySearchResults({
        apiKey: "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", // Replace with your API key or use an environment variable
        maxResults: 5,
        kwargs: {
          searchDepth: "idk",
          includeRawContent: true,
        },
      }),
    ];
    

    // Create the agent
    const agent = await createOpenAIToolsAgent({
      llm,
      tools,
      prompt,
    });

    // Create the agent executor
    agentExecutor = new AgentExecutor({
      agent,
      tools,
    });
  }
  return agentExecutor;
};
