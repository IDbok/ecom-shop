// product-filter.ts

export interface PriceRange {
  min?: number;
  max?: number;
}

export interface PaginationParams {
  pageIndex: number;
  pageSize: number;
}

export interface ProductFilter extends PaginationParams {
  categories?: string[];
  priceRange?: PriceRange;
  searchQuery?: string;
  sortBy?: 'name' | 'category' | 'article' | 'price';
  sortOrder?: 'asc' | 'desc';
  currency?: string;
}

export interface PagedResult<T> {
  pageIndex: number;
  pageSize: number;
  count: number;
  data: T[];
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  firstItemIndex: number;
  lastItemIndex: number;
}

export interface FilterOptions {
  availableCategories: string[];
  priceRange: {
    min: number;
    max: number;
  };
  currencies: string[];
}

export interface ProductFilterState {
  filters: ProductFilter;
  isLoading: boolean;
  totalCount?: number;
}

// Для удобства работы с query параметрами
export interface ProductFilterQuery {
  categories?: string; // comma-separated values 
  minPrice?: string;
  maxPrice?: string;
  searchQuery?: string;
  sortBy?: string;
  sortOrder?: string;
  currency?: string;
  pageIndex?: string;
  pageSize?: string;
}