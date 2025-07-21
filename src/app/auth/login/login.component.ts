import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  error = '';
  loginType: 'user' | 'admin' = 'user';

  // Demo credentials for testing
  demoCredentials = {
    user: { username: 'user@demo.com', password: 'password123' },
    admin: { username: 'admin@demo.com', password: 'admin123' }
  };

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Pre-fill with user demo credentials by default
    this.fillDemoCredentials();
  }

  // Toggle between user and admin login
  toggleLoginType() {
    this.loginType = this.loginType === 'user' ? 'admin' : 'user';
    this.error = '';
    this.fillDemoCredentials();
  }

  // Fill demo credentials for testing
  fillDemoCredentials() {
    const credentials = this.demoCredentials[this.loginType];
    this.loginForm.patchValue({
      username: credentials.username,
      password: credentials.password
    });
  }

  onSubmit() {
    console.log('Login button clicked');
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    this.error = '';

    const { username, password } = this.loginForm.value;
    
    this.authService.login(username, password, this.loginType).subscribe({
      next: (user) => {
        this.loading = false;
        
        // Navigate based on user role
        if (user.role === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/profile';
          this.router.navigate([returnUrl]);
        }
      },
      error: (error) => {
        this.error = error?.error?.message || 'Invalid credentials';
        this.loading = false;
      }
    });
  }

  goToSignup() {
    this.router.navigate(['/auth/signup']);
  }

  private markFormGroupTouched() {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['email']) return 'Please enter a valid email';
      if (field.errors['minlength']) return `Password must be at least ${field.errors['minlength'].requiredLength} characters`;
    }
    return '';
  }
}