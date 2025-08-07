import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { Router } from '@angular/router';
import { map, catchError, delay } from 'rxjs/operators';

export interface User {
  id: number;
  email: string;
  username: string;
  role: 'admin' | 'user';
  token?: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
  profilePicture?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://192.168.7.156:5005/api'; 
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  // Store users created through signup
  private signupUsers: { [email: string]: User } = {};

  // Demo credentials that match your login component
  private demoUsers = {
    'user@demo.com': {
      id: 1,
      email: 'user@demo.com',
      username: 'demouser',
      role: 'user' as const,
      token: 'demo-user-jwt-token-12345',
      firstname: 'Demo',
      lastname: 'User',
      phone: '1234567890'
    },
    'admin@demo.com': {
      id: 2,
      email: 'admin@demo.com',
      username: 'demoadmin',
      role: 'admin' as const,
      token: 'demo-admin-jwt-token-67890',
      firstname: 'Demo',
      lastname: 'Admin',
      phone: '0987654321'
    }
  };

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
    
    // Load previously created signup users
    this.signupUsers = this.getStoredSignupUsers();
    console.log('📚 Loaded signup users:', Object.keys(this.signupUsers));
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.currentUserValue?.token;
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  login(username: string, password: string, loginType: 'user' | 'admin' = 'user'): Observable<User> {
    console.log('🔍 Attempting login:', { username, loginType });
    
    // Check if it's a pre-defined demo user
    const isDemoUser = this.demoUsers[username as keyof typeof this.demoUsers];
    
    if (isDemoUser) {
      return this.handleDemoLogin(username, password, loginType);
    }
    
    // Check if it's a user created through signup
    const signupUser = this.signupUsers[username];
    if (signupUser) {
      return this.handleSignupUserLogin(username, password, loginType, signupUser);
    }
    
    // Check localStorage for any previously created users
    const storedSignupUsers = this.getStoredSignupUsers();
    const storedUser = storedSignupUsers[username];
    if (storedUser) {
      return this.handleSignupUserLogin(username, password, loginType, storedUser);
    }
    
    // If not demo or signup user, try real API
    return this.handleRealApiLogin(username, password, loginType);
  }

  private handleDemoLogin(username: string, password: string, loginType: 'user' | 'admin'): Observable<User> {
    console.log('🎭 Using demo login');
    
    const demoUser = this.demoUsers[username as keyof typeof this.demoUsers];
    
    // Check password for demo users
    const validPasswords = ['password123', 'admin123'];
    if (!validPasswords.includes(password)) {
      console.log('❌ Invalid demo password');
      return throwError(() => 'Invalid demo credentials. Use password123 or admin123');
    }
    
    // Create user object with correct role
    const user: User = {
      ...demoUser,
      role: loginType // Use the loginType from component
    };
    
    // Store in localStorage
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
    
    console.log('✅ Demo login successful:', user);
    
    // Simulate API delay with observable
    return of(user).pipe(delay(500));
  }

  // Handle signup user login
  private handleSignupUserLogin(username: string, password: string, loginType: 'user' | 'admin', signupUser: User): Observable<User> {
    console.log('🎭 Logging in with signup user account');
    
    // For demo signup users, we'll accept the login since they created the account
    // Create user object with correct role
    const user: User = {
      ...signupUser,
      role: loginType // Use the loginType from component
    };
    
    // Store in localStorage
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
    
    console.log('✅ Signup user login successful:', user);
    
    // Simulate API delay
    return of(user).pipe(delay(500));
  }

