import type { AppState, Project } from '../types';
import { MEMBER_COLORS, toISODate, uid } from '../lib/util';

const offset = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toISODate(d);
};

export const emptyProject = (name = '새 프로젝트'): Project => ({
  id: uid(),
  name,
  subtitle: '',
  meetingUrl: '',
  members: [],
  categories: [{ id: uid(), name: '할 일' }],
  milestones: [],
  tasks: [],
  files: [],
  createdAt: Date.now(),
});

/** 처음 실행했을 때 화면 구성을 보여주는 예시 프로젝트. 날짜는 오늘 기준. */
export const demoProject = (): Project => {
  const m = ['민수', '서연', '지훈', '하은'].map((name, i) => ({ id: uid(), name, color: MEMBER_COLORS[i] }));
  const cResearch = { id: uid(), name: '리서치' };
  const cBuild = { id: uid(), name: '분석' };
  const cDeck = { id: uid(), name: '발표' };
  const now = Date.now();
  const task = (categoryId: string, title: string, due: number | null, who: number[], done: number[] = [], optional = false) => ({
    id: uid(),
    categoryId,
    title,
    due: due === null ? null : offset(due),
    assigneeIds: who.map((i) => m[i].id),
    doneBy: done.map((i) => m[i].id),
    optional,
    createdAt: now,
  });

  return {
    id: uid(),
    name: '졸업 프로젝트',
    subtitle: '캡스톤 디자인 · 4인 팀',
    meetingUrl: 'https://zoom.us/',
    members: m,
    categories: [cResearch, cBuild, cDeck],
    milestones: [
      { id: uid(), date: offset(-35), title: '주제 확정 미팅', kind: 'meeting', pinned: false, notes: [] },
      { id: uid(), date: offset(-21), title: '2차 교수님 미팅', kind: 'meeting', pinned: false, notes: [] },
      { id: uid(), date: offset(-14), title: '중간발표', kind: 'presentation', pinned: false, notes: [] },
      {
        id: uid(),
        date: offset(0),
        title: '3차 교수님 미팅',
        kind: 'meeting',
        pinned: true,
        notes: [
          {
            id: uid(),
            title: '회의 개요',
            body: '중간발표 피드백을 반영한 분석 방향을 점검했다.\n\n| 항목 | 내용 |\n|---|---|\n| 참석 | 민수, 서연, 지훈, 하은 |\n| 방식 | Zoom, 50분 |',
          },
          {
            id: uid(),
            title: '피드백',
            body: '- 데이터 수집 범위를 최근 3년으로 좁힐 것\n- 비교군을 하나 더 두면 결론이 단단해짐\n- 발표 자료는 결론부터 보여주기',
          },
          {
            id: uid(),
            title: '팀원 과제',
            body: '- [ ] 수집 범위 조정 후 데이터 다시 정리 (지훈)\n- [ ] 비교군 후보 3개 조사 (서연)\n- [x] 회의 녹취 정리 (하은)',
          },
        ],
      },
      { id: uid(), date: offset(14), title: '4차 교수님 미팅', kind: 'meeting', pinned: true, notes: [] },
      { id: uid(), date: offset(30), title: '최종 자료 제출', kind: 'deadline', pinned: true, notes: [] },
      { id: uid(), date: offset(33), title: '최종 발표', kind: 'presentation', pinned: true, notes: [] },
    ],
    tasks: [
      task(cResearch.id, '비교군 후보 3개 조사', 6, [1]),
      task(cResearch.id, '선행 연구 5편 요약', 6, [0, 3], [3]),
      task(cBuild.id, '수집 범위 최근 3년으로 조정', 10, [2]),
      task(cBuild.id, '지표별 상관관계 분석', 14, [0, 2]),
      task(cBuild.id, '분석 방법 팀 내부 확정', 4, [0, 1, 2, 3], [1]),
      task(cBuild.id, '추가 데이터셋으로 재검증', 20, [2], [], true),
      task(cDeck.id, '발표 스토리라인 초안', 24, [3]),
      task(cDeck.id, '결론 슬라이드 시안', 27, [1, 3]),
    ],
    files: [],
    createdAt: now,
  };
};

export const initialState = (): AppState => {
  const p = demoProject();
  return { version: 1, projects: [p], activeProjectId: p.id };
};
