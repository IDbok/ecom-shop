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
  private modalState = signal<ImageModalData>({
    images: [],
    currentIndex: 0,
    isVisible: false
  });

  // Public signals for components
  readonly isVisible = signal(false);
  readonly currentImage = signal<Photo | string | null>(null);
  readonly currentIndex = signal(0);
  readonly totalImages = signal(0);

  /**
   * Open modal window with images (Photo[] or string[])
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
   * Open modal window with single image (Photo or string)
   */
  openSingleImage(image: Photo | string): void {
    if (typeof image === 'string') {
      this.openModal([image], 0);
    } else {
      this.openModal([image], 0);
    }
  }

  /**
   * Close modal window
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
   * Navigate to next image
   */
  nextImage(): void {
    const state = this.modalState();
    if (!state.isVisible || state.images.length <= 1) return;

    const newIndex = (state.currentIndex + 1) % state.images.length;
    this.modalState.update(s => ({ ...s, currentIndex: newIndex }));
    this.updatePublicState();
  }

  /**
   * Navigate to previous image
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
   * Handle keyboard input
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
   * Get image URL (supports both Photo objects and strings)
   */
  getImageUrl(image: Photo | string): string {
    return typeof image === 'string' ? image : image.url;
  }

  /**
   * Update public state
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
   * Block body scroll
   */
  private blockBodyScroll(): void {
    document.body.style.overflow = 'hidden';
  }

  /**
   * Restore body scroll
   */
  private restoreBodyScroll(): void {
    document.body.style.overflow = 'auto';
  }
}