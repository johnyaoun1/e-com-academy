// cart.service.ts - Updated your existing service for user-specific carts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Product } from './product.service';
import { AuthService } from '../../auth/services/auth.service';

export interface CartItem {
  product: Product;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems = new BehaviorSubject<CartItem[]>([]);
  public cartItems$ = this.cartItems.asObservable();
  private currentUserId: string | null = null;

  constructor(private authService: AuthService) {
    // Subscribe to auth changes to load user-specific cart
    this.authService.currentUser.subscribe(user => {
      if (user) {
        this.currentUserId = user.id.toString();
        this.loadUserCart();
        console.log('🔄 Switched to cart for user:', user.email);
      } else {
        this.currentUserId = null;
        this.clearCartItems();
        console.log('🔄 User logged out, cart cleared');
      }
    });
  }

  // Load cart specific to current user
  private loadUserCart(): void {
    if (!this.currentUserId) return;
    
    const cartKey = `cart_user_${this.currentUserId}`;
    const savedCart = localStorage.getItem(cartKey);
    
    if (savedCart) {
      const cartItems = JSON.parse(savedCart);
      this.cartItems.next(cartItems);
      console.log(`📦 Loaded cart for user ${this.currentUserId}:`, cartItems.length, 'items');
    } else {
      this.cartItems.next([]);
      console.log(`📦 No existing cart found for user ${this.currentUserId}, starting fresh`);
    }
  }

  // Save cart specific to current user
  private saveUserCart(): void {
    if (!this.currentUserId) return;
    
    const cartKey = `cart_user_${this.currentUserId}`;
    const currentItems = this.cartItems.value;
    localStorage.setItem(cartKey, JSON.stringify(currentItems));
    console.log(`💾 Saved cart for user ${this.currentUserId}:`, currentItems.length, 'items');
  }

  // Clear cart items (for logout)
  private clearCartItems(): void {
    this.cartItems.next([]);
  }

  addToCart(product: Product, quantity: number = 1) {
    if (!this.currentUserId) {
      console.warn('⚠️ Cannot add to cart: User not logged in');
      return;
    }

    const currentItems = this.cartItems.value;
    const existingItemIndex = currentItems.findIndex(item => item.product.id === product.id);

    if (existingItemIndex > -1) {
      currentItems[existingItemIndex].quantity += quantity;
      console.log(`📦 Updated quantity for ${product.title}: ${currentItems[existingItemIndex].quantity}`);
    } else {
      currentItems.push({ product, quantity });
      console.log(`✅ Added to cart: ${product.title} (User: ${this.currentUserId})`);
    }

    this.updateCart(currentItems);
  }

  updateQuantity(productId: number, quantity: number) {
    if (!this.currentUserId) return;

    const currentItems = this.cartItems.value;
    const itemIndex = currentItems.findIndex(item => item.product.id === productId);

    if (itemIndex > -1) {
      if (quantity <= 0) {
        currentItems.splice(itemIndex, 1);
        console.log(`🗑️ Removed from cart: Product ${productId} (User: ${this.currentUserId})`);
      } else {
        currentItems[itemIndex].quantity = quantity;
        console.log(`🔄 Updated quantity: Product ${productId} = ${quantity} (User: ${this.currentUserId})`);
      }
      this.updateCart(currentItems);
    }
  }

  removeFromCart(productId: number) {
    if (!this.currentUserId) return;

    const currentItems = this.cartItems.value.filter(item => item.product.id !== productId);
    console.log(`🗑️ Removed from cart: Product ${productId} (User: ${this.currentUserId})`);
    this.updateCart(currentItems);
  }

  clearCart() {
    if (!this.currentUserId) return;

    console.log(`🧹 Cleared cart for user ${this.currentUserId}`);
    this.updateCart([]);
  }

  getCartTotal(): number {
    return this.cartItems.value.reduce((total, item) => 
      total + (item.product.price * item.quantity), 0
    );
  }

  getCartItemCount(): number {
    return this.cartItems.value.reduce((count, item) => count + item.quantity, 0);
  }

  // New helper methods for product cards
  isInCart(productId: number): boolean {
    return this.cartItems.value.some(item => item.product.id === productId);
  }

  getItemQuantity(productId: number): number {
    const item = this.cartItems.value.find(item => item.product.id === productId);
    return item ? item.quantity : 0;
  }

  private updateCart(items: CartItem[]) {
    this.cartItems.next(items);
    this.saveUserCart(); // Now saves per user instead of global
  }

  // Debug method to see current user's cart
  getCurrentUserCartInfo(): {userId: string | null, itemCount: number, total: number} {
    return {
      userId: this.currentUserId,
      itemCount: this.getCartItemCount(),
      total: this.getCartTotal()
    };
  }
}