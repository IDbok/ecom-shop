import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { Product } from '../../../types/product';
import { Photo } from '../../../types/photo';
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
  protected photos = signal<Photo[]>([]);
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

  // Простая загрузка фотографий
  private loadPhotos(product: Product): void {
    if (product?.id) {
      this.productService.getProductPhotos(product.id).subscribe({
        next: (photos: Photo[]) => {
          this.photos.set(photos);
          // Устанавливаем первое изображение как выбранное
          if (photos.length > 0) {
            this.selectedImageUrl.set(photos[0].url);
          } else if (product.imageUrl) {
            this.selectedImageUrl.set(product.imageUrl);
          }
        },
        error: (error) => {
          console.error('Error loading photos:', error);
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
    return this.selectedImageUrl() || this.productService.currentProduct()?.imageUrl || '/user.png';
  }
}
