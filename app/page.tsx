// app/page.tsx
"use client";

import React from "react";
import FlowCanvas from "@/components/FlowCanvas";
import SearchBox from "@/components/SearchBox";
import AreaSelection from "@/components/AreaSelection";
import { ButtonLoading } from "@/components/ButtonLoading";
import { motion, AnimatePresence } from "framer-motion";
import dagre from "dagre";
import { DockDemo } from "@/components/DockDemo";
import { v4 as uuidv4 } from 'uuid';
import { useFlowStore } from "@/storage/store"; // Adjust the path as necessary
import SpreadsheetDialog from "@/components/SpreadsheetDialog";
import ModernChatbot from "@/components/ModernChatbot";
import ContextDialog from "@/components/ContextDialog";

const nodeWidth = 200;
const nodeHeight = 50;

const FlowPage = () => {
  const {
    showFlow,
    setShowFlow,
    query,
    setQuery,
    nodes,
    setNodes,
    edges,
    setEdges,
    loading,
    setLoading,
    ideaNodesArray,
    setIdeaNodesArray,
    areasData,
    setAreasData,
  } = useFlowStore();

  const generateUniqueLabel = (type: string, baseLabel: string): string => {
    const count = nodes.filter((node) => node.type === type).length + 1;
    return `Untitled-${baseLabel}-${count}`;
  };

  const addSpreadsheetNode = () => {
    const newNodeId = `spreadsheet-${uuidv4()}`;
    const uniqueLabel = generateUniqueLabel("spreadsheet", "Spreadsheet");
    const newNode = {
      id: newNodeId,
      type: "spreadsheet",
      position: {
        x: Math.random() * 600 - 300,
        y: Math.random() * 600 - 300,
      },
      data: {
        label: uniqueLabel,
        // Do not initialize spreadsheetData here
      },
      sourcePosition: "right",
      targetPosition: "left",
    };
  
    useFlowStore.getState().addNode(newNode);
  };

  // Function to add a Chatbot node
  const addChatbotNode = () => {
    const newNodeId = `chatbot-${uuidv4()}`;
    const uniqueLabel = generateUniqueLabel("chatbot", "Chatbot");
    const newNode = {
      id: newNodeId,
      type: "chatbot",
      position: {
        x: Math.random() * 600 - 300,
        y: Math.random() * 600 - 300,
      },
      data: {
        label: uniqueLabel,
      },
      sourcePosition: "right",
      targetPosition: "left",
    };

    useFlowStore.getState().addNode(newNode);
  };

  const addContextNode = () => {
    const newNodeId = `context-${uuidv4()}`;
    const uniqueLabel = generateUniqueLabel("contextNode", "Context");
    const newNode = {
      id: newNodeId,
      type: "contextNode",
      position: {
        x: Math.random() * 600 - 300,
        y: Math.random() * 600 - 300,
      },
      data: { label: uniqueLabel },
      sourcePosition: "right",
      targetPosition: "left",
    };
    useFlowStore.getState().addNode(newNode);
  }


  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (query.trim()) {
      setLoading(true);
      setShowFlow(false);
      try {
        const response = await fetch("/api/generateGraph", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate graph data");
        }

        const data = await response.json();
        setAreasData(data.areas);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleProcessSelection = (selectedAreasData: any) => {
    const { nodes: generatedNodes, edges: generatedEdges, ideaNodesArray: generatedIdeaNodesArray } = processGraphData(selectedAreasData);
    setNodes([...nodes, ...generatedNodes]);
    setEdges([...edges, ...generatedEdges]);
    setIdeaNodesArray([...ideaNodesArray, ...generatedIdeaNodesArray]);
    setShowFlow(true);
    setAreasData(null);
  };

  const processGraphData = (areas: any[]) => {
    const nodes: any[] = [];
    const edges: any[] = [];
    const ideaNodesArrayLocal: any[] = []; // Rename to avoid conflict

    // Create the root node with the main query
    const rootNodeId = "root-node";
    nodes.push({
      id: rootNodeId,
      data: {
        label: query,
        isRoot: true,
        content: "",
      },
      type: "expandable",
      style: {
        backgroundColor: "#ccffcc", // Green color for root node
      },
      sourcePosition: "right",
      targetPosition: "left",
    });

    areas.forEach((area, areaIndex) => {
      const areaId = `area-${areaIndex}`;

      // Create the area node
      nodes.push({
        id: areaId,
        data: {
          label: area.name,
          isRoot: false,
          content: area.purpose,
        },
        type: "expandable",
        style: {
          backgroundColor: "#ffffff", // White color for area nodes
        },
        sourcePosition: "right",
        targetPosition: "left",
      });

      // Create edge from root node to area node
      edges.push({
        id: `e-${rootNodeId}-${areaId}`,
        source: rootNodeId,
        target: areaId,
        type: "smoothstep",
        animated: true,
        style: { stroke: "#000", strokeWidth: 2 },
      });

      area.google_search_ideas.forEach((idea: any, ideaIndex: number) => {
        const ideaId = `area-${areaIndex}-idea-${ideaIndex}`;

        // Create the idea node
        nodes.push({
          id: ideaId,
          data: {
            label: idea.text || idea,
            displayLabel: `Waiting to research on ${idea.text || idea}`,
            content: "No content available.",
            status: "waiting",
          },
          type: "expandable",
          style: {
            backgroundColor: "#f0f0f0", // Light gray for waiting nodes
          },
          sourcePosition: "right",
          targetPosition: "left",
        });

        // Add to the ideaNodesArray
        ideaNodesArrayLocal.push({
          nodeId: ideaId,
          searchQuery: idea.text || idea,
          rootNodeId: areaId,
        });

        // Create the edge from the area node to this idea node
        edges.push({
          id: `e-${areaId}-${ideaId}`,
          source: areaId,
          target: ideaId,
          type: "smoothstep",
          animated: true,
          style: { stroke: "#000", strokeWidth: 2 },
        });
      });
    });

    // Use Dagre to calculate node positions with horizontal layout
    const { nodes: layoutNodes, edges: layoutEdges } = getLayoutedElements(
      nodes,
      edges,
      "LR" // "LR" for Left-Right layout
    );

    return { nodes: layoutNodes, edges: layoutEdges, ideaNodesArray: ideaNodesArrayLocal };
  };

  // Function to layout elements using Dagre
  const getLayoutedElements = (nodes: any[], edges: any[], direction = "LR") => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    dagreGraph.setGraph({
      rankdir: direction,
      nodesep: 100, // Increased for better spacing
      ranksep: 200, // Increased for better spacing
      marginx: 50,
      marginy: 50,
    });

    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      node.position = {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      };

      // No need for positionAbsolute in latest React Flow versions
    });

    return { nodes, edges };
  };

  return (
    <main
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Dock Component */}
      {showFlow && (
        <div
          style={{
            position: "fixed",
            bottom: "20px", // Adjust the bottom margin as needed
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 40, // Higher z-index to ensure it's on top
          }}
        >
          <DockDemo addSpreadsheetNode={addSpreadsheetNode} addChatbotNode={addChatbotNode} addContextNode={addContextNode}/>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 20,
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            padding: "20px",
            borderRadius: "8px",
          }}
        >
          <ButtonLoading />
        </div>
      )}

      <AnimatePresence>
        {!showFlow && !loading && areasData && (
          <motion.div
            key="area-selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <AreaSelection
              areasData={areasData}
              onProcessSelection={handleProcessSelection}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {showFlow && (
        <>
        <FlowCanvas
          showFlow={showFlow}
          nodes={nodes}
          edges={edges}
          ideaNodesArray={ideaNodesArray}
        />
        {/* Include SpreadsheetDialog here */}
        <SpreadsheetDialog />
        {/* Conditionally render ModernChatbot based on openChatbotNodeId */}
        <ModernChatbot />
        <ContextDialog />
        </>
      )}

      {!loading && !showFlow && !areasData && (
        <SearchBox
          query={query}
          setQuery={setQuery}
          handleSubmit={handleSubmit}
          showFlow={showFlow}
        />
      )}
    </main>
  );
};

export default FlowPage;
