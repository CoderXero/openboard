import { describe, expect, it } from 'vitest';
import { createProject, getBoard, makeShape } from '../src/core/document';
import { HistoryManager, SnapshotCommand } from '../src/core/commands';
import { deserializeProject, serializeProject } from '../src/core/serialization';
import { createMindMapNode, layoutMindMap } from '../src/core/mindmap';
import { validateProject } from '../src/core/validation';

describe('OpenBoard document model', () => {
  it('creates a portable project with a board and default layers', () => {
    const project = createProject('Architecture');
    expect(project.manifest.format).toBe('openboard');
    expect(project.boards).toHaveLength(1);
    expect(project.boards[0].layers.map((layer) => layer.name)).toEqual(['Background', 'Images', 'Drawings', 'Annotations']);
  });

  it('round-trips an editable project through the .openboard archive format', async () => {
    const project = createProject('Round trip');
    const board = getBoard(project, project.boards[0].id);
    board.objects.push(makeShape('rounded-rectangle', -40, 12, 240, 90, { fill: '#fff', stroke: '#000', strokeWidth: 2, opacity: 1 }));
    const bytes = await serializeProject(project);
    const reopened = await deserializeProject(bytes);
    expect(reopened.manifest.title).toBe('Round trip');
    expect(reopened.boards[0].objects[0].type).toBe('shape');
    expect(reopened.boards[0].objects[0].x).toBe(-40);
  });

  it('embeds imported image data inside the project archive', async () => {
    const project = createProject('Assets');
    getBoard(project, project.boards[0].id).objects.push({ id: 'image-1', type: 'image', layerId: 'layer-images', x: 0, y: 0, width: 10, height: 10, rotation: 0, style: { fill: 'none', stroke: '#000', strokeWidth: 0, opacity: 1 }, locked: false, visible: true, zIndex: 1, src: 'data:image/png;base64,aGVsbG8=', alt: 'test' });
    const reopened = await deserializeProject(await serializeProject(project));
    expect(reopened.boards[0].objects[0].type).toBe('image');
    expect((reopened.boards[0].objects[0] as { src: string }).src).toBe('data:image/png;base64,aGVsbG8=');
    expect((reopened.boards[0].objects[0] as { assetPath?: string }).assetPath).toBe('assets/image-1.png');
  });

  it('rejects unknown object types instead of silently accepting them', () => {
    const project = createProject();
    const invalid = structuredClone(project) as unknown as Record<string, unknown>;
    const boards = invalid.boards as Array<Record<string, unknown>>;
    (boards[0].objects as Array<Record<string, unknown>>).push({ type: 'script' });
    expect(() => validateProject(invalid)).toThrow(/Invalid OpenBoard project/);
  });
});

describe('command history', () => {
  it('undoes and redoes a document mutation', () => {
    const project = createProject();
    const history = new HistoryManager();
    history.execute(project, new SnapshotCommand('Add object', (next) => { getBoard(next, next.boards[0].id).objects.push(makeShape('rectangle', 0, 0, 100, 80, { fill: '#fff', stroke: '#111', strokeWidth: 2, opacity: 1 })); }));
    expect(project.boards[0].objects).toHaveLength(1);
    expect(history.undo(project)).toBe(true);
    expect(project.boards[0].objects).toHaveLength(0);
    expect(history.redo(project)).toBe(true);
    expect(project.boards[0].objects).toHaveLength(1);
  });
});

describe('mind maps', () => {
  it('keeps child nodes below their parent in a deterministic tree layout', () => {
    const style = { fill: '#fff', stroke: '#111', strokeWidth: 2, opacity: 1 };
    const root = createMindMapNode('Root', 0, 0, style);
    const child = createMindMapNode('Child', 0, 0, style, root.id);
    const [laidRoot, laidChild] = layoutMindMap([root, child]);
    expect(laidRoot.x).toBe(0);
    expect(laidChild.x).toBe(260);
  });
});
