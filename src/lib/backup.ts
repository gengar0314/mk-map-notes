import { listCourses, listMarkers, saveCourses, saveMarkers } from './storage';
import { Course, Marker } from './types';

export interface BackupJson {
  version: 1;
  exportedAt: string;
  courses: Course[];
  markers: Marker[];
}

export async function exportJson(): Promise<string> {
  const payload: BackupJson = {
    version: 1,
    exportedAt: new Date().toISOString(),
    courses: await listCourses(),
    markers: await listMarkers(),
  };
  return JSON.stringify(payload, null, 2);
}

export async function importJson(text: string, wipe = false) {
  const data: BackupJson = JSON.parse(text);
  if (data.version !== 1) throw new Error('Unsupported version');
  if (wipe) { await saveCourses([]); await saveMarkers([]); }
  await saveCourses(data.courses);
  await saveMarkers(data.markers);
}

// ブラウザ保存
export function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
