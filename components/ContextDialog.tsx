// components/ContextDialog.tsx
"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";
import { useFlowStore } from "@/storage/store";

export default function ContextDialog() {
  const {
    openContextNodeId,
    setOpenContextNodeId,
    nodes,
    addContextEntry,
  } = useFlowStore();

  const [inputValue, setInputValue] = useState("");

  // Get the current node's context entries
  const currentNode = nodes.find((node) => node.id === openContextNodeId);
  const contextEntries = currentNode?.data?.contextEntries || [];

  const handleAdd = () => {
    if (inputValue.trim() !== "" && openContextNodeId) {
      addContextEntry(openContextNodeId, inputValue.trim());
      setInputValue("");
    }
  };

  const handleClose = () => {
    setOpenContextNodeId(null);
  };

  if (!openContextNodeId) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-8">
      <Card className="w-full max-w-3xl h-full flex flex-col">
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b shrink-0">
          <h2 className="text-xl font-bold">
            {currentNode?.data?.label || "Context"}
          </h2>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>

        {/* Content */}
        <CardContent className="flex-grow p-4 overflow-y-auto">

        {/* Display Context Entries */}
          
            <ScrollArea className="h-full">
              <div className="flex space-y-2 flex-col">
                {contextEntries.map((entry, index) => (
                  <div
                    key={index}
                    className="bg-blue-100 text-blue-900 px-4 py-2 rounded-md break-words"
                  >
                    {entry}
                  </div>
                ))}
              </div>
            </ScrollArea>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 p-4 border-t shrink-0">
          {/* Textarea and Add Button */}
          <div className="flex w-full space-x-2">
            <Textarea
              placeholder="Enter context..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={async event => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault(); // Prevent form submission if inside a form
                  handleAdd();
                }
              }}
              className="flex-1"
            />
            <Button className="h-14" onClick={handleAdd}>Add</Button>
          </div>

          
        </CardFooter>
      </Card>
    </div>
  );
}
