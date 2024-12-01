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
  searchQuery: string;
  rootNodeId: string;
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
    rows?: any[]; // Updated from spreadsheetData to rows
    columnDefinitions?: ColumnDefinition[];
    contextEntries?: string[]; 
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

export interface Message {
  role: 'user' | 'assistant';
  content: string;
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
  conversations: Record<string, Message[]>;
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
  appendMessage: (nodeId: string, message: Message) => void;
  setConversation: (nodeId: string, messages: Message[]) => void;
  removeConversation: (nodeId: string) => void;
  setOpenContextNodeId: (nodeId: string | null) => void;
}

export const useFlowStore = create<FlowState>((set) => ({
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
  conversations: {},
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
      conversations: {},
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
              data: {
                ...node.data,
                rows,
              },
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
          ? {
              ...node,
              data: {
                ...node.data,
                columnDefinitions,
              },
            }
          : node
      ),
    })),
  appendMessage: (nodeId, message) =>
    set((state) => ({
      conversations: {
        ...state.conversations,
        [nodeId]: [...(state.conversations[nodeId] || []), message],
      },
    })),
  setConversation: (nodeId, messages) =>
    set((state) => ({
      conversations: {
        ...state.conversations,
        [nodeId]: messages,
      },
    })),
  removeConversation: (nodeId) =>
    set((state) => {
      const { [nodeId]: _, ...rest } = state.conversations;
      return { conversations: rest };
    }),
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
