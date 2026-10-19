import { app, BrowserWindow, dialog, ipcMain, nativeImage, shell, session } from 'electron';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { PDFDocument } from 'pdf-lib';
import { deserializeProject, serializeProject } from '../core/serialization';
import { validateProject } from '../core/validation';
import type { RecoveryInfo, WhiteboardProject } from '../shared/types';

const __dirname = path.dirname(__filename);
const isDev = process.argv.includes('--dev');
let mainWindow: BrowserWindow | null = null;
if (process.argv.includes('--disable-gpu')) app.disableHardwareAcceleration();
const cliProjectPath = process.argv.find((argument) => argument.toLowerCase().endsWith('.openboard') && !argument.startsWith('-'));

function isSafeProjectPath(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length < 4096 && !value.includes('\0');
}

function recoveryDirectory(): string { return path.join(app.getPath('userData'), 'recovery'); }
async function ensureRecoveryDirectory(): Promise<void> { await fs.mkdir(recoveryDirectory(), { recursive: true }); }

async function atomicWrite(filePath: string, data: Uint8Array | string): Promise<void> {
  const directory = path.dirname(filePath);
  await fs.mkdir(directory, { recursive: true });
  const temporary = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  await fs.writeFile(temporary, data);
  await fs.rename(temporary, filePath);
}

function ensureProject(value: unknown): WhiteboardProject {
  return validateProject(value) as WhiteboardProject;
}

async function saveProject(filePath: string, project: WhiteboardProject): Promise<void> {
  if (!isSafeProjectPath(filePath)) throw new Error('Invalid project path.');
  const bytes = await serializeProject(ensureProject(project));
  await atomicWrite(filePath, bytes);
}

