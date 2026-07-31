"use client";

import * as React from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type NodeProps,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Bot,
  Braces,
  Circle,
  Clock,
  Code2,
  Database,
  FileSpreadsheet,
  Filter,
  Globe,
  GitBranch,
  Mail,
  MessageSquare,
  MessagesSquare,
  Send,
  Wand2,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NODE_CATEGORY_LABELS } from "@/constants/hub";
import type {
  WorkflowNodeType,
  WorkflowNode,
  WorkflowEdge,
  WalkthroughStep,
  PublicWorkflowTemplate,
} from "@/types/hub";
import { saveSharedWorkflowAction } from "@/lib/hub/actions";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  zap: Zap,
  bot: Bot,
  globe: Globe,
  clock: Clock,
  filter: Filter,
  branch: GitBranch,
  mail: Mail,
  slack: MessagesSquare,
  sheets: FileSpreadsheet,
  database: Database,
  code: Code2,
  message: MessageSquare,
  send: Send,
  wand: Wand2,
  braces: Braces,
};

function NodeIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? Circle;
  return <Icon className={className} />;
}

type BuilderNode = Node<
  { nodeKey: string; label: string; config: Record<string, unknown> },
  "workflow"
>;

function toWorkflowNode(node: BuilderNode): WorkflowNode {
  return {
    id: node.id,
    type: node.data.nodeKey,
    position: node.position,
    config: node.data.config,
    label: node.data.label,
  };
}

