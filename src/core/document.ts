import type { Background, Board, Layer, ProjectManifest, ShapeObject, Style, WhiteboardObject, WhiteboardProject } from '../shared/types';

export const APP_VERSION = '0.1.0';
export const DEFAULT_LAYER_ID = 'layer-drawings';

export function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function now(): string { return new Date().toISOString(); }

export function defaultBackground(): Background {
  return { type: 'grid', color: '#f8fafc', gridColor: '#dbe4ef', gridSize: 24 };
}

export function createBoard(name = 'Board 1'): Board {
  const background = defaultBackground();
  const layers: Layer[] = [
    { id: 'layer-background', name: 'Background', visible: true, locked: false, order: 0 },
    { id: 'layer-images', name: 'Images', visible: true, locked: false, order: 1 },
    { id: DEFAULT_LAYER_ID, name: 'Drawings', visible: true, locked: false, order: 2 },
    { id: 'layer-annotations', name: 'Annotations', visible: true, locked: false, order: 3 }
  ];
  return { id: newId('board'), name, background, viewport: { x: 0, y: 0, zoom: 1 }, layers, objects: [] };
}

export function createProject(title = 'Untitled board'): WhiteboardProject {
  const createdAt = now();
  const board = createBoard();
  const manifest: ProjectManifest = { format: 'openboard', formatVersion: 1, applicationVersion: APP_VERSION, projectId: newId('project'), title, createdAt, updatedAt: createdAt, boards: [board.id] };
  return { manifest, boards: [board] };
}

export function cloneProject(project: WhiteboardProject): WhiteboardProject {
  return structuredClone(project);
}

export function objectBounds(object: WhiteboardObject): { x: number; y: number; width: number; height: number } {
  return { x: object.x, y: object.y, width: Math.max(1, object.width), height: Math.max(1, object.height) };
}

export function makeShape(shape: ShapeObject['shape'], x: number, y: number, width: number, height: number, style: Style, layerId = DEFAULT_LAYER_ID): ShapeObject {
  return { id: newId('object'), type: 'shape', shape, layerId, x, y, width, height, rotation: 0, style, locked: false, visible: true, zIndex: Date.now() };
}

export function updateManifest(project: WhiteboardProject): WhiteboardProject {
  project.manifest.updatedAt = now();
  project.manifest.boards = project.boards.map((board) => board.id);
  return project;
}

export function getBoard(project: WhiteboardProject, boardId: string): Board {
  const board = project.boards.find((candidate) => candidate.id === boardId);
  if (!board) throw new Error(`Board not found: ${boardId}`);
  return board;
}

export function layerAllowsEditing(board: Board, object: WhiteboardObject): boolean {
  const layer = board.layers.find((candidate) => candidate.id === object.layerId);
  return Boolean(layer?.visible && !layer.locked && !object.locked);
}
