import { AsyncLocalStorage } from 'async_hooks';

export interface SessionData {
  usuarioId?: number;
  matricula?: string;
  origen?: string;
}

export const sessionContext = new AsyncLocalStorage<SessionData>();
