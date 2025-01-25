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
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { useFlowStore } from "@/storage/store";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react"; // lucide-react spinner

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
  const addContextEntry = useFlowStore((state) => state.addContextEntry);

  // Follow-up dialog states
  const [openFollowupDialog, setOpenFollowupDialog] = useState(false);
  const [followupQuery, setFollowupQuery] = useState("");
  const [loadingNewNode, setLoadingNewNode] = useState(false);

  // Details dialog states
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [detailQueries, setDetailQueries] = useState<string[]>([]);
  const [loadingQueries, setLoadingQueries] = useState(false);
  const [newDetailQuery, setNewDetailQuery] = useState("");

  // Node expansion state
  const [isExpanded, setIsExpanded] = useState(true);

  // Determine the background color based on node status
  let backgroundColor =
    style?.backgroundColor || (isRoot ? "#ccffcc" : "#ffffff");

  if (data.status === "waiting") {
    backgroundColor = "#f0f0f0";
  } else if (data.status === "researching") {
    backgroundColor = "#ffd699";
  } else if (data.status === "done") {
    backgroundColor = "#fff9c4"; // Light yellow
  }

  const borderClass = selected ? "border-2 border-gray-700" : "border border-gray-500";
  const nodeClassName = `py-2 px-3 rounded cursor-pointer text-center flex items-center justify-between text-black ${borderClass}`;

  // A lucide-react spinner
  const spinner = <Loader2 className="animate-spin h-4 w-4 mr-2 text-black" />;

  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
    const descendants = getDescendants(id);

    reactFlowInstance.setNodes((nds) =>
      nds.map((node) => {
        if (descendants.includes(node.id) && node.id !== id) {
          return {
            ...node,
            hidden: !isExpanded,
          };
        }
        return node;
      })
    );

    reactFlowInstance.setEdges((eds) =>
      eds.map((edge) => {
        if (descendants.includes(edge.id)) {
          return {
            ...edge,
            hidden: !isExpanded,
          };
        }
        return edge;
      })
    );
  };

  const handleAddToConsole = (nodeId: string) => {
    const selection = window.getSelection();
    const selectedText = selection ? selection.toString() : "";
    if (selectedText) {
      console.log(`Context Node ID: ${nodeId}`);
      addContextEntry(nodeId, selectedText);
    } else {
      console.log("No text selected.");
    }
  };

  const handleGetDetails = async () => {
    const selection = window.getSelection();
    const selectedText = selection ? selection.toString().trim() : "";
    if (!selectedText) {
      alert("No text selected. Please highlight some text before getting details.");
      return;
    }

    setLoadingQueries(true);
    setOpenDetailsDialog(true);

    try {
      // Call /api/generateSearchQueries with the entire node content and highlighted text
      const response = await fetch("/api/generateSearchQueries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          nodeContent: data.content || "",
          highlightedText: selectedText 
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate search queries");
      }

      const result = await response.json();
      const searchQueries = result.searchQueries || [];
      setDetailQueries(searchQueries);
    } catch (error) {
      console.error(error);
      setDetailQueries([]);
    } finally {
      setLoadingQueries(false);
    }
  };

  const handleDelete = () => {
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

  const getDescendants = (nodeId: string): string[] => {
    const descendants = [nodeId];
    let stack = [nodeId];
    while (stack.length > 0) {
      const currentNodeId = stack.pop();
      const childEdges = reactFlowInstance
        .getEdges()
        .filter((edge) => edge.source === currentNodeId);
      const childNodeIds = childEdges.map((edge) => edge.target);
      descendants.push(...childNodeIds);
      stack.push(...childNodeIds);
    }
    return descendants;
  };

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

  // Follow-up handler (no automatic queries)
  const handleFollowUp = () => {
    setOpenFollowupDialog(true);
  };

  const addFollowUpNode = async (query: string) => {
    if (!query) return;
    setLoadingNewNode(true);

    try {
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

      setFollowupQuery("");
      setOpenFollowupDialog(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingNewNode(false);
    }
  };

  const confirmDetailQueries = async () => {
    const node = reactFlowInstance.getNode(id);
    if (!node) return;

    const newNodeIds = detailQueries.map(() => `detail-${Date.now()}-${Math.random()}`);

    const newNodes = newNodeIds.map((newNodeId, index) => {
      const query = detailQueries[index];
      const newPosition = {
        x: node.position.x + 250,
        y: node.position.y + index * 100,
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
          backgroundColor: '#ffd699',
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

    await Promise.all(
      newNodeIds.map((newNodeId, index) => {
        const query = detailQueries[index];
        return addDetailNode(newNodeId, query);
      })
    );

    setOpenDetailsDialog(false);
    setDetailQueries([]);
    setNewDetailQuery("");
  };

  const addDetailNode = async (newNodeId: string, query: string) => {
    try {
      const response = await fetch('/api/researchDetails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data for detail node');
      }

      const result = await response.json();
      const contentData = result.content;
      const sources = result.sources;

      updateNode(newNodeId, {
        data: {
          status: 'done',
          displayLabel: query,
          content: contentData,
          sources,
        },
        style: {
          backgroundColor: '#ffffff',
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
          backgroundColor: '#ffffff',
        },
      });
    }
  };

  // This helps us style any links in the content
  const renderers = {
    a: ({ node, ...props }) => (
      <a className="text-blue-600 underline" {...props} />
    ),
  };

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

      {/* Handles for edges */}
      {targetPosition && (
        <Handle
          type="target"
          position={targetPosition}
          className="top-1/2 -translate-y-1/2 transform bg-gray-700"
          style={{ background: "#555" }}
        />
      )}
      {sourcePosition && (
        <Handle
          type="source"
          position={sourcePosition}
          className="top-1/2 -translate-y-1/2 transform bg-gray-700"
          style={{ background: "#555" }}
        />
      )}

      {/* Node Content */}
      <div className={nodeClassName} style={{ backgroundColor }}>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="default" className="bg-white p-2 hover:bg-yellow-200">
              <div className="flex items-center">
                {/* Show spinner if showSpinner is true and status is 'researching' */}
                {data.showSpinner && data.status === "researching" ? spinner : null}
                <strong className="text-black">{data.displayLabel || data.label}</strong>
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[50rem] p-0 max-h-[500px] overflow-y-auto bg-white">
            <ContextMenu>
              <ContextMenuTrigger asChild>
                <div className="text-black">
                  {/* Show main content if it exists */}
                  {data.content ? (
                    <div>
                      <ReactMarkdown
                        className="prose prose-md p-2 dark:prose-invert max-w-none"
                        remarkPlugins={[remarkGfm]}
                        components={renderers}
                      >
                        {data.content}
                      </ReactMarkdown>

                      {/*
                        Show references from data.sources if they exist.
                        data.sources is an object where each key is a URL.
                      */}
                      {data.sources && Object.keys(data.sources).length > 0 && (
                        <div className="p-2">
                          <strong>References:</strong>
                          <ol>
                            {Object.keys(data.sources).map((url, index) => (
                              <li key={url}>
                                [{index + 1}]{" "}
                                <a href={url} target="_blank" rel="noopener noreferrer">
                                  {url}
                                </a>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
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
                <ContextMenuItem onSelect={handleGetDetails}>
                  Get Details
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </PopoverContent>
        </Popover>

        {/* Expand/Collapse button */}
        <Button onClick={toggleExpansion} className="ml-2">
          {isExpanded ? "<" : ">"}
        </Button>
      </div>

      {/* Follow-up Dialog (No automatic queries, just user input) */}
      <Dialog open={openFollowupDialog} onOpenChange={setOpenFollowupDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Follow-up</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              placeholder="Enter your Google search query"
              value={followupQuery}
              onChange={(e) => setFollowupQuery(e.target.value)}
              disabled={loadingNewNode}
            />
            <Button
              onClick={() => addFollowUpNode(followupQuery)}
              disabled={!followupQuery || loadingNewNode}
            >
              Submit
            </Button>
            {loadingNewNode && (
              <div className="flex justify-center">
                <Progress value={50} className="w-[60%]" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Dialog with queries card */}
      <Dialog open={openDetailsDialog} onOpenChange={setOpenDetailsDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Details</DialogTitle>
          </DialogHeader>
          {loadingQueries ? (
            <div className="flex flex-col items-center justify-center space-y-4 p-4">
              <div>Generating queries...</div>
              <Progress value={50} className="w-[60%]" />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Edit Queries</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {detailQueries.map((query, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={query}
                      onChange={(e) => {
                        const newQueries = [...detailQueries];
                        newQueries[index] = e.target.value;
                        setDetailQueries(newQueries);
                      }}
                      className="flex-1"
                    />
                    <Button
                      variant="destructive"
                      onClick={() => {
                        const newQueries = detailQueries.filter((_, i) => i !== index);
                        setDetailQueries(newQueries);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Add new query"
                    value={newDetailQuery}
                    onChange={(e) => setNewDetailQuery(e.target.value)}
                  />
                  <Button
                    onClick={() => {
                      if (newDetailQuery.trim()) {
                        setDetailQueries([...detailQueries, newDetailQuery.trim()]);
                        setNewDetailQuery("");
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button variant="secondary" onClick={() => setOpenDetailsDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={confirmDetailQueries}
                  disabled={detailQueries.length === 0}
                >
                  Confirm
                </Button>
              </CardFooter>
            </Card>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpandableNode;
