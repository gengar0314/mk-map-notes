import React, { useEffect, useState } from 'react';
import { Course } from './lib/types';
import { listCourses, upsertCourse, deleteCourse } from './lib/storage';
import MapEditor from './components/MapEditor';
import { exportJson, importJson, downloadText } from './lib/backup';

function uuid() { return crypto.randomUUID(); }

export default function App() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selected, setSelected] = useState<Course | null>(null);

  useEffect(() => { listCourses().then(setCourses); }, []);

  const onCreate = async () => {
    const name = prompt('コース名を入力')?.trim();
    if (!name) return;
    // 画像ファイル → DataURL
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*'; input.onchange = async () => {
      const file = input.files?.[0]; if (!file) return;
      const dataUrl = await fileToDataURL(file);
      const now = new Date().toISOString();
      const course: Course = { id: uuid(), name, imageDataUrl: dataUrl, createdAt: now, updatedAt: now };
      await upsertCourse(course);
      const list = await listCourses(); setCourses(list); setSelected(course);
    };
    input.click();
  };

  const onDelete = async (id: string) => {
    if (!confirm('コースを削除しますか？（マーカーも消えます）')) return;
    await deleteCourse(id);
    const list = await listCourses(); setCourses(list);
    if (selected?.id === id) setSelected(null);
  };

  const doExport = async () => {
    const text = await exportJson();
    downloadText('mk-map-backup.json', text);
  };
  const doImport = async () => {
    const wipe = confirm('全消去してから復元しますか？（OK=全消去）');
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'application/json';
    input.onchange = async () => {
      const file = input.files?.[0]; if (!file) return;
      const text = await file.text();
      await importJson(text, wipe);
      const list = await listCourses(); setCourses(list);
      if (selected) setSelected(list.find(c => c.id === selected.id) ?? null);
      alert('復元しました');
    };
    input.click();
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <h3>コース一覧</h3>
        <button onClick={onCreate}>＋ 新規コース</button>
        <hr/>
        {courses.map(c => (
          <div key={c.id} style={{margin:'8px 0', padding:'6px', border:'1px solid #2a2f3a', borderRadius:6}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:8}}>
              <button onClick={()=>setSelected(c)}>{c.name}</button>
              <button onClick={()=>onDelete(c.id)}>削除</button>
            </div>
          </div>
        ))}
        <hr/>
        <h4>バックアップ</h4>
        <div style={{display:'flex', gap:8}}>
          <button onClick={doExport}>エクスポート</button>
          <button onClick={doImport}>インポート</button>
        </div>
        <p style={{color:'var(--muted)'}}>ブラウザにローカル保存（IndexedDB）。</p>
      </aside>

      <main className="content">
        {selected ? (
          <MapEditor key={selected.id} course={selected}/>
        ) : (
          <div style={{padding:24}}>
            <h2>コースを選択/作成してください</h2>
            <p>左の「＋ 新規コース」から画像を取り込めます。</p>
          </div>
        )}
      </main>
    </div>
  );
}

async function fileToDataURL(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}
