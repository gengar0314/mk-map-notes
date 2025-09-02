import { Course } from './types';

// 初期コース一覧（画像ファイル名とURLを対応）
// 画像は public/maps/ に配置
export const initialCourses: Course[] = [
  {
    id: 'course-1',
    name: 'どんぐりツリーハウス～キノピオファクトリー',
    imageDataUrl: '/maps/どんぐりツリーハウス～キノピオファクトリー.png',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'course-2',
    name: 'おばけシネマ～マリオサーキット',
    imageDataUrl: '/maps/おばけシネマ～マリオサーキット.png',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // ...必要に応じて追加
];