function parseSvgSize(svg: string): { width: number; height: number } {
  const width = Number(svg.match(/width=["']([\d.]+)/)?.[1] ?? 1600);
  const height = Number(svg.match(/height=["']([\d.]+)/)?.[1] ?? 900);
  return { width: Math.max(1, Math.min(width, 10000)), height: Math.max(1, Math.min(height, 10000)) };
}

function svgDataUrl(svg: string): string { return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`; }

function registerIpc(): void {
  ipcMain.handle('documents:open', async (_event, filePath: unknown) => {
    if (!isSafeProjectPath(filePath)) throw new Error('Invalid project path.');
    return deserializeProject(new Uint8Array(await fs.readFile(filePath)));
  });
  ipcMain.handle('documents:save', async (_event, filePath: unknown, project: unknown) => {
    if (!isSafeProjectPath(filePath)) throw new Error('Invalid project path.');
    await saveProject(filePath, ensureProject(project));
  });
  ipcMain.handle('documents:pickOpen', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'OpenBoard projects', extensions: ['openboard'] }, { name: 'All files', extensions: ['*'] }] });
    return result.canceled ? null : result.filePaths[0] ?? null;
  });
  ipcMain.handle('documents:pickSave', async (_event, defaultName: unknown) => {
    const name = typeof defaultName === 'string' && defaultName.length > 0 ? defaultName : 'untitled.openboard';
    const result = await dialog.showSaveDialog({ defaultPath: name.endsWith('.openboard') ? name : `${name}.openboard`, filters: [{ name: 'OpenBoard projects', extensions: ['openboard'] }] });
    return result.canceled ? null : result.filePath ?? null;
  });
  ipcMain.handle('documents:saveAs', async (_event, project: unknown) => {
    const result = await dialog.showSaveDialog({ defaultPath: `${ensureProject(project).manifest.title.replace(/[^\w\s-]/g, '').trim() || 'untitled'}.openboard`, filters: [{ name: 'OpenBoard projects', extensions: ['openboard'] }] });
    if (result.canceled || !result.filePath) return null;
    await saveProject(result.filePath, ensureProject(project));
    return result.filePath;
  });
  ipcMain.handle('recovery:save', async (_event, project: unknown) => {
    const safeProject = ensureProject(project);
    await ensureRecoveryDirectory();
    await atomicWrite(path.join(recoveryDirectory(), `${safeProject.manifest.projectId}.json`), JSON.stringify({ project: safeProject, sourcePath: '', recoveredAt: new Date().toISOString() } satisfies RecoveryInfo));
  });
  ipcMain.handle('recovery:list', async () => {
    await ensureRecoveryDirectory();
    const entries = await fs.readdir(recoveryDirectory(), { withFileTypes: true });
    const recovered: RecoveryInfo[] = [];
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
      try { recovered.push(JSON.parse(await fs.readFile(path.join(recoveryDirectory(), entry.name), 'utf8')) as RecoveryInfo); } catch { /* corrupt recovery is ignored */ }
    }
    return recovered;
  });
  ipcMain.handle('recovery:discard', async (_event, projectId: unknown) => {
    if (typeof projectId !== 'string' || !/^[\w-]+$/.test(projectId)) throw new Error('Invalid recovery id.');
    await fs.rm(path.join(recoveryDirectory(), `${projectId}.json`), { force: true });
  });
  ipcMain.handle('exports:svg', async (_event, svg: unknown, defaultName: unknown) => {
    if (typeof svg !== 'string' || svg.length > 50_000_000) throw new Error('Invalid SVG export.');
    const result = await dialog.showSaveDialog({ defaultPath: `${typeof defaultName === 'string' ? defaultName : 'openboard'}.svg`, filters: [{ name: 'SVG image', extensions: ['svg'] }] });
    if (result.canceled || !result.filePath) return null;
    await atomicWrite(result.filePath, svg);
    return result.filePath;
  });
  ipcMain.handle('exports:png', async (_event, svg: unknown, defaultName: unknown) => {
    if (typeof svg !== 'string' || svg.length > 50_000_000) throw new Error('Invalid SVG export.');
    const result = await dialog.showSaveDialog({ defaultPath: `${typeof defaultName === 'string' ? defaultName : 'openboard'}.png`, filters: [{ name: 'PNG image', extensions: ['png'] }] });
    if (result.canceled || !result.filePath) return null;
    await atomicWrite(result.filePath, nativeImage.createFromDataURL(svgDataUrl(svg)).toPNG());
    return result.filePath;
  });
  ipcMain.handle('exports:pdf', async (_event, svg: unknown, defaultName: unknown) => {
    if (typeof svg !== 'string' || svg.length > 50_000_000) throw new Error('Invalid SVG export.');
    const result = await dialog.showSaveDialog({ defaultPath: `${typeof defaultName === 'string' ? defaultName : 'openboard'}.pdf`, filters: [{ name: 'PDF document', extensions: ['pdf'] }] });
    if (result.canceled || !result.filePath) return null;
    const image = nativeImage.createFromDataURL(svgDataUrl(svg)).toPNG();
    const size = parseSvgSize(svg);
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([size.width, size.height]);
    page.drawImage(await pdf.embedPng(image), { x: 0, y: 0, width: size.width, height: size.height });
    await atomicWrite(result.filePath, await pdf.save());
    return result.filePath;
  });
  ipcMain.handle('system:version', () => app.getVersion());
  ipcMain.handle('system:openExternal', async (_event, value: unknown) => {
    if (typeof value !== 'string') throw new Error('Invalid URL.');
    const url = new URL(value);
    if (url.protocol !== 'https:') throw new Error('Only HTTPS links can be opened.');
    await shell.openExternal(url.toString());
  });
}

function createWindow(): void {
  mainWindow = new BrowserWindow({ width: 1440, height: 900, minWidth: 1000, minHeight: 650, backgroundColor: '#0f172a', webPreferences: { preload: path.join(app.getAppPath(), 'dist-electron/preload/index.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true } });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => { if (url.startsWith('https://')) void shell.openExternal(url); return { action: 'deny' }; });
  mainWindow.webContents.on('will-navigate', (event, url) => { if (!url.startsWith('http://127.0.0.1:5173') && !url.startsWith('file://')) event.preventDefault(); });
  mainWindow.webContents.once('did-finish-load', () => { if (cliProjectPath) mainWindow?.webContents.send('documents:open-request', cliProjectPath); });
  if (isDev) void mainWindow.loadURL('http://127.0.0.1:5173'); else void mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
  if (process.argv.includes('--help')) { console.log('OpenBoard - offline Linux whiteboard\n\nUsage: openboard [project.openboard]\n\nOptions:\n  --help          Show this help\n  --version       Print the application version\n  --new           Start a blank project\n  --safe-mode     Start with conservative renderer settings\n  --disable-gpu   Disable hardware acceleration'); app.quit(); return; }
  if (process.argv.includes('--version')) { console.log(app.getVersion()); app.quit(); return; }
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  registerIpc();
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
