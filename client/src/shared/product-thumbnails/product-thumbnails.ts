import { Component, input, output } from '@angular/core';
import { Asset } from '../../types/asset';

@Component({
  selector: 'app-asset-thumbnails',
  imports: [],
  templateUrl: './product-thumbnails.html',
  styleUrl: './product-thumbnails.css'
})
export class AssetThumbnails {
  // Входные данные
  assets = input<Asset[]>([]);
  selectedAssetUrl = input<string>('');
  
  // Выходные события
  assetSelected = output<string>();
  
  // Выбор изображения
  selectAsset(assetUrl: string): void {
    this.assetSelected.emit(assetUrl);
  }
}