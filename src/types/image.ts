export interface ImageItem {
  id: string;
  url: string;
  file?: File;
  fileAssetId?: number;
  contentType?: 'IMAGE' | 'VIDEO';
}
