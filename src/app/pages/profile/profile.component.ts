import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Import only AuthService, don't import User type to avoid conflicts
import { AuthService } from '../../auth/services/auth.service';

// Define our own extended User interface for the profile
export interface ProfileUser {
  id?: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  createdAt?: Date;
  [key: string]: any; // Allow additional properties
}

export interface Order {
  id: string;
  date: Date;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
  total: number;
}

export interface OrderItem {
  id: string;
  name: string;
  image: string;
  quantity: number;
  price: number;
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

export interface Address {
  id: string;
  label: string;
  fullName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export interface UserSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketing: boolean;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef;
  
  // Use our extended ProfileUser interface
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
  addresses: Address[] = [];
  
  // Filters and settings
  orderFilter = 'all';
  settings: UserSettings = {
    emailNotifications: true,
    smsNotifications: false,
    marketing: true
  };

  private destroy$ = new Subject<void>();

  constructor(
    public authService: AuthService, // Changed from private to public
    private formBuilder: FormBuilder,
    private router: Router
  ) {}

  ngOnInit() {
    console.log('Profile component initializing...');
    this.loadUserData();
    this.initForm();
    this.loadMockData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Initialize reactive form
  initForm() {
    this.profileForm = this.formBuilder.group({
      username: [{ value: this.user?.username || '', disabled: true }],
      email: [this.user?.email || '', [Validators.required, Validators.email]],
      firstName: [this.user?.firstName || '', [Validators.required, Validators.minLength(2)]],
      lastName: [this.user?.lastName || '', [Validators.required, Validators.minLength(2)]],
      phone: [this.user?.phone || '', [Validators.pattern(/^\+?[\d\s\-\(\)]+$/)]]
    });
  }

  // Convert any user object to ProfileUser and add missing properties
  
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
      firstName: authUser?.firstname || authUser?.firstName || authUser?.name?.split(' ')[0] || 'John',
      lastName: authUser?.lastname || authUser?.lastName || authUser?.name?.split(' ')[1] || 'Doe',
      phone: authUser?.phone || '',
      avatar: authUser?.profilePicture || authUser?.avatar || 'assets/default-avatar.png',
      createdAt: authUser?.createdAt || new Date('2024-01-01'),
      ...authUser // Include any additional properties
    };
  }

  // Load user data with proper error handling
  loadUserData() {
    try {
      let authUser: any = null;
      
      // Try to get user data from AuthService using different methods
      if (this.authService?.currentUserValue) {
        authUser = this.authService.currentUserValue;
        console.log('Loaded user from currentUserValue:', authUser);
      } else if (this.authService?.currentUser) {
        // Subscribe to currentUser observable
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
        return; // Exit early since we're handling this asynchronously
      }
      
      // Convert and set user
      this.user = this.convertToProfileUser(authUser);
      this.updateFormWithUserData();
      
      // Load saved avatar from localStorage if available
      const savedAvatar = localStorage.getItem('userAvatar');
      if (savedAvatar && this.user) {
        this.user.avatar = savedAvatar;
      }
      
    } catch (error) {
      console.error('Error loading user data:', error);
      // Set complete default user if everything fails
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

  // Profile picture methods
  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Check file size (limit to 2MB)
      if (file.size > 2 * 1024 * 1024) {
        this.error = 'File size must be less than 2MB';
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        this.error = 'Please select a valid image file';
        return;
      }

      // Convert to base64 and save
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
      // Update current user object
      this.user.avatar = imageData;
      
      // Try to update in AuthService if available
      try {
        const currentUser = this.authService.currentUserValue;
        if (currentUser && this.authService.updateUserProfile) {
          const updatedUser = { ...currentUser, profilePicture: imageData };
          this.authService.updateUserProfile(updatedUser);
        }
      } catch (error) {
        console.log('AuthService update not available, saving locally');
      }
      
      // Save to localStorage as backup
      localStorage.setItem('userAvatar', imageData);
      
      this.showSuccess('Profile picture updated successfully!');
      console.log('Profile picture updated successfully');
    }
  }

