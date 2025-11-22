import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { Product, UpdateProductDto, PriceUpdateDto } from '../../types/product';
import { Asset, AssetType } from '../../types/asset';
import { ProductFilter, ProductFilterQuery, PagedResult } from '../../types/product-filter';
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
   * Получить список продуктов с фильтрацией и пагинацией
   */
  getProductsWithFilters(filters: ProductFilter): Observable<PagedResult<Product>> {
    let params = new HttpParams();

    // Добавляем параметры фильтрации
    if (filters.categories?.length) {
      filters.categories.forEach(category => {
        params = params.append('categories', category);
      });
    }

    if (filters.priceRange?.min !== undefined) {
      params = params.set('minPrice', filters.priceRange.min.toString());
    }

    if (filters.priceRange?.max !== undefined) {
      params = params.set('maxPrice', filters.priceRange.max.toString());
    }

    if (filters.searchQuery?.trim()) {
      params = params.set('searchQuery', filters.searchQuery.trim());
    }

    if (filters.sortBy) {
      params = params.set('sortBy', filters.sortBy);
    }

    if (filters.sortOrder) {
      params = params.set('sortOrder', filters.sortOrder);
    }

    if (filters.currency) {
      params = params.set('currency', filters.currency);
    }

    // Добавляем параметры пагинации
    params = params.set('pageIndex', filters.pageIndex.toString());
    params = params.set('pageSize', filters.pageSize.toString());

    return this.http.get<PagedResult<Product>>(this.baseUrl + 'products', { params }).pipe(
      tap(result => this.products.set(result.data))
    );
  }

  /**
   * Получить список доступных категорий
   */
  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(this.baseUrl + 'products/categories');
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
   * Получить только изображения продукта
   */
  getProductImages(id: number): Observable<Asset[]> {
    return this.http.get<Asset[]>(this.baseUrl + 'products/' + id + '/photos');
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
  addAsset(productId: number, file: File): Observable<Asset> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<Asset>(this.baseUrl + 'products/' + productId + '/add-asset', formData).pipe(
      tap(asset => {
        // Добавляем ассет в текущий продукт
        const current = this.currentProduct();
        if (current && current.id === productId) {
          const updatedAssets = [...(current.assets || []), asset];
          this.currentProduct.set({ ...current, assets: updatedAssets });
        }
      })
    );
  }

  /**
   * Установить главное изображение
   */
  setMainAsset(asset: Asset): Observable<void> {
    return this.http.put<void>(this.baseUrl + 'products/set-main-asset/' + asset.id, {}).pipe(
      tap(() => {
        // Обновляем главное изображение в текущем продукте
        const current = this.currentProduct();
        if (current && current.assets?.some((a: Asset) => a.id === asset.id)) {
          this.currentProduct.set({ ...current, imageUrl: asset.url });
        }
      })
    );
  }

  /**
   * Удалить ассет (файл)
   */
  deleteAsset(asset: Asset): Observable<void> {
    return this.http.delete<void>(this.baseUrl + 'products/delete-asset/' + asset.id).pipe(
      tap(() => {
        // Удаляем ассет из текущего продукта
        const current = this.currentProduct();
        if (current && current.assets) {
          const updatedAssets = current.assets.filter((a: Asset) => a.id !== asset.id);
          const updatedProduct = { ...current, assets: updatedAssets };
          
          // Если удаляемый ассет был главным изображением, очищаем imageUrl
          if (current.imageUrl === asset.url) {
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