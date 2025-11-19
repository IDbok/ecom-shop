import { Component, inject, HostListener } from '@angular/core';
import { ImageModalService } from '../../core/services/image-modal.service';

@Component({
  selector: 'app-image-modal',
  imports: [],
  templateUrl: './image-modal.html',
  styleUrl: './image-modal.css'
})
export class ImageModal {
  protected imageModalService = inject(ImageModalService);

  private touchStartX = 0;
  private touchEndX = 0;

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    this.imageModalService.handleKeyDown(event);
  }

  // Touch события для мобильных устройств
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0].screenX;
  }

  onTouchEnd(event: TouchEvent): void {
    this.touchEndX = event.changedTouches[0].screenX;
    this.handleSwipe();
  }

  private handleSwipe(): void {
    const swipeThreshold = 50; // минимальная дистанция для свайпа
    const swipeDistance = this.touchEndX - this.touchStartX;

    if (Math.abs(swipeDistance) > swipeThreshold) {
      if (swipeDistance > 0) {
        // Свайп вправо - предыдущее изображение
        this.prevImage();
      } else {
        // Свайп влево - следующее изображение
        this.nextImage();
      }
    }
  }

  protected closeModal(): void {
    this.imageModalService.closeModal();
  }

  protected nextImage(): void {
    this.imageModalService.nextImage();
  }

  protected prevImage(): void {
    this.imageModalService.prevImage();
  }

  protected getImageUrl(image: any): string {
    return this.imageModalService.getImageUrl(image);
  }
}