export interface ImageItem {
  id: string;
  url: string;
}

export interface HomeNote {
  id: string;
  title: string;
  date: string;
  images: ImageItem[];
  totalFileCount: number; // 전체 파일 개수
}
