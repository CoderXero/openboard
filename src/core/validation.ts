import { z } from 'zod';

const pointSchema = z.object({ x: z.number().finite(), y: z.number().finite(), pressure: z.number().min(0).max(1).optional() });
const styleSchema = z.object({ fill: z.string(), stroke: z.string(), strokeWidth: z.number().nonnegative(), opacity: z.number().min(0).max(1), dash: z.array(z.number()).optional() });
const baseSchema = z.object({ id: z.string().min(1), layerId: z.string().min(1), x: z.number().finite(), y: z.number().finite(), width: z.number().finite(), height: z.number().finite(), rotation: z.number().finite(), style: styleSchema, locked: z.boolean(), visible: z.boolean(), zIndex: z.number().finite() });
const objectSchema = z.discriminatedUnion('type', [
  baseSchema.extend({ type: z.literal('stroke'), points: z.array(pointSchema), smoothing: z.number().min(0).max(1) }),
  baseSchema.extend({ type: z.literal('shape'), shape: z.enum(['rectangle', 'rounded-rectangle', 'ellipse', 'triangle', 'diamond', 'hexagon', 'star', 'cloud', 'cylinder', 'document', 'decision']) }),
  baseSchema.extend({ type: z.literal('line'), points: z.array(pointSchema), arrowStart: z.boolean(), arrowEnd: z.boolean(), curved: z.boolean().optional() }),
  baseSchema.extend({ type: z.literal('text'), text: z.string(), fontFamily: z.string(), fontSize: z.number().positive(), bold: z.boolean(), italic: z.boolean(), align: z.enum(['left', 'center', 'right']) }),
  baseSchema.extend({ type: z.literal('sticky'), text: z.string(), color: z.string(), fontSize: z.number().positive() }),
  baseSchema.extend({ type: z.literal('image'), src: z.string(), alt: z.string(), assetPath: z.string().optional() }),
  baseSchema.extend({ type: z.literal('connector'), fromId: z.string(), toId: z.string(), arrowStart: z.boolean(), arrowEnd: z.boolean(), waypoints: z.array(pointSchema) }),
  baseSchema.extend({ type: z.literal('mindmap-node'), text: z.string(), parentId: z.string().optional(), collapsed: z.boolean() }),
  baseSchema.extend({ type: z.literal('frame'), name: z.string(), preset: z.enum(['16:9', '4:3', 'a4', 'letter', 'custom']) })
]);
const layerSchema = z.object({ id: z.string(), name: z.string(), visible: z.boolean(), locked: z.boolean(), order: z.number().int() });
const boardSchema = z.object({ id: z.string(), name: z.string(), background: z.object({ type: z.enum(['plain', 'grid', 'dots', 'ruled', 'isometric', 'transparent']), color: z.string(), gridColor: z.string(), gridSize: z.number().positive() }), viewport: z.object({ x: z.number().finite(), y: z.number().finite(), zoom: z.number().min(0.05).max(32) }), layers: z.array(layerSchema), objects: z.array(objectSchema) });
export const projectSchema = z.object({ manifest: z.object({ format: z.literal('openboard'), formatVersion: z.literal(1), applicationVersion: z.string(), projectId: z.string(), title: z.string(), createdAt: z.string(), updatedAt: z.string(), boards: z.array(z.string()) }), boards: z.array(boardSchema).min(1) });
export type ValidatedProject = z.infer<typeof projectSchema>;

export function validateProject(input: unknown): ValidatedProject {
  const result = projectSchema.safeParse(input);
  if (!result.success) throw new Error(`Invalid OpenBoard project: ${result.error.issues.slice(0, 3).map((issue) => issue.path.join('.') + ' ' + issue.message).join('; ')}`);
  return result.data;
}
