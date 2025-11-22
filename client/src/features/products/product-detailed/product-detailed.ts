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
  
  protected isAdmin = signal(true); // Placeholder for example
  protected currentRoute = signal<string>('');
  protected editModeEnabled = signal(false);
  
  // For thumbnails and modal
  protected photos = signal<Asset[]>([]);
  protected allImages = signal<string[]>([]); // All image URLs for modal
  protected selectedImageUrl = signal<string>('');
  
  // Subject for automatic unsubscription
  private destroy$ = new Subject<void>();
  
  // Computed property to check if we are in edit mode
  protected isEditMode = computed(() => {
    return this.currentRoute().endsWith('/edit');
  });

  ngOnInit(): void {
    const product = this.route.snapshot.data['product'] as Product;
    console.log('ProductDetailed initialized with product:', product);
    // Set the product in global storage via service
    if (product && product.id != this.productService.currentProduct()?.id) {
      console.log('Setting current product in ProductService');
      this.productService.setCurrentProduct(product);
    }
    
    // Load photos for thumbnails
    this.loadPhotos(product);
    
    // Set initial route state
    this.updateCurrentRoute();
    
    // Check if user is trying to access edit/photos directly
    this.checkInitialRoute();
    
    // Subscribe to route changes with automatic unsubscription
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntil(this.destroy$) // ← Subscription will be active UNTIL destroy$ emits a value
    ).subscribe(() => {
      this.updateCurrentRoute();
    });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next(); // ← Emit value - all subscriptions with takeUntil(destroy$) complete
    this.destroy$.complete();
  }
  
  private updateCurrentRoute(): void {
    this.currentRoute.set(this.router.url);
  }

  private checkInitialRoute(): void {
    const currentUrl = this.router.url;
    // If user tries to access edit or photos directly without edit mode enabled
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
    // If user is on Edit or Photos tab, redirect to Description
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

  /**
   * Open modal window with all product images
   * Opens at the index of currently selected image
   */
  protected openImageModal(): void {
    const currentImage = this.selectedImageUrl();
    const images = this.allImages();
    
    if (images.length === 0) return;
    
    // Find index of current image in the array
    const currentIndex = images.findIndex(img => img === currentImage);
    
    // Open modal with all images, starting from current index
    this.imageModalService.openModal(images, currentIndex >= 0 ? currentIndex : 0);
  }

  /**
   * Load product photos and build complete image array
   */
  private loadPhotos(product: Product): void {
    if (product?.id) {
      this.productService.getProductImages(product.id).subscribe({
        next: (assets: Asset[]) => {
          this.photos.set(assets);
          
          // Build complete image array: main image + additional photos
          const imageUrls: string[] = [];
          
          // Add main image first if it exists
          if (product.imageUrl) {
            imageUrls.push(product.imageUrl);
            this.selectedImageUrl.set(product.imageUrl);
          }
          
          // Add additional photos (skip if same as main image)
          assets.forEach(asset => {
            if (asset.url !== product.imageUrl) {
              imageUrls.push(asset.url);
            }
          });
          
          // If no main image, use first asset
          if (!product.imageUrl && assets.length > 0) {
            this.selectedImageUrl.set(assets[0].url);
          }
          
          // Fallback to placeholder if no images
          if (imageUrls.length === 0) {
            imageUrls.push('/product.png');
            this.selectedImageUrl.set('/product.png');
          }
          
          this.allImages.set(imageUrls);
        },
        error: (error: any) => {
          console.error('Error loading images:', error);
          
          // Fallback to main image or placeholder
          const fallbackImage = product.imageUrl || '/product.png';
          this.selectedImageUrl.set(fallbackImage);
          this.allImages.set([fallbackImage]);
        }
      });
    }
  }
  // Handle photo selection from thumbnails
  protected onPhotoSelected(photoUrl: string): void {
    this.selectedImageUrl.set(photoUrl);
  }

  // Get the current selected image
  protected getCurrentImage(): string {
    return this.selectedImageUrl() || 
      this.productService.currentProduct()?.imageUrl || 
      '/product.png';
  }
}
