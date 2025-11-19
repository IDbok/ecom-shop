import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { ProductService } from '../../../core/services/product-service';
import { Product } from '../../../types/product';
import { ProductCard } from '../product-card/product-card';
import { ToastService } from '../../../core/services/toast-service';


@Component({
  selector: 'app-product-list',
  imports: [AsyncPipe, ProductCard],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css'
})
export class ProductList {
  private productService = inject(ProductService);
  protected products$ : Observable<Product[]> = this.getProducts();
  // private toastService = inject(ToastService); // проблема при использовании тоста

  getProducts(): Observable<Product[]> {
    console.log('Fetching products...');
    const products = this.productService.getProducts();
    products.subscribe(p => console.log('Fetched products:', p));
    return products;
  }
}