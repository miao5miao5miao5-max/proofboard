"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  useReactFlow,
  useViewport,
  ReactFlowProvider,
  type Node,
  type Edge,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Dagre from "@dagrejs/dagre";
import { SideNav } from "@/components/layout/SideNav";
import { TopBar } from "@/components/layout/TopBar";
import { MainContent } from "@/components/layout/MainContent";
import { ConceptNode, type NodeStatus } from "@/components/canvas/ConceptNode";
import { CanvasStatsOverlay } from "@/components/canvas/StatsOverlay";
import { CanvasControls } from "@/components/canvas/CanvasControls";
import { MagneticDotGrid } from "@/components/canvas/MagneticDotGrid";
import { FluidGlassBackground } from "@/components/upload/FluidGlassBackground";
import { GlassStatePanel } from "@/components/ui/GlassStatePanel";

interface RawConcept {
  id: string;
  title: string;
  description: string;
  keyPoints: string[];
  keyPointsViz?: string;
  connections: string[];
  slideRange?: [number, number];
}

interface ConceptData {
  id: string;
  label: string;
  description: string;
  keyPoints: string[];
  keyPointsViz?: string;
  status: NodeStatus;
  icon: string;
  index: number;
}

const ICONS = [
  "lightbulb", "hub", "apps", "school",
  "summarize", "psychology", "science", "explore",
];

const nodeTypes = { concept: ConceptNode };

const NODE_WIDTH  = 240;
const NODE_HEIGHT = 160;

type FlowNode = Node<Record<string, unknown>>;
type FlowEdge = Edge;

