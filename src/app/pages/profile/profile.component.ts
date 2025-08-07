// src/app/profile/profile.component.ts - Fixed for your existing OrderService
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';

// Import services - using your existing OrderService
import { AuthService } from '../../auth/services/auth.service';
import { OrderService, Order } from '../../shared/services/order.service';
import { CartService } from '../../shared/services/cart.service';

// Profile-specific interfaces
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
  
  // Data arrays
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  paymentMethods: PaymentMethod[] = [];
  // Removed paymentHistory as it's not supported by your OrderService
  
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

  ngOnInit() {
    console.log('Profile component initializing...');
    this.loadUserData();
    this.initForm();
    this.loadRealData();
    this.handleRouteParams();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Handle route parameters (for direct navigation to specific tabs)
  handleRouteParams() {
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.setActiveTab(params['tab']);
      }
    });
  }

  // Load real data
  loadRealData() {
    this.loading = true;
    
    // Load real orders from your existing OrderService
    this.loadUserOrders();
    
    // Load mock data for payment methods
    this.loadMockPaymentMethods();
    
    this.loading = false;
  }

  // Load user orders using your existing OrderService
  loadUserOrders() {
    this.orderService.orders$
      .pipe(
        takeUntil(this.destroy$),
        map(orders => {
          // Filter orders by current user email using your existing method
          const userEmail = this.user?.email;
          if (userEmail) {
            return this.orderService.getOrdersByEmail(userEmail);
          }
          return orders; // Return all orders if no user email (for demo purposes)
        })
      )
      .subscribe({
        next: (userOrders) => {
          console.log('✅ Loaded user orders:', userOrders.length);
          this.orders = userOrders;
          this.filterOrders(); // Apply current filter
        },
        error: (error) => {
          console.error('❌ Error loading orders:', error);
          this.error = 'Failed to load orders';
        }
      });
  }

  // Filter orders by status using your existing method
  filterOrders() {
    if (this.orderFilter === 'all') {
      this.filteredOrders = [...this.orders];
    } else {
      this.filteredOrders = this.orderService.getOrdersByStatus(this.orderFilter as Order['status']);
      // Further filter by user email
      const userEmail = this.user?.email;
      if (userEmail) {
        this.filteredOrders = this.filteredOrders.filter(order => 
          order.email.toLowerCase() === userEmail.toLowerCase()
        );
      }
    }
    console.log(`🔍 Filtered orders (${this.orderFilter}):`, this.filteredOrders.length);
  }

  // View order details using your existing method
  viewOrder(orderId: number) {
    console.log('Viewing order:', orderId);
    const order = this.orderService.getOrderById(orderId);
    if (order) {
      this.showSuccess(`Order #${orderId} - Status: ${order.status} - Total: $${order.total.toFixed(2)}`);
    }
  }

  // Reorder functionality
  reorder(orderId: number) {
    const order = this.orderService.getOrderById(orderId);
    if (order) {
      console.log('🔄 Reordering:', order);
      
      // Add all items from the order back to cart
      order.items.forEach(item => {
        // Create a product object from the order item
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

  // Initialize form
  initForm() {
    this.profileForm = this.formBuilder.group({
      username: [{ value: this.user?.username || '', disabled: true }],
      email: [this.user?.email || '', [Validators.required, Validators.email]],
      firstName: [this.user?.firstName || '', [Validators.required, Validators.minLength(2)]],
      lastName: [this.user?.lastName || '', [Validators.required, Validators.minLength(2)]],
      phone: [this.user?.phone || '', [Validators.pattern(/^\+?[\d\s\-\(\)]+$/)]]
    });
  }

  // Convert auth user to profile user - FIXED property names
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
      id: authUser?.id || '1',
      username: authUser?.username || 'user',
      email: authUser?.email || 'user@example.com',
      firstName: authUser?.firstname || authUser?.firstName || authUser?.name?.split(' ')[0] || 'John', // Fixed: check 'firstname' first
      lastName: authUser?.lastname || authUser?.lastName || authUser?.name?.split(' ')[1] || 'Doe',   // Fixed: check 'lastname' first
      phone: authUser?.phone || '',
      avatar: authUser?.profilePicture || authUser?.avatar || 'assets/default-avatar.png',
      createdAt: authUser?.createdAt || new Date('2024-01-01'),
      ...authUser
    };
  }

  // Load user data
  loadUserData() {
    try {
      let authUser: any = null;
      
      if (this.authService?.currentUserValue) {
        authUser = this.authService.currentUserValue;
        console.log('Loaded user from currentUserValue:', authUser);
      } else if (this.authService?.currentUser) {
        this.authService.currentUser
          .pipe(takeUntil(this.destroy$))
          .subscribe(user => {
            if (user) {
              authUser = user;
              this.user = this.convertToProfileUser(authUser);
              this.updateFormWithUserData();
              console.log('Loaded user from currentUser observable:', authUser);
            }
          });
        return;
      }
      
      this.user = this.convertToProfileUser(authUser);
      this.updateFormWithUserData();
      
      const savedAvatar = localStorage.getItem('userAvatar');
      if (savedAvatar && this.user) {
        this.user.avatar = savedAvatar;
      }
      
    } catch (error) {
      console.error('Error loading user data:', error);
      this.user = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        phone: '',
        avatar: 'assets/default-avatar.png',
        createdAt: new Date('2024-01-01')
      };
      this.updateFormWithUserData();
    }
  }

  updateFormWithUserData() {
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

  // Tab management
  setActiveTab(tab: string) {
    this.activeTab = tab;
    this.error = '';
    this.successMessage = '';
    
    // Reload orders when switching to orders tab
    if (tab === 'orders') {
      this.loadUserOrders();
    }
  }

  // Profile editing
  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.updateFormWithUserData();
    }
  }

  cancelEdit() {
    this.isEditing = false;
    this.updateFormWithUserData();
    this.error = '';
  }

  saveProfile() {
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

  // Mock payment methods (keep for now)
  loadMockPaymentMethods() {
    const fullName = `${this.user?.firstName || 'John'} ${this.user?.lastName || 'Doe'}`;
    this.paymentMethods = [
      {
        id: '1',
        type: 'visa',
        lastFour: '1234',
        expiryMonth: '12',
        expiryYear: '25',
        holderName: fullName,
        isDefault: true
      }
    ];
  }

  // Avatar methods
  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
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
      
      try {
        const currentUser = this.authService.currentUserValue;
        if (currentUser && this.authService.updateUserProfile) {
          const updatedUser = { ...currentUser, profilePicture: imageData };
          this.authService.updateUserProfile(updatedUser);
        }
      } catch (error) {
        console.log('AuthService update not available, saving locally');
      }
      
      localStorage.setItem('userAvatar', imageData);
      this.showSuccess('Profile picture updated successfully!');
    }
  }

  getDefaultAvatar(): string {
    const name = this.user?.firstName || 'User';
    return `https://ui-avatars.com/api/?name=${name}&background=007bff&color=fff&size=150`;
  }

  onAvatarError(img: any): void {
    img.src = this.getDefaultAvatar();
  }

  changeAvatar() {
    this.triggerFileInput();
  }

  // Navigation methods
  goToShop() {
    this.router.navigate(['/products']);
  }

  retry() {
    this.error = '';
    this.loadRealData();
  }

  // Payment methods
  addPaymentMethod() {
    this.showSuccess('Payment method form would open here');
  }

  editPaymentMethod(id: string) {
    this.showSuccess('Edit payment method form would open here');
  }

  removePaymentMethod(id: string) {
    if (confirm('Are you sure you want to remove this payment method?')) {
      this.paymentMethods = this.paymentMethods.filter(pm => pm.id !== id);
      this.showSuccess('Payment method removed successfully!');
    }
  }

  setDefaultPayment(id: string) {
    this.paymentMethods.forEach(pm => {
      pm.isDefault = pm.id === id;
    });
    this.showSuccess('Default payment method updated!');
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

  // Helper methods
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

  private markFormGroupTouched() {
    Object.keys(this.profileForm.controls).forEach(key => {
      const control = this.profileForm.get(key);
      control?.markAsTouched();
    });
  }

  private showSuccess(message: string) {
    this.successMessage = message;
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }
}