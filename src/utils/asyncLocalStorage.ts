import { AsyncLocalStorage } from 'async_hooks';

export interface SessionData {
  usuarioId?: number;
}

export const sessionContext = new AsyncLocalStorage<SessionData>();
