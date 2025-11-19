import { Component, input, output } from '@angular/core';
import { Photo } from '../../types/photo';

@Component({
  selector: 'app-product-thumbnails',
  imports: [],
  templateUrl: './product-thumbnails.html',
  styleUrl: './product-thumbnails.css'
})
export class ProductThumbnails {
  // Входные данные
  photos = input<Photo[]>([]);
  selectedPhotoUrl = input<string>('');
  
  // Выходные события
  photoSelected = output<string>();
  
  // Выбор фотографии
  selectPhoto(photoUrl: string): void {
    this.photoSelected.emit(photoUrl);
  }
}