// src/app/profile/profile.component.ts - Fixed to load real payment methods
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '../../auth/services/auth.service';
import { OrderService, Order } from '../../shared/services/order.service';
import { CartService } from '../../shared/services/cart.service';

export interface ProfileUser {
  id?: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  createdAt?: Date;
  [key: string]: any;
}

export interface PaymentMethod {
  id: string;
  type: 'visa' | 'mastercard' | 'amex' | 'paypal';
  lastFour: string;
  expiryMonth: string;
  expiryYear: string;
  holderName: string;
  isDefault: boolean;
  userEmail?: string;
  dateAdded?: string;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef;
  
  user: ProfileUser | null = null;
  profileForm!: FormGroup;
  
  // UI state
  activeTab = 'details';
  isEditing = false;
  loading = false;
  saving = false;
  error = '';
  successMessage = '';
  
  // Data arrays - Initialize to prevent null errors
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  paymentMethods: PaymentMethod[] = [];
  
  // Filters
  orderFilter = 'all';

  private destroy$ = new Subject<void>();

  constructor(
    public authService: AuthService,
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private orderService: OrderService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.initForm();
    this.loadRealData();
    this.handleRouteParams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Helper methods to replace complex template expressions
  getUserAvatar(): string {
    return this.user?.avatar || this.getDefaultAvatar();
  }

  getUserFullName(): string {
    const firstName = this.user?.firstName || '';
    const lastName = this.user?.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'User';
  }

  getUserEmail(): string {
    return this.user?.email || '';
  }

  getOrdersCount(): number {
    return this.orders.length;
  }

  getPaymentMethodsCount(): number {
    return this.paymentMethods.length;
  }

  hasFilteredOrders(): boolean {
    return this.filteredOrders.length > 0;
  }

  hasPaymentMethods(): boolean {
    return this.paymentMethods.length > 0;
  }

  hasFieldError(fieldName: string): boolean {
    const field = this.profileForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  isFormInvalid(): boolean {
    return this.profileForm.invalid;
  }

  getSaveButtonText(): string {
    return this.saving ? 'Saving...' : 'Save Changes';
  }

  getOrderStatusClass(status: string): string {
    return status.toLowerCase();
  }

  formatPrice(price: number): string {
    return price.toFixed(2);
  }

  getShippingLocation(address: any): string {
    return `${address.city}, ${address.state} ${address.zipCode}`;
  }

  getPaymentMethodDisplay(paymentMethod: any): string {
    return `${paymentMethod.cardType} ending in ${paymentMethod.cardLast4}`;
  }

  canReorder(status: string): boolean {
    return status === 'Delivered' || (status !== 'Delivered' && status !== 'Cancelled');
  }

  getReorderButtonText(status: string): string {
    return status === 'Delivered' ? 'Reorder' : 'Buy Again';
  }

  getEmptyOrdersMessage(): string {
    if (this.orderFilter === 'all') {
      return "You haven't placed any orders yet";
    }
    return `No orders match the selected filter: ${this.orderFilter}`;
  }

  getPaymentCardClass(isDefault: boolean): string {
    return isDefault ? 'default' : '';
  }

  handleAvatarError(event: any): void {
    event.target.src = this.getDefaultAvatar();
  }

  // Rest of your existing methods...
  handleRouteParams(): void {
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.setActiveTab(params['tab']);
      }
    });
  }

  loadRealData(): void {
    this.loading = true;
    this.loadUserOrders();
    this.loadRealPaymentMethods();
    this.loading = false;
  }

  loadUserOrders(): void {
    this.orderService.orders$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (orders) => {
          const userEmail = this.user?.email;
          if (userEmail) {
            this.orders = this.orderService.getOrdersByEmail(userEmail);
          } else {
            this.orders = orders;
          }
          this.filterOrders();
        },
        error: (error) => {
          console.error('Error loading orders:', error);
          this.error = 'Failed to load orders';
          this.orders = [];
          this.filteredOrders = [];
        }
      });
  }

  // Load real payment methods from localStorage
  loadRealPaymentMethods(): void {
    try {
      const userEmail = this.user?.email;
      if (!userEmail) {
        console.log('No user email found, loading empty payment methods');
        this.paymentMethods = [];
        return;
      }

      // Get all payment methods from localStorage
      const allPaymentMethods = JSON.parse(localStorage.getItem('paymentMethods') || '[]');
      console.log('All payment methods from localStorage:', allPaymentMethods);

      // Filter payment methods for current user
      this.paymentMethods = allPaymentMethods.filter((method: any) => 
        method.userEmail === userEmail
      );

      console.log(`✅ Loaded ${this.paymentMethods.length} payment methods for user: ${userEmail}`);
      console.log('User payment methods:', this.paymentMethods);

      // If no payment methods found, show a helpful message
      if (this.paymentMethods.length === 0) {
        console.log('💡 No payment methods found. User can add them during checkout.');
      }

    } catch (error) {
      console.error('❌ Error loading payment methods:', error);
      this.paymentMethods = [];
    }
  }

  filterOrders(): void {
    if (this.orderFilter === 'all') {
      this.filteredOrders = [...this.orders];
    } else {
      this.filteredOrders = this.orders.filter(order => 
        order.status.toLowerCase() === this.orderFilter.toLowerCase()
      );
    }
  }

  viewOrder(orderId: number): void {
    const order = this.orderService.getOrderById(orderId);
    if (order) {
      this.showSuccess(`Order #${orderId} - Status: ${order.status} - Total: $${order.total.toFixed(2)}`);
    }
  }

  reorder(orderId: number): void {
    const order = this.orderService.getOrderById(orderId);
    if (order) {
      order.items.forEach(item => {
        const product = {
          id: item.productId,
          title: item.name,
          price: item.price,
          image: item.image,
          description: '',
          category: '',
          rating: { rate: 0, count: 0 }
        };
        this.cartService.addToCart(product, item.quantity);
      });
      this.showSuccess(`${order.items.length} items added to cart!`);
    }
  }

  initForm(): void {
    this.profileForm = this.formBuilder.group({
      username: [{ value: '', disabled: true }],
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.pattern(/^\+?[\d\s\-\(\)]+$/)]]
    });
  }

  private convertToProfileUser(authUser: any): ProfileUser {
    if (!authUser) {
      return {
        id: '1',
        username: 'user',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '',
        avatar: 'assets/default-avatar.png',
        createdAt: new Date('2024-01-01')
      };
    }

    return {
      id: authUser.id || '1',
      username: authUser.username || 'user',
      email: authUser.email || 'user@example.com',
      firstName: authUser.firstname || authUser.firstName || 'John',
      lastName: authUser.lastname || authUser.lastName || 'Doe',
      phone: authUser.phone || '',
      avatar: authUser.profilePicture || authUser.avatar || 'assets/default-avatar.png',
      createdAt: authUser.createdAt || new Date('2024-01-01')
    };
  }

  loadUserData(): void {
    try {
      let authUser: any = null;
      
      if (this.authService?.currentUserValue) {
        authUser = this.authService.currentUserValue;
      }
      
      this.user = this.convertToProfileUser(authUser);
      this.updateFormWithUserData();
      
      const savedAvatar = localStorage.getItem('userAvatar');
      if (savedAvatar && this.user) {
        this.user.avatar = savedAvatar;
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      this.user = this.convertToProfileUser(null);
      this.updateFormWithUserData();
    }
  }

  updateFormWithUserData(): void {
    if (this.user && this.profileForm) {
      this.profileForm.patchValue({
        username: this.user.username || '',
        email: this.user.email || '',
        firstName: this.user.firstName || '',
        lastName: this.user.lastName || '',
        phone: this.user.phone || ''
      });
    }
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.error = '';
    this.successMessage = '';
    
    if (tab === 'orders') {
      this.loadUserOrders();
    } else if (tab === 'payment') {
      // 🔥 ADDED: Reload payment methods when switching to payment tab
      this.loadRealPaymentMethods();
    }
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.updateFormWithUserData();
    }
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.updateFormWithUserData();
    this.error = '';
  }

  saveProfile(): void {
    if (this.profileForm.valid) {
      this.saving = true;
      this.error = '';

      setTimeout(() => {
        if (this.user) {
          this.user = {
            ...this.user,
            email: this.profileForm.value.email,
            firstName: this.profileForm.value.firstName,
            lastName: this.profileForm.value.lastName,
            phone: this.profileForm.value.phone
          };
        }

        this.isEditing = false;
        this.saving = false;
        this.showSuccess('Profile updated successfully!');
      }, 1000);
    } else {
      this.markFormGroupTouched();
    }
  }

  // 🔥 REMOVED: loadMockPaymentMethods() - we're using real ones now!

  triggerFileInput(): void {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        this.error = 'File size must be less than 2MB';
        return;
      }

      if (!file.type.startsWith('image/')) {
        this.error = 'Please select a valid image file';
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        const base64Image = e.target.result;
        this.updateProfilePicture(base64Image);
      };
      reader.readAsDataURL(file);
    }
  }

  updateProfilePicture(imageData: string): void {
    if (this.user) {
      this.user.avatar = imageData;
      localStorage.setItem('userAvatar', imageData);
      this.showSuccess('Profile picture updated successfully!');
    }
  }

  getDefaultAvatar(): string {
    const name = this.user?.firstName || 'User';
    return `https://ui-avatars.com/api/?name=${name}&background=007bff&color=fff&size=150`;
  }

  changeAvatar(): void {
    this.triggerFileInput();
  }

  goToShop(): void {
    this.router.navigate(['/products']);
  }

  retry(): void {
    this.error = '';
    this.loadRealData();
  }

  addPaymentMethod(): void {
    this.showSuccess('Payment method form would open here');
  }

  editPaymentMethod(id: string): void {
    this.showSuccess('Edit payment method form would open here');
  }

  // 🔥 UPDATED: Remove payment method from localStorage
  removePaymentMethod(id: string): void {
    if (confirm('Are you sure you want to remove this payment method?')) {
      try {
        // Remove from local array
        this.paymentMethods = this.paymentMethods.filter(pm => pm.id !== id);
        
        // Update localStorage
        const allPaymentMethods = JSON.parse(localStorage.getItem('paymentMethods') || '[]');
        const updatedMethods = allPaymentMethods.filter((method: any) => method.id !== id);
        localStorage.setItem('paymentMethods', JSON.stringify(updatedMethods));
        
        console.log('✅ Payment method removed:', id);
        this.showSuccess('Payment method removed successfully!');
        
        // If we removed the default payment method, make another one default
        if (this.paymentMethods.length > 0 && !this.paymentMethods.some(pm => pm.isDefault)) {
          this.setDefaultPayment(this.paymentMethods[0].id);
        }
      } catch (error) {
        console.error('❌ Error removing payment method:', error);
        this.error = 'Failed to remove payment method';
      }
    }
  }

  // Update default payment method in localStorage
  setDefaultPayment(id: string): void {
    try {
      // Update local array
      this.paymentMethods.forEach(pm => {
        pm.isDefault = pm.id === id;
      });
      
      // Update localStorage
      const allPaymentMethods = JSON.parse(localStorage.getItem('paymentMethods') || '[]');
      allPaymentMethods.forEach((method: any) => {
        if (method.userEmail === this.user?.email) {
          method.isDefault = method.id === id;
        }
      });
      localStorage.setItem('paymentMethods', JSON.stringify(allPaymentMethods));
      
      console.log('✅ Default payment method updated:', id);
      this.showSuccess('Default payment method updated!');
    } catch (error) {
      console.error('❌ Error updating default payment method:', error);
      this.error = 'Failed to update default payment method';
    }
  }

  getCardIcon(type: string): string {
    const icons = {
      visa: 'fab fa-cc-visa',
      mastercard: 'fab fa-cc-mastercard',
      amex: 'fab fa-cc-amex',
      paypal: 'fab fa-cc-paypal'
    };
    return icons[type as keyof typeof icons] || 'fas fa-credit-card';
  }

  getOrderDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      return dateString;
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.profileForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['email']) return 'Invalid email format';
      if (field.errors['minlength']) return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['pattern']) return `Invalid ${fieldName} format`;
    }
    return '';
  }

  private markFormGroupTouched(): void {
    Object.keys(this.profileForm.controls).forEach(key => {
      const control = this.profileForm.get(key);
      control?.markAsTouched();
    });
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }
}