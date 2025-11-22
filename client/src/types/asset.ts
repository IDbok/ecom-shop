export enum AssetType {
  Image = 0,
  Document = 1,
  Video = 2,
  Audio = 3,
  Archive = 4,
  Other = 5
}

export interface Asset {
  id: number;
  url: string;
  publicId?: string;
  fileName: string;
  fileSize: number;
  type: AssetType;
  
  // Для изображений
  thumbnailUrl?: string;
  thumbnailPublicId?: string;
  width?: number;
  height?: number;
  
  createdAt: string;
  updatedAt?: string;
  productId: number;
}

// Для обратной совместимости с существующим кодом
export type Photo = Asset;