function toBuilderNode(workflowNode: WorkflowNode, nodeTypes: WorkflowNodeType[]): BuilderNode {
  const nodeType = nodeTypes.find((n) => n.key === workflowNode.type);
  return {
    id: workflowNode.id,
    type: "workflow",
    position: workflowNode.position,
    data: {
      nodeKey: workflowNode.type,
      label: workflowNode.label ?? nodeType?.name ?? workflowNode.type,
      config: workflowNode.config,
    },
  };
}
function WorkflowNodeCard({ data, selected }: NodeProps<BuilderNode>) {
  return (
    <div
      className={cn(
        "border-border bg-card rounded-lg border px-3 py-2 text-xs shadow-sm",
        selected && "ring-primary/50 shadow-primary/10 ring-2",
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-primary !h-2 !w-2" />
      <div className="flex items-center gap-2">
        <NodeIcon name={data.nodeKey} className="h-3.5 w-3.5" />
        <span className="font-semibold">{data.label}</span>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-primary !h-2 !w-2" />
    </div>
  );
}

const nodeTypesMap = { workflow: WorkflowNodeCard };

interface WorkflowBuilderProps {
  nodeTypes: WorkflowNodeType[];
  templates: PublicWorkflowTemplate[];
  mode?: "builder" | "form" | "readonly";
  initialNodes?: WorkflowNode[];
  initialEdges?: WorkflowEdge[];
  initialCanvas?: Record<string, unknown>;
  initialTitle?: string;
  initialWalkthrough?: WalkthroughStep[];
  onCommit?: (data: {
    title: string;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    canvas: Record<string, unknown>;
    walkthrough: WalkthroughStep[];
  }) => void;
}

function BuilderInner({
  nodeTypes,
  templates,
  mode = "builder",
  initialNodes = [],
  initialEdges = [],
  initialTitle = "",
  initialWalkthrough = [],
  onCommit,
}: WorkflowBuilderProps) {
  const toast = useToast();
  const counterRef = React.useRef(
    Math.max(
      0,
      ...initialNodes.map((n) => {
        const match = /^n_(\d+)$/.exec(n.id);
        return match ? Number(match[1]) : 0;
      }),
    ),
  );
  const [nodes, setNodes] = useNodesState<BuilderNode>(
    initialNodes.map((n) => toBuilderNode(n, nodeTypes)),
  );
  const [edges, setEdges] = useEdgesState<Edge>(
    initialEdges.map((e) => ({ id: e.id, source: e.source, target: e.target, type: "smoothstep" })),
  );
  const [title, setTitle] = React.useState(initialTitle);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [shareCode, setShareCode] = React.useState<string | null>(null);
  const [showWalkthrough, setShowWalkthrough] = React.useState(false);
  const [walkthrough, setWalkthrough] = React.useState<WalkthroughStep[]>(initialWalkthrough);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const readonly = mode === "readonly";

  const selectedNode = nodes.find((n) => n.id === selectedId) ?? null;
  const selectedNodeType = selectedNode
    ? nodeTypes.find((n) => n.key === selectedNode.data.nodeKey)
    : null;

  const nodeTypeMap = React.useMemo(() => new Map(nodeTypes.map((n) => [n.key, n])), [nodeTypes]);

  function onNodesChange(changes: NodeChange<BuilderNode>[]) {
    setNodes(applyNodeChanges(changes, nodes));
  }

  function onEdgesChange(changes: EdgeChange<Edge>[]) {
    setEdges(applyEdgeChanges(changes, edges));
  }

  function onConnect(connection: Connection) {
    if (readonly) return;
    setEdges((eds) => addEdge({ ...connection, type: "smoothstep" }, eds));
  }

  function addNode(nodeType: WorkflowNodeType, position?: { x: number; y: number }) {
    if (readonly) return;
    counterRef.current += 1;
    const id = `n_${counterRef.current}`;
    const newNode: BuilderNode = {
      id,
      type: "workflow",
      position: position ?? {
        x: 80 + nodes.length * 24,
        y: 120 + ((nodes.length * 37) % 160),
      },
      data: {
        nodeKey: nodeType.key,
        label: nodeType.name,
        config: { ...nodeType.default_config },
      },
    };
    setNodes((ns) => [...ns, newNode]);
    setSelectedId(id);
  }

  function onDragOver(event: React.DragEvent) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function onDrop(event: React.DragEvent) {
    event.preventDefault();
    const key = event.dataTransfer.getData("application/workflow-node");
    if (!key) return;
    const nodeType = nodeTypeMap.get(key);
    if (!nodeType) return;
    const rect = event.currentTarget.getBoundingClientRect();
    addNode(nodeType, {
      x: event.clientX - rect.left - 60,
      y: event.clientY - rect.top - 20,
    });
  }

  function updateSelectedConfig(patch: Record<string, unknown>) {
    if (!selectedNode || readonly) return;
    setNodes((ns) =>
      ns.map((n) =>
        n.id === selectedNode.id
          ? { ...n, data: { ...n.data, config: { ...n.data.config, ...patch } } }
          : n,
      ),
    );
  }

  function updateSelectedLabel(label: string) {
    if (!selectedNode || readonly) return;
    setNodes((ns) =>
      ns.map((n) => (n.id === selectedNode.id ? { ...n, data: { ...n.data, label } } : n)),
    );
  }

  function loadTemplate(template: PublicWorkflowTemplate) {
    setNodes(template.nodes.map((n) => toBuilderNode(n, nodeTypes)));
    setEdges(
      template.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: "smoothstep",
      })),
    );
    setTitle(template.title);
    setWalkthrough(template.walkthrough);
    setSelectedId(null);
    setShareCode(null);
    toast.success(`Loaded "${template.title}"`);
  }

  function exportJson() {
    const payload = {
      title,
      nodes: nodes.map(toWorkflowNode),
      edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
      canvas: {},
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title || "workflow").toLowerCase().replace(/\s+/g, "-")}.workflow.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJson(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as {
          title?: string;
          nodes?: WorkflowNode[];
          edges?: WorkflowEdge[];
        };
        if (!Array.isArray(parsed.nodes)) throw new Error("Invalid workflow file.");
        setNodes(parsed.nodes.map((n) => toBuilderNode(n, nodeTypes)));
        setEdges(
          (parsed.edges ?? []).map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            type: "smoothstep",
          })),
        );
        if (parsed.title) setTitle(parsed.title);
        setSelectedId(null);
        setShareCode(null);
        toast.success("Workflow imported.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Invalid workflow file.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  function reset() {
    setNodes([]);
    setEdges([]);
    setTitle("");
    setWalkthrough([]);
    setSelectedId(null);
    setShareCode(null);
  }

  async function handleSaveShare() {
    if (nodes.length === 0) {
      toast.error("Add at least one node before saving.");
      return;
    }
    setSaving(true);
    const result = await saveSharedWorkflowAction({
      title: title || "Untitled workflow",
      name: name || null,
      email: email || null,
      nodes: nodes.map(toWorkflowNode),
      edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
      canvas: {},
    });
    setSaving(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setShareCode(result.data.share_code);
    toast.success("Workflow saved! Share the link below.");
  }

  function handleCommit() {
    if (!onCommit) return;
    onCommit({
      title,
      nodes: nodes.map(toWorkflowNode),
      edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
      canvas: {},
      walkthrough,
    });
    toast.success("Workflow applied to the form.");
  }

  const palette = React.useMemo(() => {
    const grouped = new Map<string, WorkflowNodeType[]>();
    for (const nodeType of nodeTypes.filter((n) => n.status === "published")) {
      const list = grouped.get(nodeType.category) ?? [];
      list.push(nodeType);
      grouped.set(nodeType.category, list);
    }
    return grouped;
  }, [nodeTypes]);

  return (
    <div className={cn("flex h-full flex-col", readonly ? "gap-0" : "gap-3")}>
      {!readonly && (
        <div className="flex flex-wrap items-center gap-2">
          {mode === "builder" && (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Workflow title"
              className="h-9 w-56"
            />
          )}
          {mode === "builder" && templates.length > 0 && (
            <select
              value=""
              onChange={(e) => {
                const template = templates.find((t) => t.slug === e.target.value);
                if (template) loadTemplate(template);
              }}
              className="border-border bg-background text-muted-foreground h-9 rounded-lg border px-3 text-sm focus:outline-none"
            >
              <option value="">Load template…</option>
              {templates.map((t) => (
                <option key={t.id} value={t.slug}>
                  {t.title}
                </option>
              ))}
            </select>
          )}
          <Button variant="outline" size="sm" onClick={exportJson} className="gap-1.5">
            <Code2 className="h-3.5 w-3.5" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => fileInputRef.current?.click()}
          >
            <Braces className="h-3.5 w-3.5" />
            Import
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={importJson}
          />
          <Button variant="outline" size="sm" onClick={reset} className="gap-1.5">
            <GitBranch className="h-3.5 w-3.5" />
            Reset
          </Button>
          {mode === "builder" && (
            <Button size="sm" onClick={handleSaveShare} disabled={saving} className="gap-1.5">
              {saving ? (
                <Braces className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Save & Share
            </Button>
          )}
          {mode === "form" && (
            <Button size="sm" onClick={handleCommit} className="gap-1.5">
              Apply to form
            </Button>
          )}
        </div>
      )}

      {shareCode && (
        <div className="border-primary/30 bg-primary/10 text-primary flex flex-wrap items-center gap-2 rounded-lg border px-4 py-2.5 text-sm">
          <span className="font-medium">Share link:</span>
          <code className="break-all">{`${window.location.origin}/playground/share/${shareCode}`}</code>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/playground/share/${shareCode}`,
              );
              toast.success("Link copied!");
            }}
          >
            Copy
          </Button>
        </div>
      )}

      <div className={cn("relative flex gap-3", readonly ? "h-[520px]" : "h-[520px]")}>
        {!readonly && (
          <div className="border-border/60 bg-card hidden w-52 shrink-0 overflow-y-auto rounded-lg border p-2 sm:block">
            <p className="text-muted-foreground px-1 pt-1 pb-2 text-[10px] font-semibold tracking-wide uppercase">
              Node library
            </p>
            {Array.from(palette.entries()).map(([category, items]) => (
              <div key={category} className="mb-3">
                <p className="text-muted-foreground/70 px-1 pb-1 text-[10px] font-medium uppercase">
                  {NODE_CATEGORY_LABELS[category as keyof typeof NODE_CATEGORY_LABELS] ?? category}
                </p>
                <div className="space-y-1">
                  {items.map((nodeType) => (
                    <button
                      key={nodeType.id}
                      type="button"
                      draggable
                      onDragStart={(e) =>
                        e.dataTransfer.setData("application/workflow-node", nodeType.key)
                      }
                      onClick={() => addNode(nodeType)}
                      title={nodeType.description}
                      className="hover:border-primary/40 hover:bg-accent/50 flex w-full items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-left text-xs transition-colors"
                    >
                      <NodeIcon name={nodeType.icon} className="h-3.5 w-3.5" />
                      <span className="truncate font-medium">{nodeType.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {palette.size === 0 && (
              <p className="text-muted-foreground px-2 py-4 text-center text-xs">
                No node types available.
              </p>
            )}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypesMap}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedId(node.id)}
            onPaneClick={() => setSelectedId(null)}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodesDraggable={!readonly}
            nodesConnectable={!readonly}
            elementsSelectable={!readonly}
            fitView
            minZoom={0.2}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
            className="border-border/60 rounded-lg border"
          >
            <Background gap={20} />
            <Controls />
            <MiniMap pannable zoomable />
          </ReactFlow>
        </div>

        {!readonly && (
          <div className="border-border/60 bg-card hidden w-60 shrink-0 overflow-y-auto rounded-lg border p-3 lg:block">
            {selectedNode ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold">Node settings</p>
                <div className="space-y-1.5">
                  <Label>Label</Label>
                  <Input
                    value={selectedNode.data.label}
                    onChange={(e) => updateSelectedLabel(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                {selectedNodeType?.description && (
                  <p className="text-muted-foreground text-xs">{selectedNodeType.description}</p>
                )}
                <div className="space-y-3">
                  {Object.entries(selectedNode.data.config).map(([key, value]) => {
                    const schemaEntry = selectedNodeType?.config_schema?.[key] as
                      { type?: string; label?: string; required?: boolean } | undefined;
                    const label = schemaEntry?.label ?? key.replace(/_/g, " ");
                    const kind = schemaEntry?.type ?? typeof value;
                    return (
                      <div key={key} className="space-y-1.5">
                        <Label className="text-xs">{label}</Label>
                        {kind === "boolean" ? (
                          <Switch
                            checked={Boolean(value)}
                            onCheckedChange={(v) => updateSelectedConfig({ [key]: v })}
                          />
                        ) : kind === "number" ? (
                          <Input
                            type="number"
                            value={String(value ?? "")}
                            onChange={(e) =>
                              updateSelectedConfig({ [key]: Number(e.target.value) || 0 })
                            }
                            className="h-8 text-xs"
                          />
                        ) : typeof value === "object" && value !== null ? (
                          <textarea
                            value={JSON.stringify(value)}
                            onChange={(e) => {
                              try {
                                updateSelectedConfig({ [key]: JSON.parse(e.target.value) });
                              } catch {
                                // Keep last valid value.
                              }
                            }}
                            rows={3}
                            className="border-border bg-background text-foreground w-full resize-none rounded-lg border px-2 py-1 text-xs focus:outline-none"
                          />
                        ) : (
                          <Input
                            value={String(value ?? "")}
                            onChange={(e) => updateSelectedConfig({ [key]: e.target.value })}
                            className="h-8 text-xs"
                          />
                        )}
                      </div>
                    );
                  })}
                  {Object.keys(selectedNode.data.config).length === 0 && (
                    <p className="text-muted-foreground text-xs">No settings for this node.</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-red-500 hover:bg-red-500/10 hover:text-red-400"
                  onClick={() => {
                    setNodes((ns) => ns.filter((n) => n.id !== selectedNode.id));
                    setEdges((es) =>
                      es.filter(
                        (e) => e.source !== selectedNode.id && e.target !== selectedNode.id,
                      ),
                    );
                    setSelectedId(null);
                  }}
                >
                  Delete node
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-semibold">Inspector</p>
                <p className="text-muted-foreground text-xs">
                  Select a node to edit its settings. Drag from the node library or click to add.
                </p>
                {walkthrough.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowWalkthrough((v) => !v)}
                    className="hover:border-primary/40 border-border/60 mt-3 w-full rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors"
                  >
                    {showWalkthrough ? "Hide walkthrough" : "Show walkthrough"} (
                    {walkthrough.length})
                  </button>
                )}
                {showWalkthrough && walkthrough.length > 0 && (
                  <div className="border-border/60 mt-2 space-y-3 rounded-lg border p-3">
                    {walkthrough.map((step, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="bg-primary/10 text-primary flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-xs font-semibold">{step.title}</p>
                          <p className="text-muted-foreground mt-0.5 text-[11px]">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {mode === "builder" && (
        <div className="border-border/60 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Your name (optional)</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Your email (optional)</Label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@company.com"
              className="h-9"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function WorkflowBuilder(props: WorkflowBuilderProps) {
  return (
    <ReactFlowProvider>
      <BuilderInner {...props} />
    </ReactFlowProvider>
  );
}
