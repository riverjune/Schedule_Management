import { useRef, useState } from 'react';
import { Download, File, FileImage, FileText, FolderOpen, Trash2, Upload } from 'lucide-react';
import type { FileMeta, Project } from '../types';
import { mutateProject } from '../data/store';
import { repo } from '../data/repo';
import { cx, fmtSize, fmtStamp, uid } from '../lib/util';

const iconFor = (f: FileMeta) => {
  if (f.type.startsWith('image/')) return FileImage;
  if (f.type.startsWith('text/') || /\.(md|txt|html?|pdf|docx?|hwp|pptx?)$/i.test(f.name)) return FileText;
  return File;
};

export default function Library({ project }: { project: Project }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const addFiles = async (list: FileList | File[]) => {
    setError('');
    const metas: FileMeta[] = [];
    try {
      for (const f of Array.from(list)) {
        const id = uid();
        await repo.putFile(id, f);
        metas.push({ id, name: f.name, size: f.size, type: f.type, addedAt: Date.now() });
      }
    } catch (e) {
      console.error(e);
      setError('파일을 저장하지 못했어요. 브라우저 저장 공간이 부족할 수 있어요.');
    }
    if (metas.length) mutateProject(project.id, (p) => p.files.unshift(...metas));
  };

  const open = async (f: FileMeta, download: boolean) => {
    const blob = await repo.getFile(f.id);
    if (!blob) {
      setError(`'${f.name}' 파일 내용을 찾을 수 없어요. 다른 브라우저에서 올린 파일일 수 있어요.`);
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    if (download) a.download = f.name;
    else a.target = '_blank';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const remove = async (f: FileMeta) => {
    await repo.deleteFile(f.id);
    mutateProject(project.id, (p) => void (p.files = p.files.filter((x) => x.id !== f.id)));
    setConfirmId(null);
  };

  return (
    <section
      className={cx('card', dragging && 'is-dropping')}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('Files')) {
          e.preventDefault();
          setDragging(true);
        }
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
      }}
    >
      <div className="card-head">
        <h2 className="card-title">
          <FolderOpen size={17} /> 자료실
        </h2>
        <span className="card-hint tabular">{project.files.length}개</span>
        <button className="btn btn-primary btn-sm head-right" onClick={() => inputRef.current?.click()}>
          <Upload size={15} /> 자료 올리기
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {error && (
        <p className="error-line" role="alert">
          {error}
        </p>
      )}

      {project.files.length === 0 ? (
        <div className="empty drop-hint">
          <p>발표 자료, 회의 녹취, 참고 논문을 여기로 끌어다 놓으세요. 파일은 이 브라우저 안에만 저장돼요.</p>
        </div>
      ) : (
        <ul className="file-list">
          {project.files.map((f) => {
            const Icon = iconFor(f);
            return (
              <li key={f.id} className="file-row">
                <Icon size={16} className="file-icon" aria-hidden />
                <button className="file-name" onClick={() => open(f, false)} title="새 탭에서 열기">
                  {f.name}
                </button>
                {confirmId === f.id ? (
                  <span className="confirm">
                    지울까요?
                    <button className="btn btn-sm btn-danger-solid" onClick={() => remove(f)}>
                      삭제
                    </button>
                    <button className="btn btn-sm btn-ghost" onClick={() => setConfirmId(null)}>
                      취소
                    </button>
                  </span>
                ) : (
                  <>
                    <span className="file-size tabular">{fmtSize(f.size)}</span>
                    <span className="file-date tabular">{fmtStamp(f.addedAt)}</span>
                    <button className="icon-btn" onClick={() => open(f, true)} aria-label={`${f.name} 내려받기`} title="내려받기">
                      <Download size={15} />
                    </button>
                    <button className="icon-btn" onClick={() => setConfirmId(f.id)} aria-label={`${f.name} 삭제`} title="삭제">
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {dragging && <div className="drop-overlay">놓으면 자료실에 추가돼요</div>}
    </section>
  );
}
