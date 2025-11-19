import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { Product, UpdateProductDto, PriceUpdateDto } from '../../types/product';
import { Photo } from '../../types/photo';
import { firstValueFrom, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;
  
  // Signals для состояния
  editMode = signal(false);
  currentProduct = signal<Product | null>(null);
  products = signal<Product[]>([]);

  /**
   * Установить текущий продукт в глобальное хранилище
   */
  setCurrentProduct(product: Product): void {
    this.currentProduct.set(product);
  }

  /**
   * Обновить текущий продукт свежими данными с сервера
   */
  async refreshCurrentProduct(productId: number): Promise<void> {
    try {
      const updatedProduct = await firstValueFrom(this.getProduct(productId, true));
      console.log('Refreshed product data:', updatedProduct);
      if (updatedProduct) {
        this.currentProduct.set(updatedProduct);
      }
    } catch (error) {
      console.error('Error refreshing current product:', error);
    }
  }

  /**
   * Получить список всех продуктов
   */
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.baseUrl + 'products').pipe(
      tap(products => this.products.set(products))
    );
  }

  /**
   * Получить продукт по ID
   */
  getProduct(id: number, bustCache = false): Observable<Product> {
    let url = this.baseUrl + 'products/' + id;
  
    // Добавляем timestamp чтобы избежать HTTP кэширования
    if (bustCache) {
      url += '?t=' + Date.now();
    }
    
    return this.http.get<Product>(url);
  }

  /**
   * Получить фотографии продукта
   */
  getProductPhotos(id: number): Observable<Photo[]> {
    return this.http.get<Photo[]>(this.baseUrl + 'products/' + id + '/photos');
  }

  /**
   * Обновить информацию о продукте
   */
  updateProduct(product: UpdateProductDto): Observable<void> {
    return this.http.put<void>(this.baseUrl + 'products', product);
  }

  /**
   * Обновить цену продукта
   */
  updateProductPrice(productId: number, priceData: PriceUpdateDto): Observable<void> {
    return this.http.post<void>(this.baseUrl + 'products/' + productId + '/update-price', priceData).pipe(
      tap(() => {
        // Обновляем цену в текущем продукте
        const current = this.currentProduct();
        if (current && current.id === productId) {
          const updatedProduct = { 
            ...current, 
            price: { 
              ...current.price, 
              ...priceData,
              id: priceData.id || current.price.id,
              productId: productId 
            } 
          };
          this.currentProduct.set(updatedProduct);
        }
      })
    );
  }

  /**
   * Добавить фотографию к продукту
   */
  addPhoto(productId: number, file: File): Observable<Photo> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<Photo>(this.baseUrl + 'products/' + productId + '/add-photo', formData).pipe(
      tap(photo => {
        // Добавляем фото в текущий продукт
        const current = this.currentProduct();
        if (current && current.id === productId) {
          const updatedPhotos = [...(current.photos || []), photo];
          //this.currentProduct.set({ ...current, photos: updatedPhotos });
        }
      })
    );
  }

  /**
   * Установить главную фотографию
   */
  setMainPhoto(photo: Photo): Observable<void> {
    return this.http.put<void>(this.baseUrl + 'products/set-main-photo/' + photo.id, {}).pipe(
      tap(() => {
        // Обновляем главное фото в текущем продукте
        const current = this.currentProduct();
        if (current && current.photos?.some(p => p.id === photo.id)) {
          this.currentProduct.set({ ...current, imageUrl: photo.url });
        }
      })
    );
  }

  /**
   * Удалить фотографию
   */
  deletePhoto(photo: Photo): Observable<void> {
    return this.http.delete<void>(this.baseUrl + 'products/delete-photo/' + photo.id).pipe(
      tap(() => {
        // Удаляем фото из текущего продукта
        const current = this.currentProduct();
        if (current && current.photos) {
          const updatedPhotos = current.photos.filter(p => p.id !== photo.id);
          const updatedProduct = { ...current, photos: updatedPhotos };
          
          // Если удаляемое фото было главным, очищаем imageUrl
          if (current.imageUrl === photo.url) {
            updatedProduct.imageUrl = undefined;
          }
          
          this.currentProduct.set(updatedProduct);
        }
      })
    );
  }

  /**
   * Очистить текущий продукт
   */
  clearCurrentProduct(): void {
    this.currentProduct.set(null);
  }

  /**
   * Переключить режим редактирования
   */
  toggleEditMode(): void {
    this.editMode.update(mode => !mode);
  }

  /**
   * Установить режим редактирования
   */
  setEditMode(enabled: boolean): void {
    this.editMode.set(enabled);
  }

  /**
   * Создать новый продукт (если понадобится добавить в API)
   */
  createProduct(product: Omit<Product, 'id'>): Observable<Product> {
    return this.http.post<Product>(this.baseUrl + 'products', product).pipe(
      tap(newProduct => {
        // Добавляем новый продукт в список
        const products = this.products();
        this.products.set([...products, newProduct]);
      })
    );
  }

  /**
   * Удалить продукт (если понадобится добавить в API)
   */
  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(this.baseUrl + 'products/' + id).pipe(
      tap(() => {
        // Удаляем продукт из списка
        const products = this.products();
        this.products.set(products.filter(p => p.id !== id));
        
        // Очищаем текущий продукт если он был удален
        const current = this.currentProduct();
        if (current && current.id === id) {
          this.currentProduct.set(null);
        }
      })
    );
  }
}