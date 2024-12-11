// store.ts
import { create } from 'zustand';

export interface ColumnDefinition {
  id: string;
  name: string;
  description?: string;
  type: string;
  options?: string[];
}

export interface IdeaNode {
  nodeId: string;
  google_search_ideas: string[];
  rootNodeId: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface FlowNode {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
  data: {
    label: string;
    displayLabel?: string;
    content?: string;
    status?: string;
    isRoot?: boolean;
    rows?: any[];
    columnDefinitions?: ColumnDefinition[];
    contextEntries?: string[];
    conversation?: Message[]; // Added to store messages for chatbot nodes
  };
  sourcePosition?: string;
  targetPosition?: string;
  style?: React.CSSProperties;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
  style?: React.CSSProperties;
}

interface FlowState {
  nodes: FlowNode[];
  edges: FlowEdge[];
  ideaNodesArray: IdeaNode[];
  areasData: any | null;
  showFlow: boolean;
  loading: boolean;
  query: string;
  openSpreadsheetNodeId: string | null;
  openChatbotNodeId: string | null;
  openContextNodeId: string | null;
  // Actions
  addContextEntry: (nodeId: string, entry: string) => void;
  setNodes: (nodes: FlowNode[] | ((nodes: FlowNode[]) => FlowNode[])) => void;
  setEdges: (edges: FlowEdge[] | ((edges: FlowEdge[]) => FlowEdge[])) => void;
  addNode: (node: FlowNode | FlowNode[]) => void;
  addEdge: (edge: FlowEdge | FlowEdge[]) => void;
  setIdeaNodesArray: (ideaNodesArray: IdeaNode[]) => void;
  setAreasData: (data: any) => void;
  setShowFlow: (show: boolean) => void;
  setLoading: (loading: boolean) => void;
  setQuery: (query: string) => void;
  resetFlow: () => void;
  updateNodePosition: (nodeId: string, position: { x: number; y: number }) => void;
  updateSpreadsheetData: (nodeId: string, rows: any[]) => void;
  setOpenSpreadsheetNodeId: (nodeId: string | null) => void;
  setOpenChatbotNodeId: (nodeId: string | null) => void;
  updateColumnDefinitions: (nodeId: string, columnDefinitions: ColumnDefinition[]) => void;
  updateContextNodeLabel: (nodeId: string, newLabel: string) => void;
  updateChatNodeLabel: (nodeId: string, newLabel: string) => void;
  updateChatbotConversation: (nodeId: string, messages: Message[]) => void;
  setOpenContextNodeId: (nodeId: string | null) => void;
}

export const useFlowStore = create<FlowState>((set) => ({
  nodes: [],
  edges: [],
  ideaNodesArray: [],
  areasData: null,
  showFlow: true,
  loading: false,
  query: '',
  openSpreadsheetNodeId: null,
  openChatbotNodeId: null,
  openContextNodeId: null,

  setNodes: (nodes) =>
    set((state) => ({
      nodes: typeof nodes === 'function' ? nodes(state.nodes) : nodes,
    })),
  setEdges: (edges) =>
    set((state) => ({
      edges: typeof edges === 'function' ? edges(state.edges) : edges,
    })),
  addNode: (node) =>
    set((state) => ({
      nodes: [...state.nodes, ...(Array.isArray(node) ? node : [node])],
    })),
  addEdge: (edge) =>
    set((state) => ({
      edges: [...state.edges, ...(Array.isArray(edge) ? edge : [edge])],
    })),
  setIdeaNodesArray: (ideaNodesArray) => set({ ideaNodesArray }),
  setAreasData: (data) => set({ areasData: data }),
  setShowFlow: (show) => set({ showFlow: show }),
  setLoading: (loading) => set({ loading }),
  setOpenContextNodeId: (nodeId) => set({ openContextNodeId: nodeId }),
  setQuery: (query) => set({ query }),
  resetFlow: () =>
    set({
      nodes: [],
      edges: [],
      ideaNodesArray: [],
      areasData: null,
      showFlow: false,
      loading: false,
      query: '',
      openSpreadsheetNodeId: null,
      openChatbotNodeId: null,
      openContextNodeId: null,
    }),
  updateNodePosition: (nodeId, position) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, position } : node
      ),
    })),
  updateSpreadsheetData: (nodeId, rows) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: { ...node.data, rows },
            }
          : node
      ),
    })),
  setOpenSpreadsheetNodeId: (nodeId) => set({ openSpreadsheetNodeId: nodeId }),
  setOpenChatbotNodeId: (nodeId) => set({ openChatbotNodeId: nodeId }),
  updateColumnDefinitions: (nodeId, columnDefinitions) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, columnDefinitions } }
          : node
      ),
    })),
  updateContextNodeLabel: (nodeId, newLabel) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, label: newLabel } }
          : node
      ),
    })),
  updateChatNodeLabel: (nodeId, newLabel) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, label: newLabel } }
          : node
      ),
    })),

  // New action to store conversation in node data
  updateChatbotConversation: (nodeId, messages) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, conversation: messages } }
          : node
      ),
    })),

  addContextEntry: (nodeId, entry) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                contextEntries: [...(node.data.contextEntries || []), entry],
              },
            }
          : node
      ),
    })),
}));
