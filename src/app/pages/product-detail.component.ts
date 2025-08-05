// product-detail.component.ts - Complete version with all functionality
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService, Product } from '../shared/services/product.service';
import { CartService, CartItem } from '../shared/services/cart.service';
import { Observable, switchMap, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  product$!: Observable<Product>;
  similarProducts$!: Observable<Product[]>;
  quantity = 1;
  
  // Cart status
  isInCart = false;
  cartQuantity = 0;
  isAddingToCart = false;
  
  // UI state
  activeTab = 'description';
  
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService
  ) {}

  ngOnInit() {
    this.product$ = this.route.params.pipe(
      switchMap(params => this.productService.getProductById(+params['id']))
    );

    this.similarProducts$ = this.product$.pipe(
      switchMap(product => this.productService.getSimilarProducts(product))
    );

    // Subscribe to cart changes to update status
    this.cartService.cartItems$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(cartItems => {
      this.product$.pipe(takeUntil(this.destroy$)).subscribe(product => {
        if (product) {
          this.updateCartStatus(cartItems, product.id);
        }
      });
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Quantity controls
  increaseQuantity() {
    this.quantity++;
  }

  decreaseQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  onQuantityChange(quantity: number) {
    this.quantity = quantity;
  }

  // Cart actions
  addToCart(product: Product) {
    if (this.isAddingToCart) return;
    
    this.isAddingToCart = true;
    console.log('🛒 Adding to cart:', product.title, 'Quantity:', this.quantity);
    
    this.cartService.addToCart(product, this.quantity);
    
    // Reset loading state
    setTimeout(() => {
      this.isAddingToCart = false;
    }, 500);
  }

  removeFromCart(product: Product) {
    console.log('🗑️ Removing from cart:', product.title);
    this.cartService.removeFromCart(product.id);
  }

  updateCartQuantity(product: Product, change: number) {
    const newQuantity = this.cartQuantity + change;
    if (newQuantity <= 0) {
      this.removeFromCart(product);
    } else {
      this.cartService.updateQuantity(product.id, newQuantity);
    }
  }

  // Navigation
  goBack() {
    this.router.navigate(['/products']);
  }

  // Private methods
  private updateCartStatus(cartItems: CartItem[], productId: number) {
    const cartItem = cartItems.find(item => item.product.id === productId);
    this.isInCart = !!cartItem;
    this.cartQuantity = cartItem ? cartItem.quantity : 0;
    
    // Update quantity selector to match cart quantity if item is in cart
    if (this.isInCart && this.quantity === 1) {
      this.quantity = this.cartQuantity;
    }
  }
}