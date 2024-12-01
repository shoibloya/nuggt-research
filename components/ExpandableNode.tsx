// ExpandableNode.tsx
"use client";

import React, { useState } from "react";
import {
  Handle,
  NodeProps,
  NodeToolbar,
  useReactFlow,
} from "reactflow";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useFlowStore } from "@/storage/store"; // Importing the store

const ExpandableNode: React.FC<NodeProps> = ({
  id,
  data,
  selected,
  style,
  sourcePosition,
  targetPosition,
}) => {
  const isRoot = data.isRoot;

  const reactFlowInstance = useReactFlow();

  // State for dialog visibility and follow-up options
  const [openDialog, setOpenDialog] = useState(false);
  const [followUpOptions, setFollowUpOptions] = useState<string[]>([]);
  const [loadingFollowUps, setLoadingFollowUps] = useState(false);
  const [customQuery, setCustomQuery] = useState("");
  const [loadingNewNode, setLoadingNewNode] = useState(false);

  const addContextEntry = useFlowStore((state) => state.addContextEntry);

  // Determine the background color based on the node's status
  let backgroundColor =
    style?.backgroundColor || (isRoot ? "#ccffcc" : "#ffffff");

  // If the node has a status, override the background color
  if (data.status === "waiting") {
    backgroundColor = "#f0f0f0"; // Light gray for waiting nodes
  } else if (data.status === "researching") {
    backgroundColor = "#ffd699"; // Light orange for researching node
  } else if (data.status === "done") {
    backgroundColor = "#ffffff"; // White for done nodes
  }

  const buttonStyle = {
    padding: "8px 12px",
    backgroundColor: backgroundColor,
    border: selected ? "2px solid #555" : "1px solid #777",
    borderRadius: "5px",
    color: "#000",
    cursor: "pointer",
    textAlign: "center" as const,
  };

  // Function to handle logging a specific context node's ID
  const handleAddToConsole = (nodeId: string) => {
    const selection = window.getSelection();
    const selectedText = selection ? selection.toString() : "";
    if (selectedText){
      console.log(`Context Node ID: ${nodeId}`);
      addContextEntry(nodeId, selectedText);
    } else {
      console.log("No text selected.");
    }
  };

  // Function to update node data and style
  const updateNode = (
    nodeId: string,
    updates: {
      data?: any;
      style?: any;
    }
  ) => {
    reactFlowInstance.setNodes((nds) =>
      nds.map((node) => {
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
          };
        }
        return node;
      })
    );
  };

  // Handler for delete button
  const handleDelete = () => {
    // Remove the node and its descendants
    const nodesToDelete = getDescendants(id);
    reactFlowInstance.setNodes((nds) =>
      nds.filter((node) => !nodesToDelete.includes(node.id))
    );
    reactFlowInstance.setEdges((eds) =>
      eds.filter(
        (edge) =>
          !nodesToDelete.includes(edge.source) &&
          !nodesToDelete.includes(edge.target)
      )
    );
  };

  // Function to get all descendants of a node
  const getDescendants = (nodeId: string): string[] => {
    const descendants = [nodeId];
    let stack = [nodeId];
    while (stack.length > 0) {
      const currentNodeId = stack.pop();
      // Find children of current node
      const childEdges = reactFlowInstance
        .getEdges()
        .filter((edge) => edge.source === currentNodeId);
      const childNodeIds = childEdges.map((edge) => edge.target);
      descendants.push(...childNodeIds);
      stack.push(...childNodeIds);
    }
    return descendants;
  };

  // Handler for follow-up button
  const handleFollowUp = async () => {
    setOpenDialog(true);
    setLoadingFollowUps(true);

    try {
      const response = await fetch("/api/followUp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic: data.label, content: data.content }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch follow-up options");
      }

      const result = await response.json();

      setFollowUpOptions(result.google_search || []);
    } catch (error) {
      console.error(error);
      // Handle error, maybe set a state to display an error message
    } finally {
      setLoadingFollowUps(false);
    }
  };

  // Handler for adding a new follow-up node using /api/researchDetails
  const addFollowUpNode = async (query: string) => {
    if (!query) return;
    setLoadingNewNode(true);

    try {
      // Call the researchDetails API to get content
      const response = await fetch("/api/researchDetails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch node content");
      }

      const result = await response.json();
      const { content, sources } = result;

      const node = reactFlowInstance.getNode(id);
      if (!node) return;

      const newNodeId = `follow-up-${Date.now()}`;
      const newPosition = {
        x: node.position.x + 250,
        y: node.position.y,
      };

      const newNode = {
        id: newNodeId,
        position: newPosition,
        data: {
          label: query,
          displayLabel: query,
          content: content || "No content available.",
          sources,
          status: "done",
        },
        type: "expandable",
        style: {
          backgroundColor: "#ffffff",
        },
        sourcePosition: "right",
        targetPosition: "left",
      };

      const newEdge = {
        id: `e-${id}-${newNodeId}`,
        source: id,
        target: newNodeId,
        type: "smoothstep",
        animated: true,
        style: { stroke: "#000", strokeWidth: 2 },
      };

      reactFlowInstance.setNodes((nds) => nds.concat(newNode));
      reactFlowInstance.setEdges((eds) => eds.concat(newEdge));

      setCustomQuery("");
      setOpenDialog(false);
    } catch (error) {
      console.error(error);
      // Handle error, maybe set a state to display an error message
    } finally {
      setLoadingNewNode(false);
    }
  };

  // Handler for "Details >" button after each bullet point
  const handleDetails = async (bulletPointText: string) => {
    try {
      // Generate search queries related to the bulletPointText
      const response = await fetch('/api/generateSearchQueries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bulletPointText }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate search queries');
      }

      const result = await response.json();
      const searchQueries = result.searchQueries;

      // For each search query, create a new node
      const newNodeIds = searchQueries.map(() => `detail-${Date.now()}-${Math.random()}`);

      const node = reactFlowInstance.getNode(id);
      if (!node) return;

      // Create all nodes first
      const newNodes = newNodeIds.map((newNodeId, index) => {
        const query = searchQueries[index];
        const newPosition = {
          x: node.position.x + 250,
          y: node.position.y + index * 100, // Adjust y position to avoid overlap
        };

        return {
          id: newNodeId,
          position: newPosition,
          data: {
            label: query,
            displayLabel: `Researching on ${query}`,
            content: '',
            status: 'researching',
          },
          type: 'expandable',
          style: {
            backgroundColor: '#ffd699', // Light orange
          },
          sourcePosition: 'right',
          targetPosition: 'left',
        };
      });

      const newEdges = newNodeIds.map((newNodeId) => ({
        id: `e-${id}-${newNodeId}`,
        source: id,
        target: newNodeId,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#000', strokeWidth: 2 },
      }));

      reactFlowInstance.setNodes((nds) => nds.concat(newNodes));
      reactFlowInstance.setEdges((eds) => eds.concat(newEdges));

      // Now process fetching content for all nodes in parallel
      await Promise.all(
        newNodeIds.map((newNodeId, index) => {
          const query = searchQueries[index];
          return addDetailNode(newNodeId, query);
        })
      );
    } catch (error) {
      console.error(error);
      // Handle error
    }
  };

  // Function to add detail node and fetch content
  const addDetailNode = async (newNodeId: string, query: string) => {
    // Fetch content for the new node
    try {
      // Fetch detailed content using our new API
      const response = await fetch('/api/researchDetails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch node content');
      }

      const result = await response.json();
      const contentData = result.content;
      const sources = result.sources;

      // Update the node with the generated content
      updateNode(newNodeId, {
        data: {
          status: 'done',
          displayLabel: query,
          content: contentData,
          sources,
        },
        style: {
          backgroundColor: '#ffffff', // White
        },
      });
    } catch (error) {
      console.error(error);
      updateNode(newNodeId, {
        data: {
          status: 'done',
          displayLabel: query,
          content: 'Failed to fetch data.',
        },
        style: {
          backgroundColor: '#ffffff', // White
        },
      });
    }
  };

  // Custom renderer for list items to include "Details >" button
  const renderers = {
    li: ({ children, ...props }) => {
      // Instead of extracting text, you can use React's Children utilities
      const extractText = (children) => {
        return React.Children.toArray(children)
          .map(child => {
            if (typeof child === 'string') return child;
            if (child.props && child.props.children) {
              return extractText(child.props.children);
            }
            return '';
          })
          .join('');
      };
    
      const bulletPointText = extractText(children);
    
      return (
        <li {...props} style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ flexGrow: 1 }}>
            {children}
          </span>
          <Button
            
            onClick={() => handleDetails(bulletPointText)}
            style={{ marginLeft: '8px' }}
          >
            Details &gt;
          </Button>
        </li>
      );
    },
    a: ({ node, ...props }) => (
      <a
        style={{
          color: "#1a0dab", // Distinct blue color
          textDecoration: "underline",
        }}
        {...props}
      />
    ),
  };

  // Retrieve all contextNodes from the store
  const { nodes: allNodes } = useFlowStore.getState();
  const contextNodes = allNodes.filter((node) => node.type === "contextNode");

  return (
    <div style={{ position: "relative" }}>
      {/* Toolbar */}
      <NodeToolbar isVisible={selected} position="top">
        <Button variant="destructive" className="mr-1" onClick={handleDelete}>
          Delete
        </Button>
        <Button onClick={handleFollowUp}>Follow-up</Button>
      </NodeToolbar>

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

      {/* Popover for expandable content */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="default" style={buttonStyle}>
            <strong>{data.displayLabel || data.label}</strong>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          style={{
            width: "50rem",
            padding: "0px",
            maxHeight: "400px",
            overflowY: "auto",
          }}
        >
          {/* Wrap the content with ContextMenu */}
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <div style={{ color: "#000" }}>
                {data.content ? (
                  <div>
                    <ReactMarkdown
                      className="prose prose-lg dark:prose-invert max-w-none"
                      remarkPlugins={[remarkGfm]}
                      components={renderers}
                    >
                      {data.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p>No content available.</p>
                )}
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuSub>
                <ContextMenuSubTrigger>Add to console</ContextMenuSubTrigger>
                <ContextMenuSubContent>
                  {contextNodes.length > 0 ? (
                    contextNodes.map((contextNode) => (
                      <ContextMenuItem
                        key={contextNode.id}
                        onSelect={() => handleAddToConsole(contextNode.id)}
                      >
                        {contextNode.data.label || contextNode.id}
                      </ContextMenuItem>
                    ))
                  ) : (
                    <ContextMenuItem disabled>No Context Nodes Available</ContextMenuItem>
                  )}
                </ContextMenuSubContent>
              </ContextMenuSub>
            </ContextMenuContent>
          </ContextMenu>
        </PopoverContent>
      </Popover>

      {/* Dialog for follow-up */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Follow-up</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {loadingFollowUps ? (
              <div>Loading follow-up options...</div>
            ) : (
              <>
                <Input
                  placeholder="Enter your own follow-up query"
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  disabled={loadingNewNode}
                />
                <Button
                  onClick={() => addFollowUpNode(customQuery)}
                  disabled={!customQuery || loadingNewNode}
                >
                  Submit
                </Button>
                {followUpOptions.map((option, index) => (
                  <Button
                    key={index}
                    className="w-full"
                    onClick={() => addFollowUpNode(option)}
                    disabled={loadingNewNode}
                  >
                    {option}
                  </Button>
                ))}
              </>
            )}
            {loadingNewNode && <div>Generating content...</div>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpandableNode;
