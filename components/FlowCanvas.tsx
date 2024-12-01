// components/FlowCanvas.tsx
"use client";

import React, { useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  NodeTypes,
  OnNodesChange,
  OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
} from "reactflow";
import "reactflow/dist/style.css";
import ExpandableNode from "@/components/ExpandableNode";
import SpreadsheetNode from "@/components/SpreadsheetNode";
import ChatbotNode from "@/components/ChatbotNode"; // Import the new ChatbotNode
import { useFlowStore, FlowNode, FlowEdge, IdeaNode } from "@/storage/store"; // Adjust the path as necessary
import ContextNode from '@/components/ContextNode';

interface FlowCanvasProps {
  showFlow: boolean;
  nodes: FlowNode[];
  edges: FlowEdge[];
  ideaNodesArray: IdeaNode[];
}

// Define nodeTypes to include ChatbotNode
const nodeTypes: NodeTypes = {
  expandable: ExpandableNode,
  spreadsheet: SpreadsheetNode,
  chatbot: ChatbotNode, // Add ChatbotNode to nodeTypes
  contextNode: ContextNode,
};

const FlowCanvas: React.FC<FlowCanvasProps> = ({
  showFlow,
  nodes,
  edges,
  ideaNodesArray,
}) => {
  const {
    setNodes,
    setEdges,
    updateNodePosition, // Action to update node position
  } = useFlowStore();

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(nodes);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(edges);
  const [sources, setSources] = React.useState<{ [key: string]: any }>({});

  // Synchronize global nodes and edges with React Flow state
  useEffect(() => {
    setRfNodes(nodes);
  }, [nodes, setRfNodes]);

  useEffect(() => {
    setRfEdges(edges);
  }, [edges, setRfEdges]);

  // Handle node changes
  const handleNodesChange: OnNodesChange = useCallback(
    (changes) => {
      const updatedNodes = applyNodeChanges(changes, rfNodes);
      setRfNodes(updatedNodes);
      setNodes(updatedNodes);

      // Iterate over the changes to find position updates
      changes.forEach((change) => {
        if (change.type === "position" && change.position) {
          updateNodePosition(change.id, change.position);
        }
      });
    },
    [rfNodes, setRfNodes, setNodes, updateNodePosition]
  );

  const handleEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      const updatedEdges = applyEdgeChanges(changes, rfEdges);
      setRfEdges(updatedEdges);
      setEdges(updatedEdges);
    },
    [rfEdges, setRfEdges, setEdges]
  );

  // Function to update node data and style (already present)
  const updateNode = (
    nodeId: string,
    updates: {
      data?: any;
      style?: any;
      type?: string; // Add type here if you want to update node type
    }
  ) => {
    useFlowStore.setState((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...updates.data,
            },
            style: {
              ...node.style,
              ...updates.style,
            },
            type: updates.type || node.type, // Update node type if provided
          };
        }
        return node;
      }),
    }));
  };
  const processingRef = useRef(false); // Lock to prevent concurrent processing

  useEffect(() => {
    const processSearches = async () => {
      if (processingRef.current) {
        console.log("Processing is already in progress. Skipping this run.");
        return;
      }

      // Filter ideaNodes that are pending (e.g., status is 'waiting')
      const pendingIdeaNodes = ideaNodesArray.filter(node => {
        const correspondingNode = rfNodes.find(n => n.id === node.nodeId);
        return correspondingNode?.data.status === 'waiting';
      });

      console.log("Process Searches Triggered");
      console.log("Pending Idea Nodes:", pendingIdeaNodes);

      if (pendingIdeaNodes.length === 0) {
        console.log("No pending idea nodes to process.");
        return;
      }

      processingRef.current = true; // Acquire the lock

      // Group ideaNodes by their rootNodeId
      const ideaNodesByRoot = pendingIdeaNodes.reduce((acc: any, ideaNode: any) => {
        const { rootNodeId } = ideaNode;
        if (!acc[rootNodeId]) {
          acc[rootNodeId] = [];
        }
        acc[rootNodeId].push(ideaNode);
        return acc;
      }, {});

      console.log("Grouped Idea Nodes by Root:", ideaNodesByRoot);

      for (const rootNodeId in ideaNodesByRoot) {
        const ideaNodesForRoot = ideaNodesByRoot[rootNodeId];
        console.log(`Processing rootNodeId: ${rootNodeId} with ideaNodes:`, ideaNodesForRoot);

        // Update idea nodes to "researching" status
        ideaNodesForRoot.forEach(({ nodeId, searchQuery }: any) => {
          console.log(`Updating node ${nodeId} to "researching"`);
          updateNode(nodeId, {
            data: {
              status: "researching",
              displayLabel: `Researching on ${searchQuery}`,
            },
            style: {
              backgroundColor: "#ffd699", // Light orange
            },
          });
        });

        try {
          // Call the API to fetch data for the ideaNodes of this root node
          const response = await fetch("/api/researchIdea", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ideaNodes: ideaNodesForRoot,
              rootNodeId,
            }),
          });

          console.log(`API call for rootNodeId: ${rootNodeId} completed with status: ${response.status}`);

          if (!response.ok) {
            throw new Error("Failed to fetch node content");
          }

          const result = await response.json();
          const { responses, sources } = result; // Extract responses and sources

          // Update sources state
          setSources((prevSources) => ({ ...prevSources, ...sources }));

          // Update nodes with the fetched content
          responses.forEach(({ nodeId, bulletPoints, sources, nodeType }: any) => {
            console.log(`Updating node ${nodeId} with fetched content.`);
            updateNode(nodeId, {
              data: {
                status: "done",
                displayLabel: ideaNodesArray.find((n) => n.nodeId === nodeId)
                  ?.searchQuery,
                content: bulletPoints, // Assign the markdown content to the node
                sources, // Pass sources to the node
              },
              type: nodeType || "expandable", // Set node type, default to 'expandable'
              style: {
                backgroundColor: "#ffffff", // White
              },
            });
          });
        } catch (error) {
          console.error("Error processing rootNodeId:", rootNodeId, error);
          // Update nodes with an error message
          ideaNodesForRoot.forEach(({ nodeId, searchQuery }: any) => {
            console.log(`Updating node ${nodeId} with error message.`);
            updateNode(nodeId, {
              data: {
                status: "done",
                displayLabel: searchQuery, // Reset label to original
                content: "Failed to fetch data.",
              },
              style: {
                backgroundColor: "#ffffff", // White
              },
            });
          });
        }
      }

      processingRef.current = false; // Release the lock
    };

    processSearches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ideaNodesArray]); // Keep dependencies as ideaNodesArray and rfNodes

  return (
    <>
      {showFlow && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 10, // Ensure canvas is below the dock
          }}
        >
          <ReactFlow
            nodes={rfNodes}
            edges={rfEdges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            /* Enable Multi-Node Selection and Dragging */
            nodesDraggable={true}
            elementsSelectable={true}
            selectNodesOnDrag={true}
            selectionOnDrag={true}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            connectionLineType="smoothstep" // Ensure edges are rendered smoothly
            nodeTypes={nodeTypes}
            zoomOnScroll={false}
            panOnScroll={true}
            panOnDrag={false}
          >
            <Controls />
            <Background
              variant="dots"
              gap={12}
              size={1}
              color="#ddd"
              style={{ backgroundColor: "#ffffff" }}
            />
          </ReactFlow>
        </motion.div>
      )}
    </>
  );
};

export default FlowCanvas;
