export interface ImageItem {
  id: string;
  url: string;
}

export interface HomeNote {
  id: string;
  title: string;
  date: string;
  images: ImageItem[];
}
