import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {
  @Output() switchToLogin = new EventEmitter<void>();
  
  signupForm!: FormGroup;
  loading = false;
  error = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.signupForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      firstname: ['', Validators.required],
      lastname: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\d{8,}$/)]],
      role: ['user', Validators.required],
      adminCode: [''] // Optional admin code
    }, { validators: [this.passwordMatchValidator, this.adminCodeValidator] });
  }

  // Custom validator to check if passwords match
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  // Admin code validator
  adminCodeValidator(form: FormGroup) {
    const role = form.get('role')?.value;
    const adminCode = form.get('adminCode')?.value;
    
    // If user selects admin role, they must provide the correct admin code
    if (role === 'admin' && adminCode !== 'ADMIN2024') {
      form.get('adminCode')?.setErrors({ invalidAdminCode: true });
      return { invalidAdminCode: true };
    }
    
    return null;
  }

  onSubmit() {
    console.log('Signup form submitted');
    if (this.signupForm.invalid) {
      console.log('Form is invalid');
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    this.error = '';

    // Remove confirmPassword and adminCode from form data before sending
    const formData = { ...this.signupForm.value };
    delete formData.confirmPassword;
    delete formData.adminCode; // Don't send admin code to backend

    console.log('Sending signup data:', formData);

    this.authService.signup(formData).subscribe({
      next: (user) => {
        console.log('Signup successful:', user);
        this.loading = false;

        // 🔑 Show token in console after signup
        const token = this.authService.getToken();
        console.log('🔑 === YOUR TOKEN FOR SWAGGER ===');
        console.log('Token:', token);
        console.log('For Swagger Authorization:');
        console.log(`Bearer ${token}`);
        console.log('================================');

        // Redirect based on user role
        if (user.role === 'admin') {
          console.log('Redirecting admin to dashboard');
          this.router.navigate(['/admin/dashboard']);
        } else {
          console.log('Redirecting user to profile');
          this.router.navigate(['/profile']);
        }
      },
      error: (error) => {
        console.error('Signup error:', error);
        this.error = error?.error?.message || 'Registration failed. Please try again.';
        this.loading = false;
      }
    });
  }

  onSwitchToLogin() {
    this.router.navigate(['/auth/login']);
  }
  
  goToLogin() {
    this.router.navigate(['/auth/login']);
  }

  private markFormGroupTouched() {
    Object.keys(this.signupForm.controls).forEach(key => {
      const control = this.signupForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.signupForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${this.getFieldLabel(fieldName)} is required`;
      if (field.errors['email']) return 'Please enter a valid email address';
      if (field.errors['minlength']) return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['pattern']) return 'Please enter a valid phone number';
      if (field.errors['passwordMismatch']) return 'Passwords do not match';
      if (field.errors['invalidAdminCode']) return 'Invalid admin code';
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      email: 'Email',
      username: 'Username',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      firstname: 'First Name',
      lastname: 'Last Name',
      phone: 'Phone Number',
      role: 'Account Type',
      adminCode: 'Admin Code'
    };
    return labels[fieldName] || fieldName;
  }
}