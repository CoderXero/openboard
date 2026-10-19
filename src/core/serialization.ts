import JSZip from 'jszip';
import { validateProject } from './validation';
import type { WhiteboardProject } from '../shared/types';

const MAX_COMPRESSED_BYTES = 500 * 1024 * 1024;
const MAX_PROJECT_JSON_BYTES = 2 * 1024 * 1024 * 1024;

export async function serializeProject(project: WhiteboardProject): Promise<Uint8Array> {
  validateProject(project);
  const portable = structuredClone(project);
  const zip = new JSZip();
  for (const board of portable.boards) {
    for (const object of board.objects) {
      if (object.type !== 'image' || !object.src.startsWith('data:')) continue;
      const match = object.src.match(/^data:([^;,]+);base64,(.+)$/);
      if (!match) continue;
      const mime = match[1];
      const extension = mime.split('/')[1]?.replace('svg+xml', 'svg') ?? 'bin';
      const assetPath = `assets/${object.id}.${extension}`;
      zip.file(assetPath, match[2], { base64: true });
      object.assetPath = assetPath;
      object.src = `asset://${assetPath}`;
    }
  }
  zip.file('manifest.json', JSON.stringify(portable.manifest, null, 2));
  zip.file('document.json', JSON.stringify(portable, null, 2));
  for (const board of portable.boards) zip.file(`boards/${board.id}.json`, JSON.stringify(board, null, 2));
  return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE', compressionOptions: { level: 6 } });
}

export async function deserializeProject(bytes: Uint8Array): Promise<WhiteboardProject> {
  if (bytes.byteLength > MAX_COMPRESSED_BYTES) throw new Error('Project archive exceeds the 500 MB safety limit.');
  const zip = await JSZip.loadAsync(bytes, { createFolders: false, checkCRC32: true });
  const entry = zip.file('document.json');
  if (!entry) throw new Error('This file is not a valid OpenBoard project (document.json is missing).');
  const json = await entry.async('string');
  if (json.length > MAX_PROJECT_JSON_BYTES) throw new Error('Project data exceeds the safety limit.');
  const project = validateProject(JSON.parse(json)) as WhiteboardProject;
  for (const board of project.boards) {
    for (const object of board.objects) {
      if (object.type !== 'image' || !object.assetPath?.startsWith('assets/') || object.assetPath.includes('..') || object.assetPath.includes('\\')) continue;
      const asset = zip.file(object.assetPath);
      if (!asset) { object.src = ''; continue; }
      const bytes = await asset.async('base64');
      const extension = object.assetPath.split('.').pop() ?? 'png';
      const mime = extension === 'svg' ? 'image/svg+xml' : `image/${extension === 'jpg' ? 'jpeg' : extension}`;
      object.src = `data:${mime};base64,${bytes}`;
    }
  }
  return project;
}
