import { get, set, del, createStore } from 'idb-keyval';
import type { AppState } from '../types';

/**
 * 저장소 계층. 지금은 브라우저 IndexedDB(LocalRepo)를 쓰고,
 * 나중에 배포할 때 같은 인터페이스로 Supabase/Firebase 구현을 만들어 교체하면 된다.
 */
export interface Repo {
  load(): Promise<AppState | null>;
  save(state: AppState): Promise<void>;
  putFile(id: string, blob: Blob): Promise<void>;
  getFile(id: string): Promise<Blob | undefined>;
  deleteFile(id: string): Promise<void>;
}

const stateStore = createStore('teamplay-board', 'state');
const fileStore = createStore('teamplay-board-files', 'files');

export const localRepo: Repo = {
  load: async () => (await get<AppState>('app', stateStore)) ?? null,
  save: (state) => set('app', state, stateStore),
  putFile: (id, blob) => set(id, blob, fileStore),
  getFile: (id) => get<Blob>(id, fileStore),
  deleteFile: (id) => del(id, fileStore),
};

export const repo: Repo = localRepo;
