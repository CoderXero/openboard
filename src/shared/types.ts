export type Tool = 'select' | 'pen' | 'highlighter' | 'eraser' | 'rectangle' | 'ellipse' | 'line' | 'arrow' | 'text' | 'sticky' | 'mindmap' | 'frame' | 'hand';
export type Theme = 'light' | 'dark' | 'system';
export type BackgroundType = 'plain' | 'grid' | 'dots' | 'ruled' | 'isometric' | 'transparent';
export type ShapeType = 'rectangle' | 'rounded-rectangle' | 'ellipse' | 'triangle' | 'diamond' | 'hexagon' | 'star' | 'cloud' | 'cylinder' | 'document' | 'decision';

export interface Point { x: number; y: number; pressure?: number; }
export interface Style { fill: string; stroke: string; strokeWidth: number; opacity: number; dash?: number[]; }
export interface Layer { id: string; name: string; visible: boolean; locked: boolean; order: number; }
export interface Background { type: BackgroundType; color: string; gridColor: string; gridSize: number; }
export interface Viewport { x: number; y: number; zoom: number; }

export interface BaseObject {
  id: string; type: WhiteboardObject['type']; layerId: string; x: number; y: number; width: number; height: number;
  rotation: number; style: Style; locked: boolean; visible: boolean; zIndex: number;
}
export interface StrokeObject extends BaseObject { type: 'stroke'; points: Point[]; smoothing: number; }
export interface ShapeObject extends BaseObject { type: 'shape'; shape: ShapeType; }
export interface LineObject extends BaseObject { type: 'line'; points: Point[]; arrowStart: boolean; arrowEnd: boolean; curved?: boolean; }
export interface TextObject extends BaseObject { type: 'text'; text: string; fontFamily: string; fontSize: number; bold: boolean; italic: boolean; align: 'left' | 'center' | 'right'; }
export interface StickyObject extends BaseObject { type: 'sticky'; text: string; color: string; fontSize: number; }
export interface ImageObject extends BaseObject { type: 'image'; src: string; alt: string; assetPath?: string; }
export interface ConnectorObject extends BaseObject { type: 'connector'; fromId: string; toId: string; arrowStart: boolean; arrowEnd: boolean; waypoints: Point[]; }
export interface MindMapNodeObject extends BaseObject { type: 'mindmap-node'; text: string; parentId?: string; collapsed: boolean; }
export interface FrameObject extends BaseObject { type: 'frame'; name: string; preset: '16:9' | '4:3' | 'a4' | 'letter' | 'custom'; }
export type WhiteboardObject = StrokeObject | ShapeObject | LineObject | TextObject | StickyObject | ImageObject | ConnectorObject | MindMapNodeObject | FrameObject;

export interface Board {
  id: string; name: string; background: Background; viewport: Viewport; layers: Layer[]; objects: WhiteboardObject[];
}
export interface ProjectManifest {
  format: 'openboard'; formatVersion: 1; applicationVersion: string; projectId: string; title: string; createdAt: string; updatedAt: string; boards: string[];
}
export interface WhiteboardProject { manifest: ProjectManifest; boards: Board[]; }
export interface WorkspaceInfo { id: string; name: string; createdAt: string; updatedAt: string; }
export interface ProjectFileInfo { id: string; name: string; filePath: string | null; updatedAt: string; }
export interface RecoveryInfo { project: WhiteboardProject; sourcePath: string; recoveredAt: string; }

export interface OpenBoardAPI {
  documents: {
    open(path: string): Promise<WhiteboardProject>;
    save(path: string, project: WhiteboardProject): Promise<void>;
    saveAs(project: WhiteboardProject): Promise<string | null>;
    pickOpen(): Promise<string | null>;
    pickSave(defaultName: string): Promise<string | null>;
    onOpenRequest(handler: (path: string) => void): () => void;
  };
  recovery: { save(project: WhiteboardProject): Promise<void>; list(): Promise<RecoveryInfo[]>; discard(projectId: string): Promise<void>; };
  exports: { png(svg: string, defaultName: string): Promise<string | null>; svg(svg: string, defaultName: string): Promise<string | null>; pdf(svg: string, defaultName: string): Promise<string | null>; };
  system: { getVersion(): Promise<string>; openExternal(url: string): Promise<void>; };
}

export const DEFAULT_STYLE: Style = { fill: '#ffffff', stroke: '#1f2937', strokeWidth: 2, opacity: 1 };
