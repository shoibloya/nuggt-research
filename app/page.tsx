"use client";

import React from "react";
import FlowCanvas from "@/components/FlowCanvas";
import SearchBox from "@/components/SearchBox";
import AreaSelection from "@/components/AreaSelection";
import { ButtonLoading } from "@/components/ButtonLoading";
import { motion, AnimatePresence } from "framer-motion";
import dagre from "dagre";
import { DockDemo } from "@/components/DockDemo";
import { v4 as uuidv4 } from "uuid";
import { useFlowStore } from "@/storage/store";
import SpreadsheetDialog from "@/components/SpreadsheetDialog";
import ModernChatbot from "@/components/ModernChatbot";
import ContextDialog from "@/components/ContextDialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DotPattern } from "@/components/ui/dot-pattern";

import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
import { cleanData } from "@/utils/cleanData";

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

  const [showSearchBox, setShowSearchBox] = React.useState(true);
  const [showAreaSelection, setShowAreaSelection] = React.useState(false);

  const [user, setUser] = React.useState<any>(null);
  const [authLoading, setAuthLoading] = React.useState(true);

  const [dataLoaded, setDataLoaded] = React.useState(false);
  const [docExists, setDocExists] = React.useState(false);

  // Track if we have unsaved changes
  const changesPendingRef = React.useRef(false);

  // Track saving state for button
  const [isSaving, setIsSaving] = React.useState(false);

  // Listen for auth state changes
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sign in with Google
  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Generate unique label for newly created nodes
  const generateUniqueLabel = (type: string, baseLabel: string): string => {
    const count = nodes.filter((node) => node.type === type).length + 1;
    return `Untitled-${baseLabel}-${count}`;
  };

  // Handlers for adding new nodes
  const addSpreadsheetNode = () => {
    const newNodeId = `spreadsheet-${uuidv4()}`;
    const uniqueLabel = generateUniqueLabel("spreadsheet", "Spreadsheet");
    const newNode = {
      id: newNodeId,
      type: "spreadsheet",
      position: {
        x: 0,
        y: 0,
      },
      data: {
        label: uniqueLabel,
      },
      sourcePosition: "right",
      targetPosition: "left",
    };

    useFlowStore.getState().addNode(newNode);
    immediateSave();
  };

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
    immediateSave();
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
    immediateSave();
  };

  // Handle search
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (query.trim()) {
      setLoading(true);
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
        setShowSearchBox(false);
        setShowAreaSelection(true);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Process the selected areas in the AreaSelection component
  const handleProcessSelection = (selectedAreasData: any) => {
    const {
      nodes: generatedNodes,
      edges: generatedEdges,
      ideaNodesArray: generatedIdeaNodesArray,
    } = processGraphData(selectedAreasData);

    setNodes([...nodes, ...generatedNodes]);
    setEdges([...edges, ...generatedEdges]);
    setIdeaNodesArray([...ideaNodesArray, ...generatedIdeaNodesArray]);
    setShowAreaSelection(false);
    setAreasData(null);
    immediateSave();
  };

  // Convert data into new nodes and edges
  const processGraphData = (areas: any[]) => {
    const nodesLocal: any[] = [];
    const edgesLocal: any[] = [];
    const ideaNodesArrayLocal: any[] = [];

    const rootNodeId = `root-node-${uuidv4()}`;
    nodesLocal.push({
      id: rootNodeId,
      data: {
        label: query,
        isRoot: true,
        content: "",
      },
      type: "expandable",
      style: {
        backgroundColor: "#ccffcc",
      },
      sourcePosition: "right",
      targetPosition: "left",
    });

    areas.forEach((area, areaIndex) => {
      const areaId = `area-${areaIndex}-${uuidv4()}`;
      nodesLocal.push({
        id: areaId,
        data: {
          label: area.name,
          isRoot: false,
          content: area.purpose,
        },
        type: "expandable",
        style: {
          backgroundColor: "#ffffff",
        },
        sourcePosition: "right",
        targetPosition: "left",
      });

      edgesLocal.push({
        id: `e-${rootNodeId}-${areaId}`,
        source: rootNodeId,
        target: areaId,
        type: "smoothstep",
        animated: true,
        style: { stroke: "#000", strokeWidth: 2 },
      });

      area.google_search_ideas.forEach((idea: any, ideaIndex: number) => {
        const ideaId = `idea-${ideaIndex}-${uuidv4()}`;
        nodesLocal.push({
          id: ideaId,
          data: {
            label: idea.text || idea,
            displayLabel: `Waiting to research on ${idea.text || idea}`,
            content: "No content available.",
            status: "waiting",
          },
          type: "expandable",
          style: {
            backgroundColor: "#f0f0f0",
          },
          sourcePosition: "right",
          targetPosition: "left",
        });

        ideaNodesArrayLocal.push({
          nodeId: ideaId,
          searchQuery: idea.text || idea,
          rootNodeId: areaId,
        });

        edgesLocal.push({
          id: `e-${areaId}-${ideaId}`,
          source: areaId,
          target: ideaId,
          type: "smoothstep",
          animated: true,
          style: { stroke: "#000", strokeWidth: 2 },
        });
      });
    });

    const { nodes: layoutNodes, edges: layoutEdges } = getLayoutedElements(
      nodesLocal,
      edgesLocal,
      "LR"
    );

    return {
      nodes: layoutNodes,
      edges: layoutEdges,
      ideaNodesArray: ideaNodesArrayLocal,
    };
  };

  // Layout
  const getLayoutedElements = (nodes: any[], edges: any[], direction = "LR") => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    dagreGraph.setGraph({
      rankdir: direction,
      nodesep: 100,
      ranksep: 200,
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
    });

    return { nodes, edges };
  };

  // Toggle the search box
  const onWhatsAppClick = () => {
    setShowSearchBox(true);
    setShowAreaSelection(false);
  };

  // Load user data if logged in
  React.useEffect(() => {
    const loadUserData = async () => {
      if (user?.email) {
        const docRef = doc(db, "users", user.email);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setDocExists(true);
          if (data.nodes) setNodes(data.nodes);
          if (data.edges) setEdges(data.edges);
          if (data.ideaNodesArray) setIdeaNodesArray(data.ideaNodesArray);
          setDataLoaded(true);
        } else {
          setDocExists(false);
          setDataLoaded(true);
        }
      }
    };

    if (user?.email) {
      loadUserData();
    } else {
      // If user is not logged in, set dataLoaded to true so the rest can render
      setDataLoaded(true);
    }
  }, [user, setNodes, setEdges, setIdeaNodesArray]);

  // Warn user on refresh/close if there are unsaved changes
  React.useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (changesPendingRef.current) {
        event.preventDefault();
        event.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Save data to Firestore (only if user is logged in)
  const saveData = async () => {
    if (!user?.email || !dataLoaded) return;

    setIsSaving(true);
    const docRef = doc(db, "users", user.email);

    const newNodes = cleanData(nodes);
    const newEdges = cleanData(edges);
    const newIdeaNodesArray = cleanData(ideaNodesArray);

    const updates = {
      nodes: newNodes,
      edges: newEdges,
      ideaNodesArray: newIdeaNodesArray,
      lastUpdated: Date.now(),
    };

    try {
      if (!docExists) {
        await setDoc(docRef, updates, { merge: true });
        setDocExists(true);
      } else {
        await updateDoc(docRef, updates);
      }
      console.log("Data saved successfully!");
      changesPendingRef.current = false; // Mark changes as saved
    } catch (error) {
      console.error("Error saving data:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Mark changes as pending save
  const immediateSave = async () => {
    changesPendingRef.current = true;
  };

  // Show a loading indicator if auth is still checking
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <ButtonLoading />
      </div>
    );
  }

  // Render the main app
  return (
    <main
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top-right: Login / Logout / Save */}
      <div
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: 20,
          display: "flex",
          gap: "8px",
        }}
      >
        {user ? (
          <>
            {/* Show Save button only for logged-in users */}
            <Button variant="destructive" onClick={saveData} disabled={isSaving}>
              {isSaving ? (
                <span className="flex items-center space-x-2">
                  <svg
                    className="w-4 h-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    ></path>
                  </svg>
                  <span>Saving...</span>
                </span>
              ) : (
                "Save"
              )}
            </Button>

            {/* Sign Out Button */}
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </>
        ) : (
          // Login button if user is not logged in
          <Button variant="outline" onClick={handleGoogleSignIn}>
            Login
          </Button>
        )}
      </div>

      {/* Dock with Add Spreadsheet/Chatbot/Context, only if showFlow */}
      {showFlow && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 40,
          }}
        >
          <DockDemo
            addSpreadsheetNode={addSpreadsheetNode}
            addChatbotNode={addChatbotNode}
            addContextNode={addContextNode}
            onWhatsAppClick={onWhatsAppClick}
          />
        </div>
      )}

      {/* Loading overlay */}
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

      {/* Center area: SearchBox and AreaSelection */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 50,
          maxWidth: "800px",
          width: "90%",
        }}
      >
        <AnimatePresence>
        {showSearchBox && !loading && (
          <motion.div
            key="searchbox"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-4">
              <SearchBox
                query={query}
                setQuery={setQuery}
                handleSubmit={handleSubmit}
                showFlow={showFlow}
                // 1) Pass in the onClose prop:
                onClose={() => setShowSearchBox(false)}
              />
            </Card>
          </motion.div>
        )}
        </AnimatePresence>

        <AnimatePresence>
          {showAreaSelection && areasData && !loading && (
            <motion.div
              key="area-selection"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-4 max-h-[80vh] overflow-auto">
                <AreaSelection
                  areasData={areasData}
                  onProcessSelection={handleProcessSelection}
                />
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* The main flow / dialogs */}
      {showFlow && (
        <>
          <FlowCanvas
            showFlow={showFlow}
            nodes={nodes}
            edges={edges}
            ideaNodesArray={ideaNodesArray}
          />
          <SpreadsheetDialog />
          <ModernChatbot />
          <ContextDialog />
        </>
      )}
    </main>
  );
};

export default FlowPage;
