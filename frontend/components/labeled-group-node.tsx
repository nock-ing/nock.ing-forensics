import { Node, NodeProps } from "@xyflow/react";
import { BaseNode } from "@/components/base-node";

type LabeledGroupNode = Node<{
  label: string;
}>;

export function LabeledGroupNode({ data, selected }: NodeProps<LabeledGroupNode>) {
  return (
    <BaseNode
      selected={selected}
      className="bg-background/30 h-full rounded-lg overflow-hidden p-0 border border-border/50 backdrop-blur-sm" 
    >
      {data.label && (
        <div className="bg-muted/80 w-fit p-2 text-xs rounded-br-lg text-muted-foreground backdrop-blur-sm" >
          {data.label}
        </div>
      )}
    </BaseNode>
  );
}

LabeledGroupNode.displayName = "LabeledGroupNode";
