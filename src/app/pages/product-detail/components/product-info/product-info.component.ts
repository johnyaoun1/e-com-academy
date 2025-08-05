// product-info.component.ts - Enhanced with better cart integration
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
  styles: [`
    .product-info {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 20px;
    }

    .product-title {
      font-size: 28px;
      font-weight: 600;
      color: #333;
      margin: 0;
      line-height: 1.3;
    }

    .product-category {
      color: #666;
      font-size: 16px;
      text-transform: capitalize;
      margin: 0;
    }

    .product-rating {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .stars {
      display: flex;
      gap: 3px;

      i {
        font-size: 16px;
        color: #ddd;

        &.filled {
          color: #ffc107;
        }
      }
    }

    .rating-text {
      color: #666;
      font-size: 14px;
    }

    .product-price {
      display: flex;
      align-items: center;
      gap: 15px;
      flex-wrap: wrap;

      .price {
        font-size: 32px;
        font-weight: bold;
        color: #333;
      }
    }

    .in-cart-badge {
      background: #28a745;
      color: white;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;

      i {
        font-size: 12px;
      }
    }

    .product-description {
      p {
        font-size: 16px;
        line-height: 1.6;
        color: #555;
        margin: 0;
      }
    }

    .purchase-options {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }

    .quantity-selector {
      display: flex;
      align-items: center;
      gap: 15px;

      label {
        font-weight: 600;
        color: #333;
      }
    }

    .quantity-controls {
      display: flex;
      align-items: center;
      border: 2px solid #ddd;
      border-radius: 8px;
      overflow: hidden;

      .qty-btn {
        background: #f8f9fa;
        border: none;
        width: 40px;
        height: 40px;
        cursor: pointer;
        font-size: 16px;
        font-weight: bold;
        transition: background-color 0.3s;

        &:hover {
          background: #e9ecef;
        }
      }

      .quantity-display {
        padding: 0 20px;
        font-size: 16px;
        font-weight: bold;
        min-width: 60px;
        text-align: center;
        background: white;
      }
    }

    .cart-actions {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .add-to-cart-btn {
      background: #28a745;
      color: white;
      border: none;
      padding: 15px 30px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;

      &:hover:not(:disabled) {
        background: #218838;
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      &.update-cart {
        background: #007bff;

        &:hover:not(:disabled) {
          background: #0056b3;
        }
      }

      &.loading {
        pointer-events: none;
      }
    }

    .cart-management {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 15px;
      background: #e8f5e8;
      border-radius: 6px;
      border: 1px solid #d4edda;
    }

    .current-cart-info {
      font-weight: 600;
      color: #155724;
      text-align: center;
    }

    .cart-controls {
      display: flex;
      gap: 10px;
    }

    .cart-control-btn {
      flex: 1;
      padding: 8px 15px;
      border: none;
      border-radius: 5px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;

      &.decrease {
        background: #ffc107;
        color: #856404;

        &:hover {
          background: #e0a800;
        }
      }

      &.remove {
        background: #dc3545;
        color: white;

        &:hover {
          background: #c82333;
        }
      }
    }

    .product-tabs {
      margin-top: 20px;
    }

    .tab-headers {
      display: flex;
      border-bottom: 1px solid #ddd;

      button {
        background: none;
        border: none;
        padding: 15px 20px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 600;
        color: #666;
        border-bottom: 3px solid transparent;
        transition: all 0.3s;

        &:hover {
          color: #333;
        }

        &.active {
          color: #007bff;
          border-bottom-color: #007bff;
        }
      }
    }

    .tab-content {
      padding: 20px 0;
    }

    .details ul {
      list-style: none;
      padding: 0;
      margin: 0;

      li {
        padding: 8px 0;
        border-bottom: 1px solid #eee;

        &:last-child {
          border-bottom: none;
        }
      }
    }

    @media (max-width: 768px) {
      .product-price {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }

      .quantity-selector {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }

      .cart-controls {
        flex-direction: column;
      }

      .tab-headers {
        button {
          flex: 1;
          text-align: center;
        }
      }
    }
  `]
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