  getDefaultAvatar(): string {
    const name = this.user?.firstName || 'User';
    return `https://ui-avatars.com/api/?name=${name}&background=007bff&color=fff&size=150`;
  }

  // Load mock data
  loadMockData() {
    this.loading = true;
    
    setTimeout(() => {
      this.loadMockOrders();
      this.loadMockPaymentMethods();
      this.loadMockAddresses();
      this.loadSettings();
      this.loading = false;
    }, 1000);
  }

  // Tab management
  setActiveTab(tab: string) {
    this.activeTab = tab;
    this.error = '';
    this.successMessage = '';
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
          // Update user with form values
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

  // Mock data methods
  loadMockOrders() {
    this.orders = [
      {
        id: 'ORD-001',
        date: new Date('2024-01-15'),
        status: 'delivered',
        items: [
          {
            id: '1',
            name: 'iPhone 15 Pro',
            image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=100',
            quantity: 1,
            price: 999
          }
        ],
        total: 999
      },
      {
        id: 'ORD-002',
        date: new Date('2024-02-01'),
        status: 'shipped',
        items: [
          {
            id: '2',
            name: 'MacBook Air',
            image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=100',
            quantity: 1,
            price: 1299
          }
        ],
        total: 1299
      }
    ];
    this.filteredOrders = [...this.orders];
  }

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
      },
      {
        id: '2',
        type: 'mastercard',
        lastFour: '5678',
        expiryMonth: '08',
        expiryYear: '26',
        holderName: fullName,
        isDefault: false
      }
    ];
  }

  loadMockAddresses() {
    const fullName = `${this.user?.firstName || 'John'} ${this.user?.lastName || 'Doe'}`;
    this.addresses = [
      {
        id: '1',
        label: 'Home',
        fullName: fullName,
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'United States',
        isDefault: true
      },
      {
        id: '2',
        label: 'Work',
        fullName: fullName,
        street: '456 Business Ave',
        city: 'New York',
        state: 'NY',
        zipCode: '10002',
        country: 'United States',
        isDefault: false
      }
    ];
  }

  // Orders management
  filterOrders() {
    if (this.orderFilter === 'all') {
      this.filteredOrders = [...this.orders];
    } else {
      this.filteredOrders = this.orders.filter(order => order.status === this.orderFilter);
    }
  }

  viewOrder(orderId: string) {
    console.log('Viewing order:', orderId);
    this.showSuccess('Order details would open here');
  }

  reorder(orderId: string) {
    console.log('Reordering:', orderId);
    this.showSuccess('Items added to cart!');
  }

  // Payment methods management
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

  // Address management
  addAddress() {
    this.showSuccess('Add address form would open here');
  }

  editAddress(id: string) {
    this.showSuccess('Edit address form would open here');
  }

  removeAddress(id: string) {
    if (confirm('Are you sure you want to remove this address?')) {
      this.addresses = this.addresses.filter(addr => addr.id !== id);
      this.showSuccess('Address removed successfully!');
    }
  }

  setDefaultAddress(id: string) {
    this.addresses.forEach(addr => {
      addr.isDefault = addr.id === id;
    });
    this.showSuccess('Default address updated!');
  }

  // Settings management
  loadSettings() {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      this.settings = JSON.parse(savedSettings);
    }
  }

  updateSettings() {
    localStorage.setItem('userSettings', JSON.stringify(this.settings));
    this.showSuccess('Settings updated!');
  }

  changePassword() {
    this.router.navigate(['/auth/change-password']);
  }

  deleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      this.showSuccess('Account deletion would be processed here');
    }
  }

  // Utility methods
  changeAvatar() {
    this.triggerFileInput();
  }

  goToShop() {
    this.router.navigate(['/products']);
  }

  retry() {
    this.error = '';
    this.loadMockData();
  }
  // ...existing code...

onAvatarError(img: any): void {
  img.src = this.getDefaultAvatar();
}

// ...existing code...

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