
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Product } from '../../../../shared/services/product.service';

@Component({
  selector: 'app-product-info',
  template: `
    <div class="product-info">
      <h1 class="product-title">{{ product.title }}</h1>
      <p class="product-category">{{ product.category | titlecase }}</p>
      
      <div class="product-rating">
        <div class="stars">
          <i *ngFor="let star of [1,2,3,4,5]" 
             class="fas fa-star" 
             [class.filled]="star <= product.rating.rate"></i>
        </div>
        <span class="rating-text">
          {{ product.rating.rate }} ({{ product.rating.count }} reviews)
        </span>
      </div>

      <div class="product-price">
        <span class="price">{{ product.price | currencyFormat }}</span>
        <span *ngIf="isInCart" class="in-cart-badge">
          <i class="fas fa-check-circle"></i> In Cart ({{ cartQuantity }})
        </span>
      </div>

      <div class="product-description">
        <p>{{ product.description }}</p>
      </div>

      <!-- Purchase Options -->
      <div class="purchase-options">
        <!-- Quantity Selector (always show) -->
        <div class="quantity-selector">
          <label>Quantity:</label>
          <div class="quantity-controls">
            <button class="qty-btn" (click)="decreaseQuantity()">-</button>
            <span class="quantity-display">{{ quantity }}</span>
            <button class="qty-btn" (click)="increaseQuantity()">+</button>
          </div>
        </div>

        <!-- Cart Actions -->
        <div class="cart-actions">
          <!-- Add to Cart (when not in cart OR when adding more) -->
          <button 
            class="add-to-cart-btn primary"
            [class.loading]="isAddingToCart"
            [class.update-cart]="isInCart"
            (click)="onAddToCart()"
            [disabled]="isAddingToCart">
            <i *ngIf="!isAddingToCart && !isInCart" class="fas fa-shopping-cart"></i>
            <i *ngIf="!isAddingToCart && isInCart" class="fas fa-plus"></i>
            <i *ngIf="isAddingToCart" class="fas fa-spinner fa-spin"></i>
            <span *ngIf="!isAddingToCart && !isInCart">Add to Cart</span>
            <span *ngIf="!isAddingToCart && isInCart">Add More</span>
            <span *ngIf="isAddingToCart">Adding...</span>
          </button>

          <!-- Cart Management (when in cart) -->
          <div *ngIf="isInCart" class="cart-management">
            <div class="current-cart-info">
              <span>In Cart: {{ cartQuantity }} items</span>
            </div>
            
            <div class="cart-controls">
              <button 
                class="cart-control-btn decrease"
                (click)="onUpdateCartQuantity(-1)">
                <i class="fas fa-minus"></i>
                Remove One
              </button>
              
              <button 
                class="cart-control-btn remove"
                (click)="onRemoveFromCart()">
                <i class="fas fa-trash"></i>
                Remove All
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Product Features/Details -->
      <div class="product-tabs">
        <div class="tab-headers">
          <button 
            [class.active]="activeTab === 'description'"
            (click)="activeTab = 'description'">
            Description
          </button>
          <button 
            [class.active]="activeTab === 'details'"
            (click)="activeTab = 'details'">
            Details
          </button>
        </div>

        <div class="tab-content">
          <div *ngIf="activeTab === 'description'" class="description">
            <p>{{ product.description }}</p>
          </div>

          <div *ngIf="activeTab === 'details'" class="details">
            <ul>
              <li><strong>Category:</strong> {{ product.category | titlecase }}</li>
              <li><strong>Product ID:</strong> {{ product.id }}</li>
              <li><strong>Average Rating:</strong> {{ product.rating.rate }}/5</li>
              <li><strong>Total Reviews:</strong> {{ product.rating.count }}</li>
              <li><strong>Price:</strong> {{ product.price | currencyFormat }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./product-info.component.scss']
})
export class ProductInfoComponent {
  @Input() product!: Product;
  @Input() quantity = 1;
  @Input() isInCart = false;
  @Input() cartQuantity = 0;
  @Input() isAddingToCart = false;

  @Output() quantityChange = new EventEmitter<number>();
  @Output() addToCart = new EventEmitter<void>();
  @Output() removeFromCart = new EventEmitter<void>();
  @Output() updateCartQuantity = new EventEmitter<number>();

  activeTab = 'description';

  increaseQuantity() {
    this.quantity++;
    this.quantityChange.emit(this.quantity);
  }

  decreaseQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
      this.quantityChange.emit(this.quantity);
    }
  }

  onAddToCart() {
    this.addToCart.emit();
  }

  onRemoveFromCart() {
    this.removeFromCart.emit();
  }

  onUpdateCartQuantity(change: number) {
    this.updateCartQuantity.emit(change);
  }
}