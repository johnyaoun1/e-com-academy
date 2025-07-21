import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService, CartItem } from '../shared/services/cart.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {
  checkoutForm!: FormGroup;
  cartItems$!: Observable<CartItem[]>;
  cartTotal = 0;
  currentStep = 1;
  
  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cartItems$ = this.cartService.cartItems$;
    this.cartService.cartItems$.subscribe(() => {
      this.cartTotal = this.cartService.getCartTotal();
    });

    this.initForm();
  }

  initForm() {
    this.checkoutForm = this.fb.group({
      // Shipping Information
      shipping: this.fb.group({
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', Validators.required],
        address: ['', Validators.required],
        city: ['', Validators.required],
        state: ['', Validators.required],
        zipCode: ['', Validators.required],
        country: ['', Validators.required]
      }),
      // Payment Information
      payment: this.fb.group({
        cardNumber: ['', Validators.required],
        cardName: ['', Validators.required],
        expiryDate: ['', Validators.required],
        cvv: ['', Validators.required]
      })
    });
  }

  nextStep() {
    if (this.currentStep === 1 && this.checkoutForm.get('shipping')?.valid) {
      this.currentStep = 2;
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  placeOrder() {
    if (this.checkoutForm.valid) {
      // Simulate order placement
      console.log('Order placed:', this.checkoutForm.value);
      
      // Clear cart
      this.cartService.clearCart();
      
      // Navigate to success page or home
      this.router.navigate(['/'], { 
        queryParams: { orderSuccess: true } 
      });
    }
  }
}