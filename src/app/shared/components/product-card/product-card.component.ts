// product-card.component.ts - Updated to work with your existing cart service
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Product } from '../../services/product.service';
import { CartService, CartItem } from '../../services/cart.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss']
})
export class ProductCardComponent implements OnInit, OnDestroy {
  @Input() product!: Product;
  
  isInCart = false;
  cartQuantity = 0;
  isAddingToCart = false;
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private cartService: CartService
  ) {}

  ngOnInit() {
    // Subscribe to cart changes to update button state
    this.cartService.cartItems$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(cartItems => {
      this.updateCartStatus(cartItems);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  viewProduct() {
    console.log('👀 Viewing product:', this.product.title);
    this.router.navigate(['/products', this.product.id]);
  }

  quickView(event: Event) {
    event.stopPropagation();
    console.log('👁️ Quick view:', this.product.title);
    
    // Navigate to product detail page
    this.router.navigate(['/products', this.product.id]);
  }

  addToCart(event: Event) {
    event.stopPropagation();
    
    if (this.isAddingToCart) return; // Prevent double clicks
    
    this.isAddingToCart = true;
    console.log('🛒 Adding to cart:', this.product.title);
    
    // Add to cart with quantity 1
    this.cartService.addToCart(this.product, 1);
    
    // Show visual feedback
    this.showAddToCartFeedback();
    
    // Reset loading state
    setTimeout(() => {
      this.isAddingToCart = false;
    }, 500);
  }

  removeFromCart(event: Event) {
    event.stopPropagation();
    console.log('🗑️ Removing from cart:', this.product.title);
    
    this.cartService.removeFromCart(this.product.id);
  }

  updateQuantity(event: Event, change: number) {
    event.stopPropagation();
    
    const newQuantity = this.cartQuantity + change;
    if (newQuantity <= 0) {
      this.removeFromCart(event);
    } else {
      this.cartService.updateQuantity(this.product.id, newQuantity);
    }
  }

  private updateCartStatus(cartItems: CartItem[]) {
    const cartItem = cartItems.find(item => item.product.id === this.product.id);
    this.isInCart = !!cartItem;
    this.cartQuantity = cartItem ? cartItem.quantity : 0;
  }

  private showAddToCartFeedback() {
    // Add CSS class for animation
    const cardElement = document.querySelector(`[data-product-id="${this.product.id}"]`);
    if (cardElement) {
      cardElement.classList.add('added-to-cart');
      setTimeout(() => {
        cardElement.classList.remove('added-to-cart');
      }, 1000);
    }
  }

  // Helper method to get star array for rating
  getStarArray(): number[] {
    return [1, 2, 3, 4, 5];
  }

  // Helper method to check if star should be filled
  isStarFilled(star: number): boolean {
    return star <= Math.round(this.product.rating.rate);
  }
}