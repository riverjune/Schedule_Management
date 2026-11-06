import { useSyncExternalStore } from 'react';
import type { AppState, Project } from '../types';
import { repo } from './repo';
import { initialState } from './seed';

type Listener = () => void;

let state: AppState | null = null;
const listeners = new Set<Listener>();
let saveTimer: number | undefined;
let saveStatus: 'idle' | 'saving' | 'saved' | 'error' = 'idle';

const emit = () => listeners.forEach((l) => l());

const scheduleSave = () => {
  window.clearTimeout(saveTimer);
  saveStatus = 'saving';
  saveTimer = window.setTimeout(async () => {
    if (!state) return;
    try {
      await repo.save(state);
      saveStatus = 'saved';
    } catch (e) {
      console.error(e);
      saveStatus = 'error';
    }
    emit();
  }, 300);
};

export const loadState = async () => {
  try {
    // 저장소가 막혀 있거나(시크릿 모드 등) 응답이 없으면 3초 뒤 포기하고 메모리로 시작
    const loaded = await Promise.race([
      repo.load(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('저장소 응답 없음')), 3000)),
    ]);
    state = loaded ?? initialState();
    if (!loaded) repo.save(state).catch(console.error);
  } catch (e) {
    console.error(e);
    state = initialState();
    saveStatus = 'error';
  }
  emit();
};

/** 상태 변경: 초안(복사본)을 직접 수정하는 함수를 넘긴다. */
export const mutate = (fn: (draft: AppState) => void) => {
  if (!state) return;
  const draft = structuredClone(state);
  fn(draft);
  state = draft;
  emit();
  scheduleSave();
};

export const mutateProject = (projectId: string, fn: (p: Project) => void) =>
  mutate((s) => {
    const p = s.projects.find((x) => x.id === projectId);
    if (p) fn(p);
  });

export const replaceState = (next: AppState) => {
  state = next;
  emit();
  scheduleSave();
};

const subscribe = (l: Listener) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useAppState = () => useSyncExternalStore(subscribe, () => state);
export const useSaveStatus = () => useSyncExternalStore(subscribe, () => saveStatus);
export const getState = () => state;
