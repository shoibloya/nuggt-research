// components/DockDemo.tsx
import React from "react";
import { Dock, DockIcon } from "@/components/ui/dock";
import { Bot } from "lucide-react";

export type IconProps = React.HTMLAttributes<SVGElement>;

interface DockDemoProps {
  addSpreadsheetNode: () => void;
  addChatbotNode: () => void;
  addContextNode: () => void;
  onWhatsAppClick: () => void; // Existing prop
}

export function DockDemo({
  addSpreadsheetNode,
  addChatbotNode,
  addContextNode,
  onWhatsAppClick,
}: DockDemoProps) {
  return (
    <div className="relative">
      <Dock magnification={60} distance={100}>
        {/* Google Spreadsheet Icon (Replaced with File Spreadsheet) */}
        <DockIcon
          className="hidden bg-black/10 dark:bg-white/10 p-3 cursor-pointer"
          onClick={addSpreadsheetNode}
          aria-label="Add Spreadsheet"
          title="Add Spreadsheet"
        >
          <Icons.fileSpreadsheet className="size-full" />
        </DockIcon>

        {/* Chatbot Icon */}
        <DockIcon
          className="hidden bg-black/10 dark:bg-white/10 p-3 cursor-pointer"
          onClick={addChatbotNode}
          aria-label="Add Chatbot"
          title="Add Chatbot"
        >
          <Bot className="size-full" />
        </DockIcon>

        {/* Context Node Icon (Replaced with Database Icon) */}
        <DockIcon
          className="hidden bg-black/10 dark:bg-white/10 p-3 cursor-pointer"
          onClick={addContextNode}
          aria-label="Add Context Node"
          title="Add Context Node"
        >
          <Icons.database className="size-full" />
        </DockIcon>

        {/* Search Icon */}
        <DockIcon
          className="bg-black/10 dark:bg-white/10 p-3 cursor-pointer"
          onClick={onWhatsAppClick}
          aria-label="Start New Search"
          title="Start New Search"
        >
          <Icons.search className="size-full" />
        </DockIcon>

        {/* Sparkles Icon */}
        <DockIcon
          className="bg-black/10 dark:bg-white/10 p-3 cursor-pointer"
          onClick={() => {
            if (typeof window.arrangeAllExpandableNodes === "function") {
              window.arrangeAllExpandableNodes();
            } else {
              console.warn("Arrange function not available.");
            }
          }}
          aria-label="Arrange Expandable Nodes"
          title="Arrange Graph Nodes"
        >
          <Icons.sparkles className="size-full" />
        </DockIcon>
      </Dock>
    </div>
  );
}

const Icons = {
  fileSpreadsheet: (props: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-file-spreadsheet"
      {...props}
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M8 13h2" />
      <path d="M14 13h2" />
      <path d="M8 17h2" />
      <path d="M14 17h2" />
    </svg>
  ),
  database: (props: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-database"
      {...props}
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  ),
  search: (props: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-search"
      {...props}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  sparkles: (props: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-sparkles"
      {...props}
    >
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      <path d="M20 3v4" />
      <path d="M22 5h-4" />
      <path d="M4 17v2" />
      <path d="M5 18H3" />
    </svg>
  ),
};

export default DockDemo;
