import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
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
  private isUpdating = false;  // Flag to prevent multiple updates

  constructor(private authService: AuthService) {
    this.authService.currentUser.pipe(
      distinctUntilChanged()
    ).subscribe(user => {
      if (user) {
        this.currentUserId = user.id.toString();
        this.loadUserCart();
      } else {
        this.currentUserId = null;
        this.cartItems.next([]);
      }
    });
  }

  private loadUserCart(): void {
    if (!this.currentUserId) return;
    
    const cartKey = `cart_user_${this.currentUserId}`;
    const savedCart = localStorage.getItem(cartKey);
    
    if (savedCart) {
      try {
        const cartItems = JSON.parse(savedCart);
        this.cartItems.next(cartItems);
      } catch (e) {
        localStorage.removeItem(cartKey);
        this.cartItems.next([]);
      }
    }
  }

  private saveUserCart(): void {
    if (!this.currentUserId || this.isUpdating) return;
    
    this.isUpdating = true; // Prevent further updates during save
    try {
      const cartKey = `cart_user_${this.currentUserId}`;
      localStorage.setItem(cartKey, JSON.stringify(this.cartItems.value));
    } catch (e) {
      console.error('Failed to save cart', e);
    } finally {
      this.isUpdating = false;
    }
  }

  // Public methods
  addToCart(product: Product, quantity: number = 1) {
    if (!this.currentUserId) return;

    const currentItems = [...this.cartItems.value];
    const existingItemIndex = currentItems.findIndex(item => item.product.id === product.id);

    if (existingItemIndex > -1) {
      currentItems[existingItemIndex].quantity += quantity;
    } else {
      currentItems.push({ product, quantity });
    }

    this.cartItems.next(currentItems);
    this.saveUserCart();
  }

  updateQuantity(productId: number, quantity: number) {
    if (!this.currentUserId) return;

    const currentItems = [...this.cartItems.value];
    const itemIndex = currentItems.findIndex(item => item.product.id === productId);

    if (itemIndex > -1) {
      if (quantity <= 0) {
        currentItems.splice(itemIndex, 1);
      } else {
        currentItems[itemIndex].quantity = quantity;
      }
      this.cartItems.next(currentItems);
      this.saveUserCart();
    }
  }

  removeFromCart(productId: number) {
    if (!this.currentUserId) return;

    const currentItems = this.cartItems.value.filter(item => item.product.id !== productId);
    this.cartItems.next(currentItems);
    this.saveUserCart();
  }

  clearCart(): void {
    if (!this.currentUserId || this.isUpdating) return;
    
    this.isUpdating = true; // Prevent further updates
    try {
      this.cartItems.next([]); // Clear the cart
      this.saveUserCart();
    } catch (e) {
      console.error('Failed to clear cart', e);
    } finally {
      this.isUpdating = false;
    }
  }

  getCartTotal(): number {
    return this.cartItems.value.reduce((total, item) => 
      total + (item.product.price * item.quantity), 0);
  }

  getCartItemCount(): number {
    return this.cartItems.value.reduce((count, item) => count + item.quantity, 0);
  }

  isInCart(productId: number): boolean {
    return this.cartItems.value.some(item => item.product.id === productId);
  }

  getItemQuantity(productId: number): number {
    const item = this.cartItems.value.find(item => item.product.id === productId);
    return item ? item.quantity : 0;
  }
}
