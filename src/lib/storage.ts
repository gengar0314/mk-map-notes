import { set, get, update } from 'idb-keyval';
import { Course, Marker } from './types';
import { initialCourses } from './initialCourses';

const COURSES_KEY = 'courses';
const MARKERS_KEY = 'markers';

export async function listCourses(): Promise<Course[]> {
  let courses = await get(COURSES_KEY);
  if (!courses || courses.length === 0) {
    // 初期コースを保存
    await set(COURSES_KEY, initialCourses);
    courses = initialCourses;
  }
  return courses ?? [];
}
export async function saveCourses(courses: Course[]) {
  return set(COURSES_KEY, courses);
}
export async function listMarkers(): Promise<Marker[]> {
  return (await get(MARKERS_KEY)) ?? [];
}
export async function saveMarkers(markers: Marker[]) {
  return set(MARKERS_KEY, markers);
}

// ヘルパ（追加/更新/削除）
export async function upsertCourse(c: Course) {
  await update(COURSES_KEY, (arr: Course[] = []) => {
    const idx = arr.findIndex(x => x.id === c.id);
    if (idx >= 0) arr[idx] = c; else arr.push(c);
    return arr;
  });
}
export async function deleteCourse(id: string) {
  await update(COURSES_KEY, (arr: Course[] = []) => arr.filter(c => c.id !== id));
  await update(MARKERS_KEY, (arr: Marker[] = []) => arr.filter(m => m.courseId !== id));
}
export async function upsertMarker(m: Marker) {
  await update(MARKERS_KEY, (arr: Marker[] = []) => {
    const idx = arr.findIndex(x => x.id === m.id);
    if (idx >= 0) arr[idx] = m; else arr.push(m);
    return arr;
  });
}
export async function deleteMarker(id: string) {
  await update(MARKERS_KEY, (arr: Marker[] = []) => arr.filter(m => m.id !== id));
}
