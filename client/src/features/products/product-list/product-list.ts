import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../core/services/product-service';
import { Product } from '../../../types/product';
import { ProductCard } from '../product-card/product-card';
import { ProductFilters } from '../../../features/products/product-filters/product-filters';
import { ProductFilter, PagedResult } from '../../../types/product-filter';
import { ToastService } from '../../../core/services/toast-service';
import { Pagination } from '../../../shared/pagination/pagination';


@Component({
  selector: 'app-product-list',
  imports: [CommonModule, ProductCard, ProductFilters, Pagination],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css'
})
export class ProductList implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();
  // private toastService = inject(ToastService); // проблема при использовании тоаста

  // Состояние компонента
  pagedResult = signal<PagedResult<Product> | null>(null);
  isLoading = signal<boolean>(false);
  currentFilters = signal<ProductFilter>({
    pageIndex: 1,
    pageSize: 10
  });
  
  // UI состояние
  isMobileFiltersOpen = signal<boolean>(false);
  
  // Флаг для предотвращения двойной загрузки
  private initialLoadComplete = false;

  ngOnInit(): void {
    console.log('ProductList ngOnInit - loading initial products');
    this.loadFiltersFromUrl();
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFiltersChanged(filters: ProductFilter): void {
    console.log('ProductList - Filters changed:', filters);
    
    // Игнорируем изменения фильтров до завершения первоначальной загрузки
    if (!this.initialLoadComplete) {
      console.log('ProductList - Ignoring filter changes during initial load');
      return;
    }
    
    // Обновляем фильтры с пагинацией
    const updatedFilters = { ...filters, pageIndex: 1 }; // Сбрасываем на первую страницу
    this.currentFilters.set(updatedFilters);
    this.updateUrl(updatedFilters);
    this.loadProducts(updatedFilters);
  }

  private loadProducts(filters?: ProductFilter): void {
    this.isLoading.set(true);
    
    const activeFilters = filters || this.currentFilters();
    
    this.productService.getProductsWithFilters(activeFilters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result: PagedResult<Product>) => {
          console.log('Products loaded:', result);
          
          setTimeout(() => {
            this.pagedResult.set(result);
            this.isLoading.set(false);
            
            if (!this.initialLoadComplete) {
              this.initialLoadComplete = true;
              console.log('ProductList - Initial load completed');
            }
          }, 0);
        },
        error: (error: any) => {
          console.error('Error loading products:', error);
          
          setTimeout(() => {
            this.isLoading.set(false);
            
            if (!this.initialLoadComplete) {
              this.initialLoadComplete = true;
            }
          }, 0);
        }
      });
  }

  hasActiveFilters(filters: ProductFilter): boolean {
    return !!(filters.categories?.length || 
             filters.searchQuery || 
             filters.priceRange?.min !== undefined || 
             filters.priceRange?.max !== undefined ||
             filters.sortBy);
  }

  getActiveFiltersCount(): number {
    const filters = this.currentFilters();
    let count = 0;
    if (filters.categories?.length) count++;
    if (filters.searchQuery) count++;
    if (filters.priceRange?.min !== undefined || filters.priceRange?.max !== undefined) count++;
    return count;
  }

  toggleMobileFilters(): void {
    this.isMobileFiltersOpen.set(!this.isMobileFiltersOpen());
  }

  // Методы пагинации
  onPageChanged(pageIndex: number): void {
    const updatedFilters = { ...this.currentFilters(), pageIndex };
    this.currentFilters.set(updatedFilters);
    this.updateUrl(updatedFilters);
    this.loadProducts(updatedFilters);
  }

  onPageSizeChanged(pageSize: number): void {
    const updatedFilters = { ...this.currentFilters(), pageSize, pageIndex: 1 };
    this.currentFilters.set(updatedFilters);
    this.updateUrl(updatedFilters);
    this.loadProducts(updatedFilters);
  }

  // URL управление
  private loadFiltersFromUrl(): void {
    const queryParams = this.route.snapshot.queryParams;
    const filters: ProductFilter = {
      pageIndex: parseInt(queryParams['pageIndex']) || 1,
      pageSize: parseInt(queryParams['pageSize']) || 10,
      searchQuery: queryParams['searchQuery'] || undefined,
      sortBy: queryParams['sortBy'] || undefined,
      sortOrder: queryParams['sortOrder'] || undefined,
      currency: queryParams['currency'] || undefined
    };
    
    if (queryParams['categories']) {
      filters.categories = Array.isArray(queryParams['categories']) 
        ? queryParams['categories'] 
        : [queryParams['categories']];
    }
    
    if (queryParams['minPrice'] || queryParams['maxPrice']) {
      filters.priceRange = {
        min: queryParams['minPrice'] ? parseInt(queryParams['minPrice']) : undefined,
        max: queryParams['maxPrice'] ? parseInt(queryParams['maxPrice']) : undefined
      };
    }
    
    this.currentFilters.set(filters);
  }

  private updateUrl(filters: ProductFilter): void {
    const queryParams: any = {
      pageIndex: filters.pageIndex > 1 ? filters.pageIndex : undefined,
      pageSize: filters.pageSize !== 10 ? filters.pageSize : undefined
    };

    if (filters.searchQuery) queryParams.searchQuery = filters.searchQuery;
    if (filters.sortBy) queryParams.sortBy = filters.sortBy;
    if (filters.sortOrder && filters.sortOrder !== 'asc') queryParams.sortOrder = filters.sortOrder;
    if (filters.currency && filters.currency !== 'RUB') queryParams.currency = filters.currency;
    if (filters.categories?.length) queryParams.categories = filters.categories;
    if (filters.priceRange?.min) queryParams.minPrice = filters.priceRange.min;
    if (filters.priceRange?.max) queryParams.maxPrice = filters.priceRange.max;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'replace'
    });
  }

  // Геттеры для совместимости
  get products(): Product[] {
    return this.pagedResult()?.data || [];
  }
}