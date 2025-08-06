import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../../auth/services/auth.service';
import { Observable } from 'rxjs';
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
    this.cartCount$ = this.cartService.cartItems$.pipe(
      map(() => this.cartService.getCartItemCount())
    );

    this.cartTotal$ = this.cartService.cartItems$.pipe(
      map(() => this.cartService.getCartTotal())
    );

    this.userInfo$ = this.authService.currentUser;
  }

  ngOnInit(): void {}

  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  // Debug method - call from browser console
  showCartInfo(): void {
    this.cartService.cartItems$.subscribe(items => {
      console.log('🛒 Current Cart Info:', items);
    });
  }
}