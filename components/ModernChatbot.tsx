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
import { X, Send, User, Bot, Pencil } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { useFlowStore } from "@/storage/store";
import { MultiSelect } from "@/components/multi-select";
import { Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SidePanel } from "@/components/SidePanel";
import { Input } from "@/components/ui/input";

interface Message {
  role: "user" | "assistant";
  content: string;
  contexts?: string[];
  isContext?: boolean;
}

interface ContextEntry {
  index: number;
  label: string;
  content: string;
}

interface SidePanelContent {
  content: ContextEntry[];
  indicesToHighlight: number[];
}

export default function ModernChatbot() {
  const {
    openChatbotNodeId,
    setOpenChatbotNodeId,
    nodes,
    updateChatNodeLabel,
    updateChatbotConversation
  } = useFlowStore();

  const currentNode = useMemo(() => {
    return nodes.find((node) => node.id === openChatbotNodeId);
  }, [nodes, openChatbotNodeId]);

  const [labelValue, setLabelValue] = useState("");
  const [isEditingLabel, setIsEditingLabel] = useState(false);

  useEffect(() => {
    if (currentNode && currentNode.data.label) {
      setLabelValue(currentNode.data.label);
    }
  }, [currentNode]);

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

  const [selectedContextIds, setSelectedContextIds] = useState<string[]>([]);
  const [formattedContext, setFormattedContext] = useState<string>("");
  const [contextEntries, setContextEntries] = useState<ContextEntry[] | null>(
    null
  );
  const [addedContextIds, setAddedContextIds] = useState<string[]>([]);
  const [indexCounter, setIndexCounter] = useState<number>(1);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [sidePanelContent, setSidePanelContent] = useState<SidePanelContent | null>(
    null
  );
  const [input, setInput] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);

  const parseContextEntries = (messages: Message[]): ContextEntry[] => {
    const entries: ContextEntry[] = [];
    let maxIndex = 0;

    messages
      .filter((msg) => msg.isContext && msg.role === "user")
      .forEach((msg) => {
        const contentWithoutHeader = msg.content.replace(/^.*?\n\n/, "");
        const entriesArray = contentWithoutHeader.split(/(?=^\[\d+\])/gm);

        entriesArray.forEach((entryText) => {
          const match = entryText.match(/^\[(\d+)\]\s*(.*?):\s*([\s\S]*)$/m);
          if (match) {
            const index = parseInt(match[1], 10);
            const label = match[2];
            const content = match[3].trim();
            entries.push({ index, label, content });
            if (index > maxIndex) {
              maxIndex = index;
            }
          }
        });
      });

    setIndexCounter(maxIndex + 1);
    return entries;
  };

  // Load messages from node.data.conversation
  const messages: Message[] = currentNode?.data.conversation || [];

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (openChatbotNodeId && currentNode) {
      const initialMsgs = currentNode.data.conversation || [];
      const existingEntries = parseContextEntries(initialMsgs);
      if (existingEntries.length > 0) {
        setContextEntries(existingEntries);
        const existingContextIds = initialMsgs
          .filter((msg) => msg.isContext && msg.role === "user")
          .flatMap((msg) => {
            const lines = msg.content.split("\n").filter(line => line.trim() !== "");
            return lines.map((line) => {
              const match = line.match(/^\[(\d+)\]\s*(.*?):\s*(.*)$/);
              if (match) {
                const label = match[2];
                const content = match[3];
                const node = contextNodes.find(
                  (node) => node.data.label === label && node.data.contextEntries?.includes(content)
                );
                return node ? node.id : null;
              }
              return null;
            }).filter(id => id !== null) as string[];
          });
        setAddedContextIds(existingContextIds);
        setIndexCounter(
          existingEntries.reduce(
            (max, entry) => (entry.index > max ? entry.index : max),
            0
          ) + 1
        );
      } else {
        setContextEntries(null);
        setAddedContextIds([]);
        setIndexCounter(1);
      }
    } else {
      // Reset when closing
      setContextEntries(null);
      setAddedContextIds([]);
      setIndexCounter(1);
      setIsEditingLabel(false);
      setFormattedContext("");
    }
  }, [openChatbotNodeId, currentNode, contextNodes]);

  const splitText = (text: string, maxLength: number): string[] => {
    const chunks: string[] = [];
    let remainingText = text.trim();

    while (remainingText.length > maxLength) {
      let splitIndex = remainingText.lastIndexOf(' ', maxLength);
      if (splitIndex === -1) {
        splitIndex = maxLength;
      }
      const chunk = remainingText.substring(0, splitIndex).trim();
      chunks.push(chunk);
      remainingText = remainingText.substring(splitIndex).trim();
    }

    if (remainingText.length > 0) {
      chunks.push(remainingText);
    }

    return chunks;
  };

  const handleContextSelect = (selectedValues: string[]) => {
    const previouslyAddedContextIds = addedContextIds;
    const newlySelectedIds = selectedValues.filter(
      (id) => !previouslyAddedContextIds.includes(id)
    );
    const deselectedIds = previouslyAddedContextIds.filter(
      (id) => !selectedValues.includes(id)
    );

    let currentIndexLocal = indexCounter;
    let contextLines: string[] = [];
    let entriesList: ContextEntry[] = [];

    newlySelectedIds.forEach((id) => {
      const node = contextNodes.find((node) => node.id === id);
      if (node) {
        const entries = node.data.contextEntries || ["No entries available."];
        entries.forEach((entry) => {
          const chunks = splitText(entry, 350);
          chunks.forEach((chunk) => {
            contextLines.push(`[${currentIndexLocal}] ${node.data.label}: ${chunk}`);
            entriesList.push({
              index: currentIndexLocal,
              label: node.data.label,
              content: chunk,
            });
            currentIndexLocal++;
          });
        });
      }
    });

    if (contextLines.length > 0) {
      const contextString = `Please take into account the following context and reference them in your answer:\n\n${contextLines.join("\n\n")}`;
      setFormattedContext(contextString);

      setContextEntries((prevEntries) => {
        if (prevEntries) {
          return [...prevEntries, ...entriesList];
        } else {
          return entriesList;
        }
      });

      setAddedContextIds((prevIds) => [...prevIds, ...newlySelectedIds]);
    } else {
      setFormattedContext("");
    }

    if (deselectedIds.length > 0) {
      setContextEntries((prevEntries) => {
        if (!prevEntries) return prevEntries;
        return prevEntries.filter(
          (entry) =>
            !deselectedIds.some((id) => {
              const node = contextNodes.find((node) => node.id === id);
              return node
                ? entry.label === node.data.label &&
                  entry.content === node.data.contextEntries?.[0]
                : false;
            })
        );
      });
      setAddedContextIds((prevIds) =>
        prevIds.filter((id) => !deselectedIds.includes(id))
      );
    }

    setSelectedContextIds(selectedValues);
    setIndexCounter(currentIndexLocal);
  };

  const handleLabelSave = () => {
    if (openChatbotNodeId && labelValue.trim() !== "") {
      updateChatNodeLabel(openChatbotNodeId, labelValue.trim());
      setIsEditingLabel(false);
    }
  };

  const sendMessage = async () => {
    if (!openChatbotNodeId) return;
    const inputText = input.trim();
    if (inputText === "") return;

    const selectedContextLabels = contextNodes
      .filter((node) => selectedContextIds.includes(node.id))
      .map((node) => node.data.label);

    const userMessage: Message = {
      role: "user",
      content: inputText,
      contexts: selectedContextLabels,
    };

    setInput("");
    setSelectedContextIds([]);

    let newMessages = [...messages];

    if (formattedContext) {
      const contextMessage: Message = {
        role: "user",
        content: formattedContext,
        isContext: true,
      };
      newMessages.push(contextMessage);
    }

    newMessages.push(userMessage);
    updateChatbotConversation(openChatbotNodeId, newMessages);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from assistant");
      }

      const data = await response.json();
      const assistantMessage: Message = data.message;

      const updatedMessages = [...newMessages, assistantMessage];
      updateChatbotConversation(openChatbotNodeId, updatedMessages);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "Error: Could not get response from the assistant.",
      };
      const updatedMessages = [...newMessages, errorMessage];
      updateChatbotConversation(openChatbotNodeId, updatedMessages);
    }

    setFormattedContext("");
  };

  const handleReferenceClick = (reference: string) => {
    let ref = reference.replace("[", "").replace("]", "");
    let indices = ref.split(/[-,]/).map((str) => parseInt(str.trim()));
    if (indices.length > 0 && !isNaN(indices[0])) {
      const startIndex = indices[0];
      const endIndex = indices.length > 1 && !isNaN(indices[1]) ? indices[1] : startIndex;
      const indicesToHighlight: number[] = [];
      for (let i = startIndex; i <= endIndex; i++) {
        indicesToHighlight.push(i);
      }
      setSidePanelContent({
        content: contextEntries || [],
        indicesToHighlight,
      });
      setIsSidePanelOpen(true);
    }
  };

  const isChatbotOpen = !!openChatbotNodeId;
  const nodeLabel = openChatbotNodeId
    ? currentNode?.data.label || "Chatbot"
    : "Chatbot";

  return (
    <>
      {isChatbotOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-8">
          <Card className="h-full flex flex-col w-full">
            <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b shrink-0">
              {isEditingLabel ? (
                <div className="flex items-center space-x-2 flex-grow">
                  <Input
                    value={labelValue}
                    onChange={(e) => setLabelValue(e.target.value)}
                    className="flex-grow"
                    placeholder="Enter new name..."
                  />
                  <Button onClick={handleLabelSave}>Save</Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2 flex-grow">
                  <div className="text-2xl font-bold">{nodeLabel}</div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground"
                    onClick={() => setIsEditingLabel(true)}
                  >
                    <Pencil className="h-5 w-5" />
                    <span className="sr-only">Edit Name</span>
                  </Button>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground"
                onClick={() => {
                  setOpenChatbotNodeId(null);
                  setContextEntries(null);
                  setAddedContextIds([]);
                  setIndexCounter(1);
                  setIsEditingLabel(false);
                  setFormattedContext("");
                }}
              >
                <X className="h-6 w-6" />
                <span className="sr-only">Close</span>
              </Button>
            </CardHeader>

            <CardContent className="flex-grow p-0 overflow-hidden relative">
              <ScrollArea className="h-full">
                <div className="flex text-lg flex-col">
                  {messages
                    .filter((message) => !message.isContext)
                    .map((message, index) => (
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
                          {message.role === "user" &&
                            message.contexts &&
                            message.contexts.length > 0 && (
                              <div className="flex flex-wrap mb-2">
                                {message.contexts.map((contextLabel, idx) => (
                                  <Badge key={idx} className="mr-2 mb-2">
                                    {contextLabel}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          <ReactMarkdown
                            className="prose prose-xl dark:prose-invert max-w-none mr-2"
                            remarkPlugins={[remarkGfm]}
                            components={{
                              code({ node, inline, className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || "");
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
                              p({ node, children, ...props }) {
                                const elements = [];
                                React.Children.forEach(children, (child) => {
                                  if (typeof child === "string") {
                                    const parts = child.split(/(\[\d+(?:-\d+)?\])/g);
                                    parts.forEach((part, idx) => {
                                      if (part.match(/\[\d+(?:-\d+)?\]/)) {
                                        elements.push(
                                          <span
                                            key={idx}
                                            className="text-blue-500 cursor-pointer"
                                            onClick={() => handleReferenceClick(part)}
                                          >
                                            {part}
                                          </span>
                                        );
                                      } else {
                                        elements.push(part);
                                      }
                                    });
                                  } else {
                                    elements.push(child);
                                  }
                                });
                                return <p {...props}>{elements}</p>;
                              },
                              li({ node, children, ...props }) {
                                const elements = [];
                                React.Children.forEach(children, (child) => {
                                  if (typeof child === "string") {
                                    const parts = child.split(/(\[\d+(?:-\d+)?\])/g);
                                    parts.forEach((part, idx) => {
                                      if (part.match(/\[\d+(?:-\d+)?\]/)) {
                                        elements.push(
                                          <span
                                            key={idx}
                                            className="text-blue-500 cursor-pointer"
                                            onClick={() => handleReferenceClick(part)}
                                          >
                                            {part}
                                          </span>
                                        );
                                      } else {
                                        elements.push(part);
                                      }
                                    });
                                  } else {
                                    elements.push(child);
                                  }
                                });
                                return <li {...props}>{elements}</li>;
                              },
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    ))}
                  <div ref={bottomRef} />
                </div>
              </ScrollArea>
              {isSidePanelOpen && sidePanelContent && (
                <SidePanel
                  content={sidePanelContent.content}
                  indicesToHighlight={sidePanelContent.indicesToHighlight}
                  onClose={() => setIsSidePanelOpen(false)}
                />
              )}
            </CardContent>

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

              <div className="flex w-full space-x-2">
                <Textarea
                  placeholder="Type your message..."
                  className="flex-grow rounded resize-none"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={async (event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
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