function applyDagreLayout(nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", nodesep: 50, ranksep: 80 });
  nodes.forEach((n) => g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  edges.forEach((e) => g.setEdge(e.source, e.target));
  Dagre.layout(g);

  const positioned = nodes.map((n) => {
    const pos = g.node(n.id);
    return {
      ...n,
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
    };
  });

  const nodeCount = positioned.length;
  const cols = Math.min(Math.ceil(Math.sqrt(nodeCount * 1.5)), 4);
  const colWidth = Math.max((window.innerWidth - 400) / cols, NODE_WIDTH + 100);
  const rowHeight = NODE_HEIGHT + 120;

  return positioned.map((n, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const isReverseRow = row % 2 === 1;
    const finalCol = isReverseRow ? cols - 1 - col : col;
    const x = 80 + finalCol * Math.max(colWidth, NODE_WIDTH + 40);
    const y = 80 + row * rowHeight;
    return { ...n, position: { x, y } };
  });
}

function edgeColorForStatus(status: NodeStatus | undefined): string {
  if (status === "done")   return "rgba(52,211,153,0.8)";
  if (status === "active") return "rgba(79,142,247,0.8)";
  return "#c0c0cc";
}

interface EdgeConn { id: string; source: string; target: string; animated: boolean }

function readStoredConcepts(): RawConcept[] {
  if (typeof window === "undefined") return [];

  const stored = localStorage.getItem("provable_concepts");
  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function buildEdges(conceptData: ConceptData[], connections: EdgeConn[]): FlowEdge[] {
  const statusMap = new Map(conceptData.map((c) => [c.id, c.status]));
  return connections.map((conn) => ({
    id:       conn.id,
    source:   conn.source,
    target:   conn.target,
    type:     "bezier",
    animated: conn.animated,
    style: {
      stroke:      edgeColorForStatus(statusMap.get(conn.source)),
      strokeWidth: 1.5,
      opacity:     0.6,
    },
  }));
}

/** Transform raw API concepts into ReactFlow node + edge data */
function conceptsToGraph(raw: RawConcept[]): {
  conceptData: ConceptData[];
  edgeConnections: EdgeConn[];
} {
  const conceptData: ConceptData[] = raw.map((c, i) => ({
    id:          c.id,
    label:       c.title,
    description: c.description ?? c.keyPoints?.[0] ?? "",
    keyPoints:   c.keyPoints ?? [],
    keyPointsViz: c.keyPointsViz,
    status:      i === 0 ? "active" : "pending",
    icon:        ICONS[i % ICONS.length],
    index:       i,
  }));

  const edgeConnections: EdgeConn[] = [];
  raw.forEach((c, i) => {
    if (i < raw.length - 1) {
      const nextId = raw[i + 1].id;
      edgeConnections.push({
        id:       `e-${c.id}-${nextId}`,
        source:   c.id,
        target:   nextId,
        animated: i === 0,
      });
    }
  });

  return { conceptData, edgeConnections };
}

function CanvasContent() {
  const router = useRouter();
  const { zoomIn, zoomOut, fitView, setViewport, getViewport } = useReactFlow();
  const { zoom } = useViewport();
  const [projectName, setProjectName] = useState<string>("");
  const [storedConcepts, setStoredConcepts] = useState<RawConcept[] | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const filename = localStorage.getItem("pb_filename");
    if (filename) setProjectName(filename.replace(".pdf", ""));

    setStoredConcepts(readStoredConcepts());
  }, []);

  const { conceptData, edgeConnections } = useMemo(
    () => conceptsToGraph(storedConcepts ?? []),
    [storedConcepts]
  );

  const rawEdges = useMemo(
    () => buildEdges(conceptData, edgeConnections),
    [conceptData, edgeConnections]
  );

  useEffect(() => {
    if (conceptData.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const rawNodes: FlowNode[] = conceptData.map((concept) => ({
      id: concept.id,
      type: "concept",
      position: { x: 0, y: 0 },
      data: concept as unknown as Record<string, unknown>,
    }));

    setEdges(rawEdges);
    setNodes(applyDagreLayout(rawNodes, rawEdges));
  }, [conceptData, rawEdges, setEdges, setNodes]);

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      localStorage.setItem("provable_active_concept", node.id);
    },
    []
  );

  const completion = useMemo(() => {
    if (nodes.length === 0) return 0;
    const doneCount = nodes.filter(
      (n) => (n.data as unknown as ConceptData).status === "done"
    ).length;
    return Math.round((doneCount / nodes.length) * 100);
  }, [nodes]);

  const masteryLevel = useMemo(() => {
    if (completion >= 80) return 5;
    if (completion >= 60) return 4;
    if (completion >= 40) return 3;
    if (completion >= 20) return 2;
    return 1;
  }, [completion]);

  const handleZoomIn     = useCallback(() => zoomIn({ duration: 200 }), [zoomIn]);
  const handleZoomOut    = useCallback(() => zoomOut({ duration: 200 }), [zoomOut]);
  const handleCenter     = useCallback(() => fitView({ duration: 200, padding: 0.2 }), [fitView]);
  const handleZoomChange = useCallback(
    (newZoom: number) => {
      const vp = getViewport();
      setViewport({ ...vp, zoom: newZoom }, { duration: 200 });
    },
    [setViewport, getViewport]
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent">
      <FluidGlassBackground />
      <SideNav user={{ name: "Max", role: "Student" }} />
      <TopBar projectName={projectName || "Canvas"} />

      <MainContent>
        <div className="relative w-full h-full bg-transparent">
          {storedConcepts !== null && storedConcepts.length === 0 ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center px-6">
              <GlassStatePanel
                icon="upload_file"
                title="No concepts yet"
                description="Upload a PDF to generate your knowledge canvas and turn the background into a map you can actually study."
                actionLabel="Upload a PDF"
                onAction={() => router.push("/upload")}
              />
            </div>
          ) : storedConcepts === null ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center px-6">
              <GlassStatePanel
                icon="hourglass_top"
                title="Loading canvas"
                description="We're restoring the concepts extracted from your last upload."
                actionLabel="Back to Upload"
                onAction={() => router.push("/upload")}
              />
            </div>
          ) : storedConcepts !== null ? (
            <>
              <MagneticDotGrid zoom={zoom} />
              <CanvasStatsOverlay
                completion={completion}
                nodeCount={nodes.length}
                masteryLevel={masteryLevel}
              />

              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={handleNodeClick}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.1}
                maxZoom={2}
                style={{ background: "transparent" }}
              >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="#d0d0d8" />
              </ReactFlow>

              <CanvasControls
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onCenter={handleCenter}
                zoom={zoom}
                onZoomChange={handleZoomChange}
              />
            </>
          ) : null}
        </div>
      </MainContent>
    </div>
  );
}

export default function CanvasPage() {
  return (
    <ReactFlowProvider>
      <CanvasContent />
    </ReactFlowProvider>
  );
}
