# 팀플 보드

팀 프로젝트(팀플) 하나를 한 화면에서 관리하는 개인용 웹앱.

- **D-day 카드**: 고정한 일정까지 남은 날짜
- **타임라인**: 교수님 미팅·발표·마감을 가로로 나열, 누르면 그날 회의록으로 이동
- **다음 스텝**: 분류별 할 일, 담당자 점(눌러서 사람별 완료 체크), 마감 임박/지남 표시
- **팀원별 보기**: 이름을 누르면 그 사람의 체크리스트
- **회의록**: 일정마다 섹션(개요·피드백·과제…)을 마크다운으로 기록, 체크박스 바로 체크
- **자료실**: 파일 끌어다 놓기, 열기·내려받기·삭제
- **여러 프로젝트**, JSON 백업 내보내기/가져오기

## 실행

```bash
npm install
npm run dev
```

http://localhost:5173 에서 열린다. 처음 열면 예시 프로젝트가 들어 있으니 내용을 바꾸거나 `새 프로젝트`로 시작하면 된다.

## 데이터 저장

지금은 **브라우저 IndexedDB**에만 저장된다(서버 없음).

- 같은 브라우저·같은 주소에서만 보인다. 브라우저 데이터를 지우면 사라진다.
- 사이드바 `백업 내보내기`로 JSON을 받아 두자. 자료실 파일은 백업 JSON에 포함되지 않는다.

## 나중에 배포해서 팀원과 같이 쓰려면

저장 로직은 [`src/data/repo.ts`](src/data/repo.ts)의 `Repo` 인터페이스 하나로 모여 있다.

1. Supabase(또는 Firebase) 프로젝트 생성 → 테이블/스토리지 준비
2. `Repo`를 구현한 `supabaseRepo` 작성 (`load`/`save`/`putFile`/`getFile`/`deleteFile`)
3. `export const repo = supabaseRepo;` 로 교체
4. 로그인·실시간 동기화 추가 후 Vercel/Netlify에 배포

## 기술

Vite · React 19 · TypeScript · Pretendard · lucide-react · marked + DOMPurify · idb-keyval
