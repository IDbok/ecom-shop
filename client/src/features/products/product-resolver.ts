import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { EMPTY } from 'rxjs';
import { Product } from '../../types/product';
import { ProductService } from '../../core/services/product-service';

export const productResolver: ResolveFn<Product> = (route) => {
  const productService = inject(ProductService);
  const router = inject(Router);
  const productId = route.paramMap.get('id');
  
  // попытка преобразовать productId в число
  const id = productId ? Number(productId) : null;

  if(!id || isNaN(id)) {
    router.navigateByUrl('/not-found');
    return EMPTY;
  }

  return productService.getProduct(id);
};
