// src/app/checkout/checkout.component.ts - Fixed for your User interface
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService, CartItem } from '../shared/services/cart.service';
import { OrderService, Order, OrderItem } from '../shared/services/order.service';
import { AuthService } from '../auth/services/auth.service';
import { Observable, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit, OnDestroy {
  checkoutForm!: FormGroup;
  cartItems$!: Observable<CartItem[]>;
  cartTotal = 0;
  currentStep = 1;
  isProcessing = false;
  stockErrors: string[] = [];
  
  // Payment success modal state
  showSuccessModal = false;
  orderDetails: any = null;

  private cartSubscription!: Subscription;

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cartItems$ = this.cartService.cartItems$;
    this.cartSubscription = this.cartService.cartItems$.subscribe(() => {
      this.cartTotal = this.cartService.getCartTotal();
      this.checkStockAvailability();
    });

    this.initForm();
    this.prefillUserData();
  }

  ngOnDestroy() {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
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
        cardNumber: ['4242424242424242', [Validators.required, Validators.pattern(/^\d{16}$/)]],
        cardName: ['', Validators.required],
        expiryDate: ['12/25', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/)]],
        cvv: ['123', [Validators.required, Validators.pattern(/^\d{3,4}$/)]]
      })
    });
  }

  prefillUserData() {
    // Prefill with current user data if available - FIXED property names
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.checkoutForm.patchValue({
        shipping: {
          firstName: currentUser.firstname || '', // Fixed: using 'firstname' not 'firstName'
          lastName: currentUser.lastname || '',   // Fixed: using 'lastname' not 'lastName'
          email: currentUser.email || ''
        },
        payment: {
          cardName: `${currentUser.firstname || ''} ${currentUser.lastname || ''}`.trim() // Fixed: using correct property names
        }
      });
    }
  }

  private checkStockAvailability(): void {
    this.stockErrors = [];
    // Add your stock check logic here if needed
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

  canPlaceOrder(): boolean {
    return this.checkoutForm.valid && this.stockErrors.length === 0 && !this.isProcessing;
  }

  placeOrder() {
    if (!this.canPlaceOrder()) {
      return;
    }

    this.isProcessing = true;
    const shippingInfo = this.checkoutForm.value.shipping;
    const paymentInfo = this.checkoutForm.value.payment;

    // Get current user for the order
    const currentUser = this.authService.currentUserValue;
    const userEmail = currentUser?.email || shippingInfo.email;

    this.cartService.cartItems$.pipe(take(1)).subscribe((cartItems: CartItem[]) => {
      const orderId = Date.now();
      const taxAmount = this.cartTotal * 0.08;
      const totalWithTax = this.cartTotal + taxAmount;
      
      // Create order using your existing Order interface
      const order: Order = {
        id: orderId,
        customerName: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
        email: userEmail,
        total: totalWithTax,
        date: new Date().toISOString(),
        status: 'Processing',
        shippingAddress: {
          address: shippingInfo.address,
          city: shippingInfo.city,
          state: shippingInfo.state,
          zipCode: shippingInfo.zipCode,
          country: shippingInfo.country
        },
        paymentMethod: {
          cardLast4: paymentInfo.cardNumber.slice(-4),
          cardType: this.getCardType(paymentInfo.cardNumber)
        },
        items: cartItems.map((item: CartItem): OrderItem => ({
          productId: item.product.id,
          name: item.product.title,
          quantity: item.quantity,
          price: item.product.price,
          image: item.product.image
        }))
      };

      // Save order details for the modal
      this.orderDetails = {
        orderId: orderId,
        total: totalWithTax,
        subtotal: this.cartTotal,
        tax: taxAmount,
        customerName: order.customerName,
        email: userEmail,
        itemCount: cartItems.length,
        paymentMethod: order.paymentMethod,
        estimatedDelivery: this.getEstimatedDelivery(),
        items: order.items
      };

      // Simulate payment processing delay
      setTimeout(() => {
        // Add order using your existing OrderService
        this.orderService.addOrder(order);

        // Show success modal
        this.showSuccessModal = true;
        this.isProcessing = false;

        // Clear cart after short delay
        setTimeout(() => {
          this.cartService.clearCart();
        }, 500);
      }, 2000); // 2 second delay to simulate payment processing
    });
  }

  // Modal control methods
  closeSuccessModal() {
    this.showSuccessModal = false;
    this.router.navigate(['/products']);
  }

  goToProfile() {
    this.showSuccessModal = false;
    this.router.navigate(['/profile'], { queryParams: { tab: 'orders' } });
  }

  continueShopping() {
    this.showSuccessModal = false;
    this.router.navigate(['/products']);
  }

  viewOrderDetails() {
    this.showSuccessModal = false;
    this.router.navigate(['/profile'], { queryParams: { tab: 'orders' } });
  }

  private getCardType(cardNumber: string): string {
    const cleanedNumber = cardNumber.replace(/\D/g, '');
    
    if (cleanedNumber.length === 0) return 'Unknown';
    
    // Basic card type detection
    if (cleanedNumber.startsWith('4')) return 'Visa';
    if (cleanedNumber.startsWith('5')) return 'Mastercard';
    if (cleanedNumber.startsWith('3')) return 'American Express';
    
    return 'Generic Card';
  }

  private getEstimatedDelivery(): string {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 3); // 3 days from now
    return deliveryDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  // Utility methods for form validation display
  isFieldInvalid(fieldPath: string): boolean {
    const field = this.checkoutForm.get(fieldPath);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldPath: string): string {
    const field = this.checkoutForm.get(fieldPath);
    if (field && field.invalid && field.touched) {
      if (field.errors?.['required']) return 'This field is required';
      if (field.errors?.['email']) return 'Please enter a valid email';
      if (field.errors?.['pattern']) {
        if (fieldPath.includes('cardNumber')) return 'Please enter a valid 16-digit card number';
        if (fieldPath.includes('expiryDate')) return 'Please use MM/YY format';
        if (fieldPath.includes('cvv')) return 'Please enter a valid CVV';
      }
    }
    return '';
  }
}