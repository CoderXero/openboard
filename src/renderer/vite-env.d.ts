import type { OpenBoardAPI } from '../shared/types';

declare global {
  interface Window { openboard: OpenBoardAPI; }
}

export {};
