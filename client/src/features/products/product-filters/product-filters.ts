import { Component, inject, OnInit, OnDestroy, output, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product-service';
import { ProductFilter, PriceRange } from '../../../types/product-filter';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-product-filters',
  imports: [CommonModule, FormsModule],
  templateUrl: './product-filters.html',
  styleUrl: './product-filters.css'
})
export class ProductFilters implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // Выходные события
  filtersChanged = output<ProductFilter>();

  // Состояние фильтров
  availableCategories = signal<string[]>([]);
  selectedCategories = signal<string[]>([]);
  searchQuery = signal<string>('');
  priceRange = signal<PriceRange>({});
  sortBy = signal<'name' | 'category' | 'article'>('name');
  sortOrder = signal<'asc' | 'desc'>('asc');
  
  // UI состояние
  isExpanded = signal<boolean>(true);
  isLoading = signal<boolean>(false);
  private isInitialized = signal<boolean>(false);
  
  // Computed свойства
  currentFilters = computed(() => {
    const filters: ProductFilter = {
      pageIndex: 1, // Всегда сбрасываем на первую страницу при изменении фильтров
      pageSize: 10, // Размер страницы по умолчанию
      categories: this.selectedCategories().length > 0 ? this.selectedCategories() : undefined,
      searchQuery: this.searchQuery().trim() || undefined,
      priceRange: (this.priceRange().min !== undefined || this.priceRange().max !== undefined) 
        ? this.priceRange() : undefined,
      sortBy: this.sortBy(),
      sortOrder: this.sortOrder(),
      currency: 'RUB'
    };
    return filters;
  });

  // Перемещаем effect в конструктор для правильного injection context
  constructor() {
    // Следим за изменениями фильтров и уведомляем родительский компонент
    // Но НЕ при первой инициализации, чтобы избежать двойной загрузки
    effect(() => {
      if (this.isInitialized()) {
        this.filtersChanged.emit(this.currentFilters());
      }
    });
  }

  ngOnInit(): void {
    this.setupSearchDebounce();
    
    // Загружаем категории и помечаем инициализацию как завершенную
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCategories(): void {
    this.isLoading.set(true);
    this.productService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.availableCategories.set(categories);
          this.isLoading.set(false);
          
          // Помечаем как инициализированный только после успешной загрузки категорий
          setTimeout(() => {
            this.isInitialized.set(true);
            console.log('ProductFilters - Initialization completed after categories loaded');
          }, 150);
        },
        error: (error) => {
          console.error('Error loading categories:', error);
          this.isLoading.set(false);
          
          // Даже при ошибке позволяем использовать фильтры
          setTimeout(() => {
            this.isInitialized.set(true);
            console.log('ProductFilters - Initialization completed with error');
          }, 150);
        }
      });
  }

  private setupSearchDebounce(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(query => {
        this.searchQuery.set(query);
      });
  }

  // Обработчики событий
  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchSubject.next(target.value);
  }

  onCategoryChange(category: string, isChecked: boolean): void {
    const current = this.selectedCategories();
    if (isChecked) {
      this.selectedCategories.set([...current, category]);
    } else {
      this.selectedCategories.set(current.filter(c => c !== category));
    }
  }

  onPriceRangeChange(): void {
    // Триггер для обновления computed значения
    this.priceRange.set({ ...this.priceRange() });
  }

  updatePriceRange(type: 'min' | 'max', event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value ? +target.value : undefined;
    const current = this.priceRange();
    
    if (type === 'min') {
      this.priceRange.set({ ...current, min: value });
    } else {
      this.priceRange.set({ ...current, max: value });
    }
    this.onPriceRangeChange();
  }

  updateSortBy(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.sortBy.set(target.value as 'name' | 'category' | 'article');
  }

  toggleSortOrder(): void {
    this.sortOrder.set(this.sortOrder() === 'asc' ? 'desc' : 'asc');
  }

  clearFilters(): void {
    this.selectedCategories.set([]);
    this.searchQuery.set('');
    this.priceRange.set({});
    this.sortBy.set('name');
    this.sortOrder.set('asc');
    this.searchSubject.next('');
  }

  toggleExpanded(): void {
    this.isExpanded.set(!this.isExpanded());
  }

  // Утилитные методы
  isCategorySelected(category: string): boolean {
    return this.selectedCategories().includes(category);
  }

  hasActiveFilters(): boolean {
    const filters = this.currentFilters();
    return !!(filters.categories?.length || 
             filters.searchQuery || 
             filters.priceRange?.min !== undefined || 
             filters.priceRange?.max !== undefined);
  }
}