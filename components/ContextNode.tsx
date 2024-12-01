// components/ContextNode.tsx
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

const ContextNode: React.FC<NodeProps> = ({
  id,
  data,
  selected,
  style,
  sourcePosition = Position.Right,
  targetPosition = Position.Left,
}) => {
  const reactFlowInstance = useReactFlow();

  // Access the store's actions
  const setOpenContextNodeId = useFlowStore(
    (state) => state.setOpenContextNodeId
  );

  // Handler for delete button
  const handleDelete = () => {
    reactFlowInstance.setNodes((nds) => nds.filter((node) => node.id !== id));
    reactFlowInstance.setEdges((eds) =>
      eds.filter((edge) => edge.source !== id && edge.target !== id)
    );
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
    setOpenContextNodeId(id);
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Toolbar */}
      {selected && (
        <NodeToolbar isVisible={selected} position="top">
          <Button variant="destructive" className="mr-1" onClick={handleDelete}>
            Delete
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

      {/* Button to open context dialog */}
      <Button
        variant="default"
        style={buttonStyle}
        onClick={handleNodeClick}
      >
        <strong>{data.label || "Context"}</strong>
      </Button>
    </div>
  );
};

export default ContextNode;