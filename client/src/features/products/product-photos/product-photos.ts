import { Component, inject, OnInit, signal } from '@angular/core';
import { ProductService } from '../../../core/services/product-service';
import { ActivatedRoute } from '@angular/router';
import { Asset } from '../../../types/asset';
import { ImageUpload } from "../../../shared/image-upload/image-upload";
import { StarButton } from "../../../shared/star-button/star-button";
import { DeleteButton } from "../../../shared/delete-button/delete-button";
import { ImageModalService } from '../../../core/services/image-modal.service';

@Component({
  selector: 'app-product-photos',
  imports: [ImageUpload, StarButton, DeleteButton],
  templateUrl: './product-photos.html',
  styleUrl: './product-photos.css'
})
export class ProductPhotos implements OnInit {
  protected productService = inject(ProductService);
  protected imageModalService = inject(ImageModalService);
  private route = inject(ActivatedRoute);
  protected photos = signal<Asset[]>([]);
  protected loading = signal(false);
  protected deleting = signal<number | null>(null); // ID фотографии, которая удаляется
  
  // По умолчанию находимся в режиме редактирования
  protected editMode = signal(true);

  ngOnInit(): void {
    const productId = this.route.parent?.snapshot.paramMap.get('id');
    if (productId) {
      this.productService.getProductImages(+productId!).subscribe({
        next: (assets: Asset[]) => this.photos.set(assets)
      });
    }
  }

  onUploadImage(file: File) {
    const productId = this.route.parent?.snapshot.paramMap.get('id');
    if (!productId) return;

    this.loading.set(true);
    this.productService.addAsset(+productId, file).subscribe({
      next: (asset: Asset) => {
        this.loading.set(false);
        this.photos.update(photos => [...photos, asset]);
        // Обновляем текущий продукт с новым ассетом
        this.productService.refreshCurrentProduct(+productId);
      },
      error: (error: any) => {
        console.error('Error uploading photo:', error);
        this.loading.set(false);
      }
    });
  }

  setMainPhoto(asset: Asset) {
    this.productService.setMainAsset(asset).subscribe({
      next: () => {
        // Обновляем текущий продукт
        const current = this.productService.currentProduct();
        if (current) {
          this.productService.setCurrentProduct({
            ...current,
            imageUrl: asset.url
          });
        }
      }
    });
  }

  deletePhoto(asset: Asset) {
    const currentProduct = this.productService.currentProduct();
    const isMainPhoto = currentProduct?.imageUrl === asset.url;
    
    let confirmMessage = 'Вы уверены, что хотите удалить это изображение?';
    if (isMainPhoto) {
      confirmMessage = 'Вы уверены, что хотите удалить главное изображение продукта? Это действие нельзя отменить.';
    }

    if (confirm(confirmMessage)) {
      this.deleting.set(asset.id);
      this.productService.deleteAsset(asset).subscribe({
        next: () => {
          this.photos.update(photos => photos.filter((p: Asset) => p.id !== asset.id));
          this.deleting.set(null);
          // Обновляем текущий продукт
          const productId = this.route.parent?.snapshot.paramMap.get('id');
          if (productId) {
            this.productService.refreshCurrentProduct(+ productId);
          }
        },
        error: (error: any) => {
          console.error('Error deleting asset:', error);
          this.deleting.set(null);
          alert('Ошибка при удалении изображения. Попробуйте еще раз.');
        }
      });
    }
  }

  // Метод для открытия модального окна с изображением
  protected openImageModal(asset: Asset): void {
    const photos = this.photos();
    const index = photos.findIndex((p: Asset) => p.id === asset.id);
    this.imageModalService.openModal(photos, index);
  }
}