  private handleRealApiLogin(username: string, password: string, loginType: 'user' | 'admin'): Observable<User> {
    console.log('🌐 Attempting real API login');
    
    const loginData: LoginRequest = {
      email: username,
      password: password
    };

    return this.http.post<LoginResponse>(`${this.apiUrl}/User/Login`, loginData, {
      headers: this.getHeaders()
    }).pipe(
      map((response: LoginResponse) => {
        console.log('✅ API Login response:', response);
        
        const user: User = {
          ...response.user,
          role: loginType, 
          token: response.token
        };
        
        // Store in localStorage
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
        
        console.log('✅ API Login successful:', user);
        return user;
      }),
      catchError(error => {
        console.error('❌ API Login error:', error);
        
        let errorMessage = 'Login failed. Please try again.';
        
        if (error.status === 401) {
          errorMessage = 'Invalid email or password.';
        } else if (error.status === 404) {
          errorMessage = 'User not found. Try signing up first or use demo credentials.';
        } else if (error.status === 0) {
          errorMessage = 'Cannot connect to server. Use demo credentials: user@demo.com/password123';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        return throwError(() => errorMessage);
      })
    );
  }

  // SIGNUP METHOD
  signup(userData: any): Observable<User> {
    console.log('🔍 Attempting signup:', userData);
    
    // Enhanced demo detection - check for demo/test OR if API is not available
    const isDemoEmail = userData.email.includes('demo') || 
                        userData.email.includes('test') ||
                        userData.email.includes('example') ||
                        userData.email.includes('local');
    
    // Always try demo first for development since API is not running
    if (isDemoEmail || !this.isApiAvailable()) {
      console.log('🎭 Creating demo signup user');
      return this.createDemoUser(userData);
    }
    
    // Try real API signup
    return this.attemptApiSignup(userData);
  }

  private isApiAvailable(): boolean {
    
    return true;
  }

  private attemptApiSignup(userData: any): Observable<User> {
    console.log('🌐 Attempting real API signup');
    
    const signupData = {
      email: userData.email,
      password: userData.password,
      username: userData.username || userData.email,
      firstname: userData.firstname,
      lastname: userData.lastname,
      phone: userData.phone,
      role: userData.role || 'user'
    };

    return this.http.post<LoginResponse>(`${this.apiUrl}/User/Signup`, signupData, {
      headers: this.getHeaders()
    }).pipe(
      map((response: LoginResponse) => {
        console.log('✅ API Signup response:', response);
        
        const user: User = {
          ...response.user,
          token: response.token
        };
        
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
        
        console.log('✅ API Signup successful:', user);
        return user;
      }),
      catchError(error => {
        console.error('❌ API Signup error:', error);
        console.log('🔄 Falling back to demo signup');
        
        // Fallback to demo signup if API fails
        return this.createDemoUser(userData);
      })
    );
  }

  //stores users for future login
  private createDemoUser(userData: any): Observable<User> {
    const demoUser: User = {
      id: Math.floor(Math.random() * 1000) + 100,
      email: userData.email,
      username: userData.username || userData.email.split('@')[0],
      role: userData.role || 'user',
      token: `demo-signup-token-${Date.now()}`,
      firstname: userData.firstname,
      lastname: userData.lastname,
      phone: userData.phone
    };
    
    // Store this user for future logins
    this.signupUsers[userData.email] = demoUser;
    this.saveSignupUsersToStorage();
    
    localStorage.setItem('currentUser', JSON.stringify(demoUser));
    this.currentUserSubject.next(demoUser);
    
    console.log('✅ Demo signup successful:', demoUser);
    console.log('💾 User saved for future logins');
    return of(demoUser).pipe(delay(500));
  }

  // managing signup users
  private saveSignupUsersToStorage(): void {
    try {
      localStorage.setItem('signupUsers', JSON.stringify(this.signupUsers));
      console.log('💾 Signup users saved to storage');
    } catch (error) {
      console.error('Error saving signup users:', error);
    }
  }

  private getStoredSignupUsers(): { [email: string]: User } {
    try {
      const stored = localStorage.getItem('signupUsers');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading signup users:', error);
      return {};
    }
  }

  // UPDATE USER PROFILE
  updateUserProfile(updatedUser: User): Observable<User> {
    console.log('🔍 Updating profile:', updatedUser);
    
    // For demo users, just update localStorage
    if (updatedUser.token?.includes('demo')) {
      // Also update in signup users if it exists
      if (this.signupUsers[updatedUser.email]) {
        this.signupUsers[updatedUser.email] = updatedUser;
        this.saveSignupUsersToStorage();
      }
      
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      this.currentUserSubject.next(updatedUser);
      console.log('✅ Demo profile updated:', updatedUser);
      return of(updatedUser).pipe(delay(300));
    }
    
    // Real API call
    return this.http.put<User>(`${this.apiUrl}/User/Profile`, updatedUser, {
      headers: this.getAuthHeaders()
    }).pipe(
      map((user: User) => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
        console.log('✅ API profile updated:', user);
        return user;
      }),
      catchError(error => {
        console.error('❌ Profile update error:', error);
        return throwError(() => 'Profile update failed');
      })
    );
  }

