import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../shared/services/cart.service';
import { OrderService } from '../shared/services/order.service';
import { AuthService } from '../auth/services/auth.service';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {
  checkoutForm: FormGroup;
  cartTotal = 0;
  isProcessing = false;
  showSuccessModal = false;
  orderDetails: any = null;

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router
  ) {
    this.checkoutForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zipCode: ['', Validators.required],
      cardNumber: ['4242424242424242', Validators.required],
      cardName: ['', Validators.required],
      expiryDate: ['12/25', Validators.required],
      cvv: ['123', Validators.required],
      savePaymentMethod: [true] // Add checkbox to save payment method
    });
  }

  ngOnInit() {
    this.cartTotal = this.cartService.getCartTotal();
    this.prefillUserData();
  }

  prefillUserData() {
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.checkoutForm.patchValue({
        firstName: currentUser.firstname || '',
        lastName: currentUser.lastname || '',
        email: currentUser.email || '',
        cardName: `${currentUser.firstname || ''} ${currentUser.lastname || ''}`.trim()
      });
    }
  }

  placeOrder() {
    if (this.checkoutForm.invalid || this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    const formValue = this.checkoutForm.value;

    // Get cart items
    this.cartService.cartItems$.subscribe(cartItems => {
      const orderId = Date.now();
      const tax = this.cartTotal * 0.08;
      const total = this.cartTotal + tax;

      // Create payment method object
      const paymentMethod = {
        id: Date.now().toString(),
        type: this.getCardType(formValue.cardNumber).toLowerCase() as 'visa' | 'mastercard' | 'amex' | 'paypal',
        cardNumber: formValue.cardNumber,
        lastFour: formValue.cardNumber.slice(-4),
        expiryMonth: formValue.expiryDate.split('/')[0],
        expiryYear: formValue.expiryDate.split('/')[1],
        holderName: formValue.cardName,
        isDefault: false
      };

      // Create order
      const order = {
        id: orderId,
        customerName: `${formValue.firstName} ${formValue.lastName}`,
        email: formValue.email,
        total: total,
        date: new Date().toISOString(),
        status: 'Processing' as const,
        shippingAddress: {
          address: formValue.address,
          city: formValue.city,
          state: formValue.state,
          zipCode: formValue.zipCode,
          country: 'US'
        },
        paymentMethod: {
          cardLast4: formValue.cardNumber.slice(-4),
          cardType: this.getCardType(formValue.cardNumber)
        },
        items: cartItems.map(item => ({
          productId: item.product.id,
          name: item.product.title,
          quantity: item.quantity,
          price: item.product.price,
          image: item.product.image
        }))
      };

      // Save order details for modal
      this.orderDetails = {
        orderId: orderId,
        total: total,
        customerName: order.customerName,
        email: formValue.email,
        itemCount: cartItems.length,
        paymentMethod: paymentMethod
      };

      // Simulate processing time
      setTimeout(() => {
        // Save the order
        this.orderService.addOrder(order);

        // Save payment method if user checked the option
        if (formValue.savePaymentMethod) {
          this.savePaymentMethod(paymentMethod, formValue.email);
        }

        this.showSuccessModal = true;
        this.isProcessing = false;
        this.cartService.clearCart();
      }, 2000);
    }).unsubscribe();
  }

  // Save payment method to localStorage
  private savePaymentMethod(paymentMethod: any, userEmail: string) {
    try {
      // Get existing payment methods from localStorage
      const existingMethods = JSON.parse(localStorage.getItem('paymentMethods') || '[]');
      
      // Check if this card already exists for this user
      const cardExists = existingMethods.some((method: any) => 
        method.userEmail === userEmail && method.lastFour === paymentMethod.lastFour
      );

      if (!cardExists) {
        // Add user email to payment method for filtering
        const methodWithUser = {
          ...paymentMethod,
          userEmail: userEmail,
          dateAdded: new Date().toISOString()
        };

        // If this is the user's first payment method, make it default
        const userMethods = existingMethods.filter((method: any) => method.userEmail === userEmail);
        if (userMethods.length === 0) {
          methodWithUser.isDefault = true;
        }

        existingMethods.push(methodWithUser);
        localStorage.setItem('paymentMethods', JSON.stringify(existingMethods));
        
        console.log('✅ Payment method saved:', methodWithUser);
      }
    } catch (error) {
      console.error('❌ Error saving payment method:', error);
    }
  }

  getCardType(cardNumber: string): string {
    const cleanNumber = cardNumber.replace(/\D/g, '');
    if (cleanNumber.startsWith('4')) return 'Visa';
    if (cleanNumber.startsWith('5') || cleanNumber.startsWith('2')) return 'Mastercard';
    if (cleanNumber.startsWith('34') || cleanNumber.startsWith('37')) return 'American Express';
    if (cleanNumber.startsWith('6')) return 'Discover';
    return 'Card';
  }

  closeSuccessModal() {
    this.showSuccessModal = false;
    this.router.navigate(['/products']);
  }

  goToProfile() {
    this.showSuccessModal = false;
    this.router.navigate(['/profile'], { queryParams: { tab: 'payment' } });
  }

  continueShopping() {
    this.showSuccessModal = false;
    this.router.navigate(['/products']);
  }
}