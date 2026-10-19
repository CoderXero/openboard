import { newId } from './document';
import type { MindMapNodeObject, Style } from '../shared/types';

export function layoutMindMap(nodes: MindMapNodeObject[], direction: 'right' | 'radial' = 'right'): MindMapNodeObject[] {
  const children = new Map<string | undefined, MindMapNodeObject[]>();
  for (const node of nodes) children.set(node.parentId, [...(children.get(node.parentId) ?? []), node]);
  const roots = children.get(undefined) ?? [];
  const result: MindMapNodeObject[] = [];
  const visit = (node: MindMapNodeObject, depth: number, index: number, siblingCount: number): void => {
    const next = { ...node };
    if (direction === 'right') { next.x = depth * 260; next.y = index * 110 - ((siblingCount - 1) * 55); }
    else { const angle = (index / Math.max(1, siblingCount)) * Math.PI * 2; const radius = depth * 260; next.x = Math.cos(angle) * radius; next.y = Math.sin(angle) * radius; }
    result.push(next);
    const childNodes = children.get(node.id) ?? [];
    childNodes.forEach((child, childIndex) => visit(child, depth + 1, childIndex, childNodes.length));
  };
  roots.forEach((root, index) => visit(root, 0, index, roots.length));
  return result;
}

export function createMindMapNode(text: string, x: number, y: number, style: Style, parentId?: string): MindMapNodeObject {
  return { id: newId('mindmap'), type: 'mindmap-node', layerId: 'layer-drawings', x, y, width: 180, height: 60, rotation: 0, style, locked: false, visible: true, zIndex: Date.now(), text, parentId, collapsed: false };
}
