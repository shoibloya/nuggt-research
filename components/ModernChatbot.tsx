// components/ModernChatbot.tsx
"use client";

import React, { useEffect, useRef, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { X, Send, User, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { useFlowStore } from "@/storage/store";
import { MultiSelect } from "@/components/multi-select";
import { Database } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ModernChatbot() {
  // Access the store's state and actions
  const {
    openChatbotNodeId,
    setOpenChatbotNodeId,
    nodes,
    conversations,
    setConversation,
  } = useFlowStore();

  const contextNodes = useMemo(
    () => nodes.filter((node) => node.type === "contextNode"),
    [nodes]
  );

  const contextOptions = useMemo(
    () =>
      contextNodes.map((node) => ({
        value: node.id,
        label: node.data.label,
        icon: Database,
      })),
    [contextNodes]
  );

  // State to manage selected context node IDs
  const [selectedContextIds, setSelectedContextIds] = useState<string[]>([]);

  // State to store the formatted context string
  const [formattedContext, setFormattedContext] = useState<string>("");

  // Handler for MultiSelect value changes
  const handleContextSelect = (selectedValues: string[]) => {
    setSelectedContextIds(selectedValues);

    // Find the selected context nodes based on their IDs
    const selectedContextNodes = contextNodes.filter((node) =>
      selectedValues.includes(node.id)
    );

    // Build the formatted context string
    if (selectedContextNodes.length > 0) {
      const contextLines = selectedContextNodes.map((node) => {
        const entries =
          node.data.contextEntries?.join(", ") || "No entries available.";
        return `${node.data.label}: ${entries}`;
      });

      const contextString = `Please take into account the following context and reference them in your answer:\n\n${contextLines.join(
        "\n"
      )}`;

      setFormattedContext(contextString);
    } else {
      setFormattedContext("");
    }
  };

  // Get the initial messages from the store's conversations
  const initialMessages = openChatbotNodeId
    ? conversations[openChatbotNodeId] || []
    : [];
  
  // State to manage messages and input
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");

  // Ref for the dummy div to scroll into view
  const bottomRef = useRef<HTMLDivElement>(null);

  // Effect to auto-scroll to the bottom when messages update
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Effect to update store's conversation when messages change
  useEffect(() => {
    if (openChatbotNodeId) {
      setMessages(initialMessages)
    }
  }, [openChatbotNodeId]);

  // Function to handle sending messages
  const sendMessage = async () => {
    if (input.trim() === "") return; // Prevent sending empty messages
  
    let finalMessageContent = input.trim();
  
    if (formattedContext) {
      finalMessageContent = `${formattedContext}\n\n${finalMessageContent}`;
      console.log(finalMessageContent);
    }
  
    // Create the user message
    const userMessage: Message = {
      role: "user",
      content: finalMessageContent,
    };
  
    // Append user message to messages
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    if (openChatbotNodeId) {
      setConversation(openChatbotNodeId, newMessages);
    }
  
    try {
      // Send messages to backend API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: newMessages }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to get response from assistant");
      }
  
      const data = await response.json();
  
      const assistantMessage: Message = data.message; // Backend returns { message: { role: 'assistant', content: '...' } }
  
      // Append assistant message to messages
      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);
      if (openChatbotNodeId) {
        setConversation(openChatbotNodeId, updatedMessages);
      }
  
    } catch (error) {
      console.error("Error sending message:", error);
      // Optionally, add an error message to the conversation
      const errorMessage: Message = {
        role: "assistant",
        content: "Error: Could not get response from the assistant.",
      };
      const updatedMessages = [...newMessages, errorMessage];
      setMessages(updatedMessages);
      if (openChatbotNodeId) {
        setConversation(openChatbotNodeId, updatedMessages);
      }
    }
  
    setInput(""); // Clear the input field
  
    // Clear MultiSelect selections and formatted context
    setSelectedContextIds([]);
    setFormattedContext("");
  };
  

  // Only render the chatbot UI if openChatbotNodeId is set
  const isChatbotOpen = !!openChatbotNodeId;

  // Get the node's label for display
  const nodeLabel = openChatbotNodeId
    ? nodes.find((node) => node.id === openChatbotNodeId)?.data?.label ||
      "Chatbot"
    : "Chatbot";

  return (
    <>
      {isChatbotOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-8">
          <Card className="h-full flex flex-col w-full">
            {/* Header Section */}
            <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b shrink-0">
              <div className="text-2xl font-bold">{nodeLabel}</div>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground"
                onClick={() => setOpenChatbotNodeId(null)}
              >
                <X className="h-6 w-6" />
                <span className="sr-only">Close</span>
              </Button>
            </CardHeader>

            {/* Chat Content Section */}
            <CardContent className="flex-grow p-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="flex text-lg flex-col">
                  {/* Render all messages dynamically */}
                  {messages.map((message, index) => (
                    <div key={index} className="flex items-start py-4 px-6">
                      <Avatar className="w-10 h-10 mr-4">
                        <AvatarFallback>
                          {message.role === "assistant" ? (
                            <Bot className="w-6 h-6" />
                          ) : (
                            <User className="w-6 h-6" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-grow">
                        {/* Use ReactMarkdown to render message content with proper formatting */}
                        <ReactMarkdown
                          className="prose prose-xl dark:prose-invert max-w-none mr-2"
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({
                              node,
                              inline,
                              className,
                              children,
                              ...props
                            }) {
                              const match =
                                /language-(\w+)/.exec(className || "");
                              return !inline && match ? (
                                <SyntaxHighlighter
                                  style={oneDark}
                                  language={match[1]}
                                  PreTag="div"
                                  className="rounded-md my-2"
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, "")}
                                </SyntaxHighlighter>
                              ) : (
                                <code
                                  className={`${className} bg-gray-200 px-1 py-0.5 rounded`}
                                  {...props}
                                >
                                  {children}
                                </code>
                              );
                            },
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ))}
                  {/* Dummy div for auto-scrolling */}
                  <div ref={bottomRef} />
                </div>
              </ScrollArea>
            </CardContent>

            {/* Footer Section with Suggestions and Input */}
            <CardFooter className="flex flex-col space-y-4 p-6 border-t shrink-0">
              <MultiSelect
                options={contextOptions}
                onValueChange={handleContextSelect}
                value={selectedContextIds}
                placeholder="Select context nodes"
                variant="inverted"
                animation={2}
                maxCount={3}
              />

              {/* Input and Send Button */}
              <div className="flex w-full space-x-2">
                <Textarea
                  placeholder="Type your message..."
                  className="flex-grow rounded resize-none"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={async (event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault(); // Prevent form submission if inside a form
                      await sendMessage();
                    }
                  }}
                />
                <Button
                  size="icon"
                  className="h-12 w-12"
                  onClick={sendMessage}
                  disabled={input.trim() === ""}
                >
                  <Send className="h-6 w-6" />
                  <span className="sr-only">Send message</span>
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  );
}
