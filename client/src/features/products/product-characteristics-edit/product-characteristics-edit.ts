import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Product, UpdateProductDto, Dimensions } from '../../../types/product';
import { ProductService } from '../../../core/services/product-service';
import { consumerPollProducersForChange } from '@angular/core/primitives/signals';
import { firstValueFrom } from 'rxjs/internal/firstValueFrom';

interface ProductFormData extends UpdateProductDto {
  size: Dimensions;
  name: string;
  packagedWeight: number;
  packagedVolume: number;
}

@Component({
  selector: 'app-product-characteristics-edit',
  imports: [CommonModule, FormsModule],
  templateUrl: './product-characteristics-edit.html',
  styleUrl: './product-characteristics-edit.css'
})
export class ProductCharacteristicsEdit implements OnInit {
  private productService = inject(ProductService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  
  // Используем продукт из глобального хранилища
  protected product = signal(this.productService.currentProduct() || null);
  
  // Form state
  formData = signal<ProductFormData>({
    id: 0,
    article: '',
    name: '',
    packagedWeight: 0,
    packagedVolume: 0,
    size: { widthMm: 0, heightMm: 0, depthMm: 0 },
    defaultColor: '',
    category: '',
    description: ''
  });
  
  // UI state
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  
  // Computed properties
  isFormValid = computed(() => {
    const data = this.formData();
    return !!(
      data.name?.trim() &&
      data.size.widthMm > 0 &&
      data.size.heightMm > 0 &&
      data.size.depthMm > 0 &&
      (!data.defaultColor || this.isValidColorFormat())
    );
  });
  
  ngOnInit(): void {
    // Получаем продукт из глобального хранилища
    const product = this.product();
    if (product) {
      this.initializeForm(product);
    }
  }
  
  private initializeForm(product: Product): void {
    this.formData.set({
      id: product.id,
      article: product.article || '',
      name: product.name,
      packagedWeight: product.packagedWeight,
      packagedVolume: product.packagedVolume,
      size: { ...product.size },
      defaultColor: product.defaultColor || '',
      category: product.category || '',
      description: product.description || ''
    });
    
    // Clear messages
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }
  
  isValidColorFormat(): boolean {
    const color = this.formData().defaultColor;
    if (!color) return true;
    return /^RAL\s?\d{4}$/.test(color.trim());
  }
  
  async saveChanges(): Promise<void> {
    if (!this.isFormValid() || this.isSaving()) {
      return;
    }
    
    const data = this.formData();
    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    
    console.log('Saving product changes with data:', data);

    try {
      // Create update DTO
      const updateDto: UpdateProductDto = {
        id: data.id,
        article: data.article || undefined,
        name: data.name,
        packagedWeight: data.packagedWeight,
        packagedVolume: data.packagedVolume,
        size: data.size,
        defaultColor: data.defaultColor || undefined,
        category: data.category || undefined,
        description: data.description || undefined
      };
      
      console.log('Updating product with data:', updateDto);
      
      // Call service to update product
      await firstValueFrom(this.productService.updateProduct(updateDto))

      await this.productService.refreshCurrentProduct(data.id);

      // const currentProduct = this.productService.currentProduct();
      // if (currentProduct) {
      //   const updatedProduct: Product = {
      //     ...currentProduct,
      //     ...updateDto
      //   };
      //   console.log('Updating local product state with:', updatedProduct);
      //   this.productService.currentProduct.set(updatedProduct);
      // }

      this.successMessage.set('Changes saved successfully!');

      // Navigate back after showing success message
      setTimeout(() => {
        this.router.navigate(['../description'], { relativeTo: this.route });
      }, 100);
      
    } catch (error: any) {
      console.error('Error updating product:', error);
      this.errorMessage.set(
        error?.error?.message || 
        error?.message || 
        'An error occurred while updating the product. Please try again.'
      );
    } finally {
      this.isSaving.set(false);
    }
  }
  
  cancelEdit(): void {
    // Reset form to original values
    const prod = this.product();
    if (prod) {
      this.initializeForm(prod);
    }
    
    // Navigate back to description
    this.router.navigate(['../description'], { relativeTo: this.route });
  }
  
  // Helper method to update nested form data
  updateFormData<K extends keyof ProductFormData>(
    field: K, 
    value: ProductFormData[K]
  ): void {
    this.formData.update(current => ({
      ...current,
      [field]: value
    }));
  }
  
  // Helper method for handling input events
  onInputChange(field: keyof ProductFormData, event: Event): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    const value = target.type === 'number' ? +target.value : target.value;
    this.updateFormData(field as any, value as any);
  }
  
  // Helper method to update size dimensions
  updateDimension(
    dimension: keyof Dimensions, 
    value: number
  ): void {
    this.formData.update(current => ({
      ...current,
      size: {
        ...current.size,
        [dimension]: value
      }
    }));
  }
  
  // Helper method for handling dimension input events
  onDimensionChange(dimension: keyof Dimensions, event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = +target.value;
    this.updateDimension(dimension, value);
  }
}
