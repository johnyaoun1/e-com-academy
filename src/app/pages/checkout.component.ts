import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService, CartItem } from '../shared/services/cart.service';
import { OrderService } from '../shared/services/order.service';
import { InventoryService } from '../shared/services/inventory.service';
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
  private cartSubscription!: Subscription;

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private orderService: OrderService,
    private inventoryService: InventoryService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cartItems$ = this.cartService.cartItems$;
    this.cartSubscription = this.cartService.cartItems$.subscribe(() => {
      this.cartTotal = this.cartService.getCartTotal();
      this.checkStockAvailability();
    });

    this.initForm();
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
        cardNumber: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
        cardName: ['', Validators.required],
        expiryDate: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/)]],
        cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]]
      })
    });
  }

  private checkStockAvailability(): void {
    this.stockErrors = [];
    this.cartService.cartItems$.pipe(take(1)).subscribe((cartItems: CartItem[]) => {
      cartItems.forEach(item => {
        if (!this.inventoryService.isAvailable(item.product.id, item.quantity)) {
          const availableStock = this.inventoryService.getCurrentStock(item.product.id);
          this.stockErrors.push(
            `${item.product.title}: Only ${availableStock} items available, but you have ${item.quantity} in cart`
          );
        }
      });
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

    // Create a one-time subscription to get current cart items
    this.cartService.cartItems$.pipe(take(1)).subscribe((cartItems: CartItem[]) => {
      // Double-check stock availability before processing
      const stockCheckFailed = cartItems.some(item => 
        !this.inventoryService.isAvailable(item.product.id, item.quantity)
      );

      if (stockCheckFailed) {
        this.checkStockAvailability();
        this.isProcessing = false;
        return;
      }

      // Reduce inventory for each item
      let inventoryUpdateFailed = false;
      cartItems.forEach(item => {
        if (!this.inventoryService.reduceStock(item.product.id, item.quantity)) {
          inventoryUpdateFailed = true;
        }
      });

      if (inventoryUpdateFailed) {
        this.checkStockAvailability();
        this.isProcessing = false;
        return;
      }

      const order = {
        id: Date.now(),
        customerName: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
        email: shippingInfo.email,
        total: this.cartTotal,
        date: new Date().toISOString(),
        status: 'Processing' as const,
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
        items: cartItems.map((item: CartItem) => ({
          productId: item.product.id,
          name: item.product.title,
          quantity: item.quantity,
          price: item.product.price,
          image: item.product.image
        }))
      };

      // Add order to service
      this.orderService.addOrder(order);

      // Use a delay to ensure the cart is cleared after the order is placed
      setTimeout(() => {
        this.cartService.clearCart();
        this.isProcessing = false;
      }, 500); // Delay for 500ms

      // Navigate to success page
      this.router.navigate(['/order-success'], {
        state: { order }
      });
    });
  }

  private getCardType(cardNumber: string): string {
    // Remove all non-digit characters (spaces, dashes, etc.)
    const cleanedNumber = cardNumber.replace(/\D/g, '');
    
    // If empty after cleaning, return "Unknown"
    if (cleanedNumber.length === 0) return 'Unknown';
    
    // Basic card type detection
    if (cleanedNumber.startsWith('4')) return 'Visa';
    if (cleanedNumber.startsWith('5')) return 'Mastercard';
    if (cleanedNumber.startsWith('3')) return 'American Express';
    
    return 'Generic Card';
  }
}