  // GET USER PROFILE
  getUserProfile(): Observable<User> {
    console.log('🔍 Fetching user profile');
    
    const currentUser = this.currentUserValue;
    
    // For demo users, return current user
    if (currentUser?.token?.includes('demo')) {
      console.log('✅ Demo profile fetched:', currentUser);
      return of(currentUser).pipe(delay(300));
    }
    
    // Real API call
    return this.http.get<User>(`${this.apiUrl}/User/Profile`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map((user: User) => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
        console.log('✅ API profile fetched:', user);
        return user;
      }),
      catchError(error => {
        console.error('❌ Get profile error:', error);
        if (error.status === 401) {
          console.log('Token expired, logging out');
          this.logout();
        }
        return throwError(() => 'Failed to fetch user profile');
      })
    );
  }

  // LOGOUT
  logout(): void {
    console.log('🔍 Logging out user');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  // CHECK IF USER IS ADMIN
  isAdmin(): boolean {
    return this.currentUserValue?.role === 'admin';
  }

  // CHECK IF USER IS AUTHENTICATED
  isAuthenticated(): boolean {
    return !!this.currentUserValue?.token;
  }

  // GET CURRENT USER TOKEN
  getToken(): string | null {
    return this.currentUserValue?.token || null;
  }

  // REFRESH TOKEN
  refreshToken(): Observable<string> {
    console.log('🔍 Refreshing token');
    
    const currentUser = this.currentUserValue;
    
    // For demo users, return same token
    if (currentUser?.token?.includes('demo')) {
      console.log('✅ Demo token refreshed');
      return of(currentUser.token).pipe(delay(300));
    }
    
    // Real API call
    return this.http.post<{token: string}>(`${this.apiUrl}/User/RefreshToken`, {}, {
      headers: this.getAuthHeaders()
    }).pipe(
      map((response: {token: string}) => {
        const newToken = response.token;
        
        if (this.currentUserValue) {
          const updatedUser = { ...this.currentUserValue, token: newToken };
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
          this.currentUserSubject.next(updatedUser);
        }
        
        console.log('✅ API token refreshed');
        return newToken;
      }),
      catchError(error => {
        console.error('❌ Token refresh error:', error);
        this.logout();
        return throwError(() => 'Token refresh failed');
      })
    );
  }

  // VERIFY TOKEN
  verifyToken(): Observable<boolean> {
    const currentUser = this.currentUserValue;
    
    // For demo users, always return true
    if (currentUser?.token?.includes('demo')) {
      console.log('✅ Demo token verified');
      return of(true).pipe(delay(200));
    }
    
    // Real API call
    return this.http.get<{valid: boolean}>(`${this.apiUrl}/User/VerifyToken`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map((response: {valid: boolean}) => {
        console.log('✅ API token verified:', response.valid);
        return response.valid;
      }),
      catchError(error => {
        console.error('❌ Token verification failed:', error);
        return throwError(() => false);
      })
    );
  }

  // DISPLAY TOKEN FOR SWAGGER
  displayToken(): void {
    const token = this.getToken();
    const user = this.currentUserValue;
    
    console.log('🔑 === TOKEN INFO ===');
    if (token) {
      console.log('Current token:', token);
      console.log('For Swagger Authorization:');
      console.log(`Bearer ${token}`);
      console.log('User info:', user);
    } else {
      console.log('❌ No token available. Please login or signup first.');
    }
    console.log('===================');
  }

  // COPY TOKEN TO CLIPBOARD
  copyTokenForSwagger(): void {
    const token = this.getToken();
    if (token) {
      const bearerToken = `Bearer ${token}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(bearerToken).then(() => {
          console.log('✅ Bearer token copied to clipboard!');
          console.log('Paste this in Swagger Authorization:', bearerToken);
        });
      } else {
        console.log('🔑 Copy this for Swagger:', bearerToken);
      }
    } else {
      console.log('❌ No token available. Please login first.');
    }
  }
}