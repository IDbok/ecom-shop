// Product.ts
import { Asset, AssetType } from './asset';

export enum PriceKind {
  COGS = 0, // себестоимость
  WHOLESALE = 1, // оптовая цена
  RETAIL = 2 // розничная цена
}

export interface Dimensions {
  widthMm: number;
  heightMm: number;
  depthMm: number;
}

export interface Price {
  id: string; // Guid в C# -> string в TS
  kind: PriceKind;
  currency: string;
  amount: number;
  minQty: number;
  validFrom: string; // DateTimeOffset -> ISO string
  validTo?: string; // nullable DateTimeOffset -> optional string
  productId: number;
}



export interface Product {
  id: number;
  article?: string;
  name: string;
  packagedWeight: number;
  packagedVolume: number;
  size: Dimensions;
  price: Price;
  defaultColor?: string;
  category?: string;
  description?: string;
  imageUrl?: string;
  assets?: Asset[]; // Основной список файлов
  sourceUrl?: string; // Новый URL источника
}

// Класс с методами (если нужна логика)
export class ProductModel implements Product {
  id: number;
  article?: string;
  name: string;
  packagedWeight: number;
  packagedVolume: number;
  size: Dimensions;
  price: Price;
  defaultColor?: string;
  category?: string;
  description?: string;
  imageUrl?: string;
  assets?: Asset[];

  constructor(data: Product) {
    this.id = data.id;
    this.article = data.article;
    this.name = data.name;
    this.packagedWeight = data.packagedWeight;
    this.packagedVolume = data.packagedVolume;
    this.size = data.size;
    this.price = data.price;
    this.defaultColor = data.defaultColor;
    this.category = data.category;
    this.description = data.description;
    this.imageUrl = data.imageUrl;
    this.assets = data.assets;
  }

  // Utility methods
  get isValidColor(): boolean {
    if (!this.defaultColor) return true;
    return /^RAL\s?\d{4}$/.test(this.defaultColor);
  }

  get formattedPrice(): string {
    return `${this.price.amount} ${this.price.currency}`;
  }

  get isPriceActive(): boolean {
    const now = new Date();
    const validFrom = new Date(this.price.validFrom);
    const validTo = this.price.validTo ? new Date(this.price.validTo) : null;
    
    return validFrom <= now && (validTo === null || validTo > now);
  }

  get mainAsset(): Asset | undefined {
    return this.imageAssets?.find(asset => asset.url === this.imageUrl);
  }

  // Методы для работы с разными типами файлов
  get imageAssets(): Asset[] {
    return this.assets?.filter(asset => asset.type === AssetType.Image) || [];
  }

  get documentAssets(): Asset[] {
    return this.assets?.filter(asset => asset.type === AssetType.Document) || [];
  }

  get videoAssets(): Asset[] {
    return this.assets?.filter(asset => asset.type === AssetType.Video) || [];
  }

  get volume(): number {
    const { widthMm, heightMm, depthMm } = this.size;
    return (widthMm * heightMm * depthMm) / 1000000000; // mm³ to m³
  }
}

// DTO для создания/обновления
export interface CreateProductDto {
  article?: string;
  name: string;
  packagedWeight?: number;
  packagedVolume?: number;
  size: Dimensions;
  defaultColor?: string;
  category?: string;
  description?: string;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
  id: number;
}

export interface PriceUpdateDto {
  id?: string;
  kind: PriceKind;
  currency: string;
  amount: number;
  minQty: number;
  validFrom: string;
  validTo?: string;
}