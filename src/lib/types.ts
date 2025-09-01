export type MarkerType = 'itemBox' | 'shortcut' | 'hazard' | 'coin' | 'boost';

export interface Course {
  id: string;
  name: string;
  series?: string;
  imageDataUrl: string; // base64 Data URL（Pagesでも確実に表示できる）
  createdAt: string;
  updatedAt: string;
}

export interface Marker {
  id: string;
  courseId: string;
  x: number; // 0..1
  y: number; // 0..1
  type: MarkerType;
  note?: string;
  createdAt: string;
  updatedAt: string;
}
