// components/SpreadsheetNode.tsx
"use client";

import React from "react";
import {
  Handle,
  NodeProps,
  NodeToolbar,
  useReactFlow,
  Position,
} from "reactflow";
import { Button } from "@/components/ui/button";
import { useFlowStore } from "@/storage/store";
import { Trash, ChartBar } from "lucide-react"; // Import ChartBar icon

const SpreadsheetNode: React.FC<NodeProps> = ({
  id,
  data,
  selected,
  style,
  sourcePosition = Position.Right,
  targetPosition = Position.Left,
}) => {
  const reactFlowInstance = useReactFlow();

  // Access the store's actions and state
  const setOpenSpreadsheetNodeId = useFlowStore(
    (state) => state.setOpenSpreadsheetNodeId
  );
  const nodes = useFlowStore((state) => state.nodes); // Access nodes from the store

  // Handler for delete button
  const handleDelete = () => {
    reactFlowInstance.setNodes((nds) => nds.filter((node) => node.id !== id));
    reactFlowInstance.setEdges((eds) =>
      eds.filter((edge) => edge.source !== id && edge.target !== id)
    );
  };

  // Handler for chart button
  const handleOpenChart = () => {
    // Find the current node's data
    const currentNode = nodes.find((node) => node.id === id);

    if (currentNode && currentNode.data) {
      const columns = currentNode.data.columnDefinitions || [];
      const rows = currentNode.data.rows || [];

      // Structure the data
      const tableData = {
        columns,
        rows,
      };

      // Convert to JSON string with indentation for readability
      const tableDataString = JSON.stringify(tableData, null, 2);

      // Log the table data string
      console.log(`Table Data for Node ID ${id}:`, tableDataString);
    } else {
      console.error(`Node with ID ${id} not found or has no data.`);
    }
  };

  // Node style
  const buttonStyle = {
    padding: "8px 12px",
    backgroundColor: style?.backgroundColor || "#ffffff",
    border: selected ? "2px solid #555" : "1px solid #777",
    borderRadius: "5px",
    color: "#000",
    cursor: "pointer",
    textAlign: "center" as const,
  };

  // Handle node click
  const handleNodeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenSpreadsheetNodeId(id);
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Toolbar */}
      {selected && (
        <NodeToolbar isVisible={selected} position="top">
          <Button
            variant="destructive"
            onClick={handleDelete}
            className="mr-1"
            aria-label="Delete Spreadsheet Node"
          >
            <Trash className="h-4 w-4 mr-1" />
            Delete
          </Button>
          {/* New Chart Button */}
          <Button
            onClick={handleOpenChart}
            className="ml-1"
            aria-label="Open Chart"
          >
            <ChartBar className="h-4 w-4 mr-1" />
            Chart
          </Button>
        </NodeToolbar>
      )}

      {/* Handles for edge connections */}
      {targetPosition && (
        <Handle
          type="target"
          position={targetPosition}
          style={{
            top: "50%",
            transform: "translateY(-50%)",
            background: "#555",
          }}
        />
      )}
      {sourcePosition && (
        <Handle
          type="source"
          position={sourcePosition}
          style={{
            top: "50%",
            transform: "translateY(-50%)",
            background: "#555",
          }}
        />
      )}

      {/* Button to open spreadsheet */}
      <Button
        style={buttonStyle}
        onClick={handleNodeClick} // Attach the click handler here
      >
        <strong>{data.label || "Spreadsheet"}</strong>
      </Button>
    </div>
  );
};

export default SpreadsheetNode;
