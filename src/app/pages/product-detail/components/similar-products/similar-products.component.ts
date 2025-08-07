// src/app/shared/components/similar-products/similar-products.component.ts

import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Product } from '../../../../shared/services/product.service';
import { CartService, CartItem } from '../../../../shared/services/cart.service';

@Component({
  selector: 'app-similar-products',
  templateUrl: './similar-products.component.html',
  styleUrls: ['./similar-products.component.scss']
})
export class SimilarProductsComponent implements OnInit, OnDestroy {
  @Input() products: Product[] | null = [];
  
  cartItems: CartItem[] = [];
  private destroy$ = new Subject<void>();

  constructor(private cartService: CartService) {}

  ngOnInit() {
    // 🔍 DEBUG: Check if products are being received
    console.log('🔍 Similar Products Component - Products received:', this.products);
    
    // Subscribe to cart changes to track which products are in cart
    this.cartService.cartItems$
      .pipe(takeUntil(this.destroy$))
      .subscribe(items => {
        console.log('🔍 Similar Products - Cart items updated:', items);
        this.cartItems = items;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Check if a product is in the cart
  isProductInCart(product: Product): boolean {
    const inCart = this.cartItems.some(item => item.product.id === product.id);
    console.log(`🔍 Product ${product.title} in cart:`, inCart);
    return inCart;
  }

  // Get quantity of a product in cart
  getProductCartQuantity(product: Product): number {
    const cartItem = this.cartItems.find(item => item.product.id === product.id);
    const quantity = cartItem ? cartItem.quantity : 0;
    console.log(`🔍 Product ${product.title} quantity:`, quantity);
    return quantity;
  }

  // Handle adding product to cart
  onAddToCart(product: Product) {
    console.log('🛒 Similar Products - Adding to cart:', product.title);
    this.cartService.addToCart(product, 1);
  }

  // Handle removing product from cart
  onRemoveFromCart(product: Product) {
    console.log('🗑️ Similar Products - Removing from cart:', product.title);
    this.cartService.removeFromCart(product.id);
  }
trackByProductId(index: number, product: Product): number {
  return product.id;
}
  // Handle updating cart quantity
  onUpdateCartQuantity(product: Product, change: number) {
    console.log('📝 Similar Products - Updating quantity:', product.title, 'change:', change);
    const currentItem = this.cartItems.find(item => item.product.id === product.id);
    if (currentItem) {
      const newQuantity = currentItem.quantity + change;
      if (newQuantity > 0) {
        this.cartService.updateQuantity(product.id, newQuantity);
      } else {
        this.cartService.removeFromCart(product.id);
      }
    }
  }
}