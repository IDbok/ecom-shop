import { Component, input, output, computed } from '@angular/core';
import { PagedResult } from '../../types/product-filter';

@Component({
  selector: 'app-pagination',
  imports: [],
  templateUrl: './pagination.html',
  styleUrl: './pagination.css'
})
export class Pagination<T> {
  // Входные данные
  pagedData = input.required<PagedResult<T>>();
  maxPagesToShow = input<number>(5);
  
  // События
  pageChanged = output<number>();
  pageSizeChanged = output<number>();
  
  // Вычисляемые свойства
  protected startPage = computed(() => {
    const currentPage = this.pagedData().pageIndex;
    const maxPages = this.maxPagesToShow();
    const totalPages = this.pagedData().totalPages;
    
    let start = Math.max(1, currentPage - Math.floor(maxPages / 2));
    let end = Math.min(totalPages, start + maxPages - 1);
    
    if (end - start + 1 < maxPages) {
      start = Math.max(1, end - maxPages + 1);
    }
    
    return start;
  });
  
  protected endPage = computed(() => {
    const start = this.startPage();
    const maxPages = this.maxPagesToShow();
    const totalPages = this.pagedData().totalPages;
    
    return Math.min(totalPages, start + maxPages - 1);
  });
  
  protected pages = computed(() => {
    const start = this.startPage();
    const end = this.endPage();
    const pages: number[] = [];
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  });
  
  protected showFirstPage = computed(() => this.startPage() > 1);
  protected showLastPage = computed(() => this.endPage() < this.pagedData().totalPages);
  protected showFirstEllipsis = computed(() => this.startPage() > 2);
  protected showLastEllipsis = computed(() => this.endPage() < this.pagedData().totalPages - 1);
  
  onPageClick(page: number): void {
    if (page !== this.pagedData().pageIndex && page >= 1 && page <= this.pagedData().totalPages) {
      this.pageChanged.emit(page);
    }
  }
  
  onPrevious(): void {
    const currentPage = this.pagedData().pageIndex;
    if (currentPage > 1) {
      this.pageChanged.emit(currentPage - 1);
    }
  }
  
  onNext(): void {
    const currentPage = this.pagedData().pageIndex;
    if (currentPage < this.pagedData().totalPages) {
      this.pageChanged.emit(currentPage + 1);
    }
  }
  
  onFirst(): void {
    this.pageChanged.emit(1);
  }
  
  onLast(): void {
    this.pageChanged.emit(this.pagedData().totalPages);
  }
  
  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newPageSize = parseInt(target.value);
    this.pageSizeChanged.emit(newPageSize);
  }
}