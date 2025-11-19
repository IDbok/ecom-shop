import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../../types/product';

@Component({
  selector: 'app-product-card',
  imports: [RouterLink],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css'
})
export class ProductCard {
  product = input.required<Product>();
}
