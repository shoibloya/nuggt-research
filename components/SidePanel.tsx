// components/SidePanel.tsx
import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ContextEntry {
  index: number;
  label: string;
  content: string;
}

interface SidePanelProps {
  content: ContextEntry[];
  indicesToHighlight: number[];
  onClose: () => void;
}

export const SidePanel: React.FC<SidePanelProps> = ({
  content,
  indicesToHighlight,
  onClose,
}) => {
  return (
    <div className="fixed inset-y-0 right-0 w-1/3 bg-white shadow-lg z-100 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-bold">Context Entries</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-6 w-6" />
        </Button>
      </div>
      <ScrollArea className="p-4 flex-grow">
        {content.map((entry) => {
          const isHighlighted = indicesToHighlight.includes(entry.index);
          return (
            <div
              key={entry.index}
              className={`mb-4 p-2 ${isHighlighted ? "bg-yellow-200" : ""}`}
            >
              <h3 className="font-semibold">
                {entry.label} - Reference [{entry.index}]
              </h3>
              <pre className="whitespace-pre-wrap">{entry.content}</pre>
            </div>
          );
        })}
      </ScrollArea>
    </div>
  );
};
