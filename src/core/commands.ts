import { cloneProject, updateManifest } from './document';
import type { WhiteboardProject } from '../shared/types';

export interface Command { readonly label: string; execute(project: WhiteboardProject): void; undo(project: WhiteboardProject): void; redo(project: WhiteboardProject): void; }

export class SnapshotCommand implements Command {
  readonly label: string;
  private before: WhiteboardProject | null = null;
  private after: WhiteboardProject | null = null;
  constructor(label: string, private readonly operation: (project: WhiteboardProject) => void) { this.label = label; }
  execute(project: WhiteboardProject): void { this.before ??= cloneProject(project); this.operation(project); updateManifest(project); this.after = cloneProject(project); }
  undo(project: WhiteboardProject): void { if (!this.before) throw new Error('Cannot undo a command that has not executed'); Object.assign(project, cloneProject(this.before)); }
  redo(project: WhiteboardProject): void { if (!this.after) throw new Error('Cannot redo a command that has not executed'); Object.assign(project, cloneProject(this.after)); }
}

export class SnapshotStateCommand implements Command {
  constructor(readonly label: string, private readonly before: WhiteboardProject, private readonly after: WhiteboardProject) {}
  execute(project: WhiteboardProject): void { Object.assign(project, cloneProject(this.after)); }
  undo(project: WhiteboardProject): void { Object.assign(project, cloneProject(this.before)); }
  redo(project: WhiteboardProject): void { Object.assign(project, cloneProject(this.after)); }
}

export class HistoryManager {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  constructor(private readonly capacity = 100) {}
  execute(project: WhiteboardProject, command: SnapshotCommand): void { command.execute(project); this.undoStack.push(command); if (this.undoStack.length > this.capacity) this.undoStack.shift(); this.redoStack = []; }
  record(project: WhiteboardProject, command: SnapshotStateCommand): void { command.execute(project); this.undoStack.push(command); if (this.undoStack.length > this.capacity) this.undoStack.shift(); this.redoStack = []; }
  undo(project: WhiteboardProject): boolean { const command = this.undoStack.pop(); if (!command) return false; command.undo(project); this.redoStack.push(command); return true; }
  redo(project: WhiteboardProject): boolean { const command = this.redoStack.pop(); if (!command) return false; command.redo(project); this.undoStack.push(command); return true; }
  canUndo(): boolean { return this.undoStack.length > 0; }
  canRedo(): boolean { return this.redoStack.length > 0; }
  clear(): void { this.undoStack = []; this.redoStack = []; }
}
