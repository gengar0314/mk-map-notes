import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Course, Marker, MarkerType } from '../lib/types';
import { listMarkers, upsertMarker, deleteMarker } from '../lib/storage';

const typeIcon: Record<MarkerType, string> = {
  itemBox:'📦', shortcut:'⭐', hazard:'⚠️', coin:'🪙', boost:'➡️'
};

function uuid() { return crypto.randomUUID(); }

export default function MapEditor({ course }: { course: Course }) {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [currentType, setCurrentType] = useState<MarkerType>('itemBox');
  const [addMode, setAddMode] = useState(true);

  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({x:0,y:0});
  const isPanning = useRef(false);
  const panStart = useRef<{x:number,y:number}|null>(null);

  useEffect(() => { listMarkers().then(all => setMarkers(all.filter(m => m.courseId === course.id))); }, [course.id]);

  const onCanvasClick = async (e: React.MouseEvent) => {
    if (!addMode) return;
    const pos = toNorm(e);
    if (!pos) return;
    const note = prompt('メモ（任意）:') ?? '';
    const now = new Date().toISOString();
    const m: Marker = { id: uuid(), courseId: course.id, x: pos.x, y: pos.y, type: currentType, note, createdAt: now, updatedAt: now };
    await upsertMarker(m);
    setMarkers(prev => [...prev, m]);
  };

  function toNorm(e: React.MouseEvent) {
    const img = imgRef.current!, wrap = wrapRef.current!;
    const rect = img.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    if (x<0||x>1||y<0||y>1) return null;
    return {x, y};
  }
  function fromNorm(x:number, y:number) {
    const img = imgRef.current!;
    const rect = img.getBoundingClientRect();
    return { left: rect.left + x*rect.width, top: rect.top + y*rect.height };
  }

  const onWheel: React.WheelEventHandler = (e) => {
    e.preventDefault();
    const next = Math.min(4, Math.max(0.5, scale * (e.deltaY > 0 ? 0.9 : 1.1)));
    setScale(next);
  };

  const startPan = (e: React.MouseEvent) => { isPanning.current = true; panStart.current = {x:e.clientX-offset.x, y:e.clientY-offset.y}; };
  const movePan = (e: React.MouseEvent) => { if(!isPanning.current) return; setOffset({x:e.clientX-(panStart.current!.x), y:e.clientY-(panStart.current!.y)}); };
  const endPan  = () => { isPanning.current = false; };

  const onMarkerClick = async (m: Marker) => {
    const action = prompt(`編集: \n1) 種類変更\n2) メモ変更\n3) 削除\n（番号で入力）`, '1');
    if (!action) return;
    if (action === '3') {
      if (confirm('削除しますか？')) {
        await deleteMarker(m.id);
        setMarkers(prev => prev.filter(x => x.id !== m.id));
      }
      return;
    }
    if (action === '1') {
      const t = prompt("type: itemBox/shortcut/hazard/coin/boost", m.type) as MarkerType | null;
      if (!t) return;
      const upd = {...m, type:t, updatedAt:new Date().toISOString()};
      await upsertMarker(upd);
      setMarkers(prev => prev.map(x => x.id===m.id ? upd : x));
    }
    if (action === '2') {
      const note = prompt("メモ", m.note ?? '') ?? '';
      const upd = {...m, note, updatedAt:new Date().toISOString()};
      await upsertMarker(upd);
      setMarkers(prev => prev.map(x => x.id===m.id ? upd : x));
    }
  };

  const onMarkerDrag = async (m: Marker, e: React.MouseEvent) => {
    // ドラッグ移動（簡易）
    const move = (ev: MouseEvent) => {
      const img = imgRef.current!;
      const rect = img.getBoundingClientRect();
      const x = (ev.clientX - rect.left) / rect.width;
      const y = (ev.clientY - rect.top) / rect.height;
      m.x = Math.min(1, Math.max(0, x));
      m.y = Math.min(1, Math.max(0, y));
      setMarkers(prev => prev.map(x => x.id===m.id ? {...x, x:m.x, y:m.y} : x));
    };
    const up = async () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      const upd = {...m, updatedAt:new Date().toISOString()};
      await upsertMarker(upd);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  };

  return (
    <>
      <div className="toolbar">
        <label>タイプ:</label>
        <select value={currentType} onChange={e=>setCurrentType(e.target.value as any)}>
          <option value="itemBox">📦 itemBox</option>
          <option value="shortcut">⭐ shortcut</option>
          <option value="hazard">⚠️ hazard</option>
          <option value="coin">🪙 coin</option>
          <option value="boost">➡️ boost</option>
        </select>
        <button onClick={()=>setAddMode(v=>!v)}>{addMode?'追加モード:ON':'追加モード:OFF'}</button>
        <span style={{marginLeft:'auto', color:'#97a1b0'}}>クリックで追加 / マーカークリックで編集 / ドラッグで移動 / ホイールでズーム</span>
      </div>

      <div
        className="canvasWrap"
        ref={wrapRef}
        onWheel={onWheel}
        onMouseDown={startPan}
        onMouseMove={movePan}
        onMouseUp={endPan}
        onMouseLeave={endPan}
        style={{ cursor: isPanning.current ? 'grabbing' : 'default' }}
      >
        <img
          ref={imgRef}
          src={course.imageDataUrl}
          style={{
            position:'absolute',
            left: offset.x, top: offset.y,
            transform: `scale(${scale})`,
            transformOrigin:'top left',
            userSelect:'none', pointerEvents: 'none'
          }}
          alt="course"
        />
        {/* クリックはラッパに付与 */}
        <div
          onClick={onCanvasClick}
          style={{position:'absolute', inset:0}}
        />
        {markers.map(m => (
          <div
            key={m.id}
            className="marker"
            style={{
              left: `calc(${offset.x}px + ${m.x*100}% * ${scale})`,
              top:  `calc(${offset.y}px + ${m.y*100}% * ${scale})`,
              fontSize: 22*scale
            }}
            onClick={(e)=>{ e.stopPropagation(); onMarkerClick(m); }}
            onMouseDown={(e)=>{ e.stopPropagation(); onMarkerDrag(m, e); }}
            title={m.note ?? ''}
          >
            {typeIcon[m.type]}
          </div>
        ))}
      </div>
    </>
  );
}
