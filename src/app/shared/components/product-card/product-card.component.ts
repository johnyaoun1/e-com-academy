
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
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
  @Input() isInCart = false;          
  @Input() cartQuantity = 0;          
  
  @Output() addToCart = new EventEmitter<void>();           
  @Output() removeFromCart = new EventEmitter<void>();      
  @Output() updateCartQuantity = new EventEmitter<number>(); 
  
  // Local state for standalone mode
  localIsInCart = false;
  localCartQuantity = 0;
  isAddingToCart = false;
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private cartService: CartService
  ) {}

  ngOnInit() {
    console.log('🔍 ProductCard Init:', {
      product: this.product.title,
      hasParentCartManagement: this.addToCart.observers.length > 0,
      isInCart: this.isInCart,
      cartQuantity: this.cartQuantity
    });

    // Subscribe to cart changes for local state management
    this.cartService.cartItems$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(cartItems => {
      this.updateLocalCartStatus(cartItems);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Use parent inputs if available, otherwise use local state
  get currentIsInCart(): boolean {
    return this.hasParentCartManagement() ? this.isInCart : this.localIsInCart;
  }

  get currentCartQuantity(): number {
    return this.hasParentCartManagement() ? this.cartQuantity : this.localCartQuantity;
  }

  private hasParentCartManagement(): boolean {
    return this.addToCart.observers.length > 0;
  }

  viewProduct() {
    console.log('👀 Viewing product:', this.product.title);
    this.router.navigate(['/products', this.product.id]);
  }

  quickView(event: Event) {
    event.stopPropagation();
    this.router.navigate(['/products', this.product.id]);
  }

  onAddToCart(event: Event) {
    event.stopPropagation();
    
    if (this.isAddingToCart) return;
    
    this.isAddingToCart = true;
    console.log('🛒 ProductCard - Adding to cart:', this.product.title);
    console.log('🔍 Has parent management:', this.hasParentCartManagement());
    
    if (this.hasParentCartManagement()) {
      console.log('🔄 Emitting addToCart to parent');
      this.addToCart.emit();
    } else {
      console.log('🔄 Adding to cart directly');
      this.cartService.addToCart(this.product, 1);
    }
    
    this.showAddToCartFeedback();
    
    setTimeout(() => {
      this.isAddingToCart = false;
    }, 500);
  }

  onRemoveFromCart(event: Event) {
    event.stopPropagation();
    console.log('🗑️ ProductCard - Removing from cart:', this.product.title);
    
    if (this.hasParentCartManagement()) {
      this.removeFromCart.emit();
    } else {
      this.cartService.removeFromCart(this.product.id);
    }
  }

  onUpdateQuantity(event: Event, change: number) {
    event.stopPropagation();
    console.log('📝 ProductCard - Updating quantity:', change);
    
    if (this.hasParentCartManagement()) {
      this.updateCartQuantity.emit(change);
    } else {
      const newQuantity = this.localCartQuantity + change;
      if (newQuantity <= 0) {
        this.cartService.removeFromCart(this.product.id);
      } else {
        this.cartService.updateQuantity(this.product.id, newQuantity);
      }
    }
  }

  private updateLocalCartStatus(cartItems: CartItem[]) {
    const cartItem = cartItems.find(item => item.product.id === this.product.id);
    this.localIsInCart = !!cartItem;
    this.localCartQuantity = cartItem ? cartItem.quantity : 0;
  }

  private showAddToCartFeedback() {
    const cardElement = document.querySelector(`[data-product-id="${this.product.id}"]`);
    if (cardElement) {
      cardElement.classList.add('added-to-cart');
      setTimeout(() => {
        cardElement.classList.remove('added-to-cart');
      }, 1000);
    }
  }

  getStarArray(): number[] {
    return [1, 2, 3, 4, 5];
  }

  isStarFilled(star: number): boolean {
    return star <= Math.round(this.product.rating.rate);
  }
}