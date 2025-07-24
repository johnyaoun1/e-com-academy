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
  private apiUrl = 'https://jsonplaceholder.typicode.com'; // Test API
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
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

  // Mock Login for Testing
  login(username: string, password: string, loginType: 'user' | 'admin' = 'user'): Observable<User> {
    console.log('Testing login with:', { username, password, loginType });
    
    // Mock API call that always succeeds
    return of({
      success: true,
      user: {
        id: loginType === 'admin' ? 1 : 2,
        email: username,
        username: username,
        firstname: 'Test',
        lastname: 'User',
        role: loginType,
        token: 'test-token-' + Date.now()
      }
    }).pipe(
      delay(1000), // Simulate network delay
      map((response: any) => {
        const user = response.user;
        
        // Store in localStorage
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
        
        console.log('Login successful:', user);
        return user;
      })
    );
  }

  // Mock Signup for Testing
  signup(userData: any): Observable<User> {
    return of({
      success: true,
      user: {
        id: Math.floor(Math.random() * 1000),
        email: userData.email,
        username: userData.username || userData.email,
        firstname: userData.firstname,
        lastname: userData.lastname,
        phone: userData.phone,
        role: userData.role || 'user',
        token: 'test-token-' + Date.now()
      }
    }).pipe(
      delay(1000),
      map((response: any) => {
        const user = response.user;
        
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
        
        console.log('Signup successful:', user);
        return user;
      })
    );
  }

  // Mock Update Profile
  updateUserProfile(updatedUser: User): Observable<User> {
    return of(updatedUser).pipe(
      delay(500),
      map(user => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
        
        console.log('Profile updated successfully:', user);
        return user;
      })
    );
  }

  // Mock Get Profile
  getUserProfile(): Observable<User> {
    const currentUser = this.currentUserValue;
    if (currentUser) {
      return of(currentUser).pipe(delay(300));
    }
    return throwError('No user logged in');
  }

  // Logout
  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  // Check if user is admin
  isAdmin(): boolean {
    return this.currentUserValue?.role === 'admin';
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.currentUserValue?.token;
  }

  // Get current user token
  getToken(): string | null {
    return this.currentUserValue?.token || null;
  }

  // Mock Refresh token
  refreshToken(): Observable<string> {
    const newToken = 'refreshed-token-' + Date.now();
    if (this.currentUserValue) {
      const updatedUser = { ...this.currentUserValue, token: newToken };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      this.currentUserSubject.next(updatedUser);
    }
    return of(newToken);
  }
}