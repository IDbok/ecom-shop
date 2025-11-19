import { Injectable, signal } from '@angular/core';
import { Photo } from '../../types/photo';

export interface ImageModalData {
  images: Photo[] | string[];
  currentIndex: number;
  isVisible: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ImageModalService {
  // Состояние модального окна
  private modalState = signal<ImageModalData>({
    images: [],
    currentIndex: 0,
    isVisible: false
  });

  // Публичные сигналы для компонентов
  readonly isVisible = signal(false);
  readonly currentImage = signal<Photo | string | null>(null);
  readonly currentIndex = signal(0);
  readonly totalImages = signal(0);

  /**
   * Открыть модальное окно с изображениями Photo[]
   */
  openModal(images: Photo[], initialIndex?: number): void;
  /**
   * Открыть модальное окно с изображениями string[]
   */
  openModal(images: string[], initialIndex?: number): void;
  /**
   * Реализация
   */
  openModal(images: Photo[] | string[], initialIndex: number = 0): void {
    if (images.length === 0) return;

    this.modalState.set({
      images,
      currentIndex: Math.max(0, Math.min(initialIndex, images.length - 1)),
      isVisible: true
    });

    this.updatePublicState();
    this.blockBodyScroll();
  }

  /**
   * Открыть модальное окно с одним изображением Photo
   */
  openSingleImage(image: Photo): void;
  /**
   * Открыть модальное окно с одним изображением string
   */
  openSingleImage(image: string): void;
  /**
   * Реализация
   */
  openSingleImage(image: Photo | string): void {
    if (typeof image === 'string') {
      this.openModal([image], 0);
    } else {
      this.openModal([image], 0);
    }
  }

  /**
   * Закрыть модальное окно
   */
  closeModal(): void {
    this.modalState.update(state => ({
      ...state,
      isVisible: false
    }));

    this.isVisible.set(false);
    this.currentImage.set(null);
    this.restoreBodyScroll();
  }

  /**
   * Перейти к следующему изображению
   */
  nextImage(): void {
    const state = this.modalState();
    if (!state.isVisible || state.images.length <= 1) return;

    const newIndex = (state.currentIndex + 1) % state.images.length;
    this.modalState.update(s => ({ ...s, currentIndex: newIndex }));
    this.updatePublicState();
  }

  /**
   * Перейти к предыдущему изображению
   */
  prevImage(): void {
    const state = this.modalState();
    if (!state.isVisible || state.images.length <= 1) return;

    const newIndex = state.currentIndex === 0 
      ? state.images.length - 1 
      : state.currentIndex - 1;
    
    this.modalState.update(s => ({ ...s, currentIndex: newIndex }));
    this.updatePublicState();
  }

  /**
   * Обработка клавиш
   */
  handleKeyDown(event: KeyboardEvent): void {
    if (!this.isVisible()) return;

    switch (event.key) {
      case 'Escape':
        this.closeModal();
        break;
      case 'ArrowLeft':
        this.prevImage();
        break;
      case 'ArrowRight':
        this.nextImage();
        break;
    }
  }

  /**
   * Получить URL изображения (поддерживает как Photo объекты, так и строки)
   */
  getImageUrl(image: Photo | string): string {
    return typeof image === 'string' ? image : image.url;
  }

  /**
   * Обновить публичное состояние
   */
  private updatePublicState(): void {
    const state = this.modalState();
    
    this.isVisible.set(state.isVisible);
    this.currentIndex.set(state.currentIndex);
    this.totalImages.set(state.images.length);
    
    if (state.isVisible && state.images.length > 0) {
      this.currentImage.set(state.images[state.currentIndex]);
    } else {
      this.currentImage.set(null);
    }
  }

  /**
   * Заблокировать прокрутку body
   */
  private blockBodyScroll(): void {
    document.body.style.overflow = 'hidden';
  }

  /**
   * Восстановить прокрутку body
   */
  private restoreBodyScroll(): void {
    document.body.style.overflow = 'auto';
  }
}