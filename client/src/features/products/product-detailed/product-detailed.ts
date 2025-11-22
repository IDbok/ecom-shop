import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { Product } from '../../../types/product';
import { Asset } from '../../../types/asset';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ProductService } from '../../../core/services/product-service';
import { ImageModalService } from '../../../core/services/image-modal.service';

@Component({
  selector: 'app-product-detailed',
  imports: [RouterOutlet],
  templateUrl: './product-detailed.html',
  styleUrl: './product-detailed.css'
})
export class ProductDetailed implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  protected productService = inject(ProductService);
  protected imageModalService = inject(ImageModalService);
  
  protected isAdmin = signal(true); // Заглушка для примера
  protected currentRoute = signal<string>('');
  protected editModeEnabled = signal(false); // Новый сигнал для управления доступом к вкладкам
  
  // Для миниатюр
  protected photos = signal<Asset[]>([]);
  protected selectedImageUrl = signal<string>('');
  
  // Subject для автоматической отписки
  private destroy$ = new Subject<void>();
  
  // Computed property для проверки, находимся ли мы в режиме редактирования
  protected isEditMode = computed(() => {
    return this.currentRoute().endsWith('/edit');
  });

  ngOnInit(): void {
    const product = this.route.snapshot.data['product'] as Product;
    console.log('ProductDetailed initialized with product:', product);
    // Устанавливаем продукт в глобальное хранилище через сервис
    if (product && product.id != this.productService.currentProduct()?.id) {
      console.log('Setting current product in ProductService');
      this.productService.setCurrentProduct(product);
    }
    
    // Загружаем фотографии для миниатюр
    this.loadPhotos(product);
    
    // Устанавливаем начальное состояние роута
    this.updateCurrentRoute();
    
    // Проверяем, не пытается ли пользователь получить прямой доступ к edit/photos
    this.checkInitialRoute();
    
    // Подписываемся на изменения роута с автоматической отпиской
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntil(this.destroy$) // ← Подписка будет активна ПОКА destroy$ не испустит значение
    ).subscribe(() => {
      this.updateCurrentRoute();
    });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next(); // ← Испускаем значение - все подписки с takeUntil(destroy$) завершаются
    this.destroy$.complete();
  }
  
  private updateCurrentRoute(): void {
    this.currentRoute.set(this.router.url);
  }

  private checkInitialRoute(): void {
    const currentUrl = this.router.url;
    // Если пользователь пытается получить прямой доступ к edit или photos без включенного режима редактирования
    if ((currentUrl.endsWith('/edit') || currentUrl.endsWith('/photos')) && !this.editModeEnabled()) {
      this.router.navigate(['description'], { relativeTo: this.route });
    }
  }

  protected navigateToEdit(): void {
    const product = this.productService.currentProduct();
    if (product) {
      this.editModeEnabled.set(true);
      this.router.navigate(['edit'], { relativeTo: this.route });
    }
  }

  protected navigateToDescription(): void {
    const product = this.productService.currentProduct();
    if (product) {
      this.editModeEnabled.set(false);
      this.router.navigate(['description'], { relativeTo: this.route });
    }
  }

  protected exitEditMode(): void {
    this.editModeEnabled.set(false);
    // Если пользователь находится на вкладке Edit или Photos, перенаправляем на Description
    const currentUrl = this.currentRoute();
    if (currentUrl.endsWith('/edit') || currentUrl.endsWith('/photos')) {
      this.router.navigate(['description'], { relativeTo: this.route });
    }
  }

  protected navigateToPhotos(): void {
    const product = this.productService.currentProduct();
    if (product) {
      this.router.navigate(['photos'], { relativeTo: this.route });
    }
  }

  // Метод для открытия модального окна главного изображения
  protected openMainImageModal(): void {
    const currentImage = this.selectedImageUrl() || this.productService.currentProduct()?.imageUrl;
    if (currentImage) {
      this.imageModalService.openSingleImage(currentImage);
    }
  }

  // Простая загрузка изображений
  private loadPhotos(product: Product): void {
    if (product?.id) {
      this.productService.getProductImages(product.id).subscribe({
        next: (assets: Asset[]) => {
          this.photos.set(assets);
          // Устанавливаем первое изображение как выбранное
          if (assets.length > 0) {
            this.selectedImageUrl.set(assets[0].url);
          } else if (product.imageUrl) {
            this.selectedImageUrl.set(product.imageUrl);
          }
        },
        error: (error: any) => {
          console.error('Error loading images:', error);
          // Если ошибка, используем главное изображение
          if (product.imageUrl) {
            this.selectedImageUrl.set(product.imageUrl);
          }
        }
      });
    }
  }

  // Обработка выбора фотографии из миниатюр
  protected onPhotoSelected(photoUrl: string): void {
    this.selectedImageUrl.set(photoUrl);
  }

  // Получить текущее выбранное изображение
  protected getCurrentImage(): string {
    return this.selectedImageUrl() || this.productService.currentProduct()?.imageUrl || '/product.png';
  }
}
