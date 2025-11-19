import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../core/services/product-service';

interface ProductCharacteristic {
  label: string;
  value: string | number;
  unit?: string;
}

@Component({
  selector: 'app-product-description',
  imports: [CommonModule],
  templateUrl: './product-description.html',
  styleUrl: './product-description.css'
})
export class ProductDescription {
  protected productService = inject(ProductService);
    
  protected characteristics = computed(() => {
    const prod = this.productService.currentProduct();
    console.log('Computing characteristics for product:', prod );
    if (!prod) return [];
    
    const chars: ProductCharacteristic[] = [];
    
    // Артикул
    if (prod.article) {
      chars.push({ label: 'Article', value: prod.article });
    }
    
    // Категория
    if (prod.category) {
      chars.push({ label: 'Category', value: prod.category });
    }
    
    // Размеры
    chars.push({
      label: 'Dimensions (W×H×D)',
      value: `${prod.size.widthMm}×${prod.size.heightMm}×${prod.size.depthMm}`,
      unit: 'mm'
    });
    
    // Вес
    chars.push({
      label: 'Weight',
      value: prod.packagedWeight,
      unit: 'kg'
    });
    
    // Объем
    chars.push({
      label: 'Volume',
      value: prod.packagedVolume,
      unit: 'm³'
    });
    
    // Цвет
    if (prod.defaultColor) {
      chars.push({ label: 'Default Color', value: prod.defaultColor });
    }
    
    // Цена
    // const priceKindText = this.getPriceKindText(prod.price.kind);
    // chars.push({
    //   label: `Price (${priceKindText})`,
    //   value: `${prod.price.amount} ${prod.price.currency}`
    // });
    
    // Минимальное количество
    // if (prod.price.minQty > 1) {
    //   chars.push({
    //     label: 'Minimum Quantity',
    //     value: prod.price.minQty,
    //     unit: 'pcs'
    //   });
    // }
    
    return chars;
  });
}
