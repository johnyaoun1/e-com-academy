// cart-header.component.ts - Updated your existing component
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../../auth/services/auth.service';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-cart-header',
  templateUrl: './cart-header.component.html',
  styleUrls: ['./cart-header.component.scss']
})
export class CartHeaderComponent implements OnInit {
  cartCount$: Observable<number>;
  cartTotal$: Observable<number>;
  userInfo$: Observable<any>;

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private router: Router
  ) {
    // Keep your existing observables
    this.cartCount$ = this.cartService.cartItems$.pipe(
      map(() => this.cartService.getCartItemCount())
    );

    this.cartTotal$ = this.cartService.cartItems$.pipe(
      map(() => this.cartService.getCartTotal())
    );

    // Add user info observable
    this.userInfo$ = this.authService.currentUser;
  }

  ngOnInit(): void {}

  goToCart(): void {
    // Navigate to cart page (create this route if you don't have it)
    this.router.navigate(['/cart']);
  }

  // Debug method - call from browser console
  showCartInfo(): void {
    console.log('🛒 Current Cart Info:', this.cartService.getCurrentUserCartInfo());
  }
}