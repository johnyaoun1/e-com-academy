import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';

export interface User {
  id: number;
  email: string;
  username: string;
  role: 'admin' | 'user';
  token?: string;
  password?: string; // Store password for demo purposes
  firstname?: string;
  lastname?: string;
  phone?: string;
  profilePicture?: string; // Add this line for profile picture
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
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

  // Debug storage method
  private debugStorage(): void {
    console.log('=== STORAGE DEBUG ===');
    console.log('Current URL:', window.location.href);
    console.log('Registered users:', localStorage.getItem('registeredUsers'));
    console.log('Current user:', localStorage.getItem('currentUser'));
    console.log('All localStorage keys:', Object.keys(localStorage));
  }

  // Get all registered users from localStorage
  private getRegisteredUsers(): User[] {
    const users = localStorage.getItem('registeredUsers');
    console.log('Getting registered users:', users);
    return users ? JSON.parse(users) : [];
  }

  // Save user to registered users list
  private saveUserToStorage(user: User): void {
    const users = this.getRegisteredUsers();
    const existingUserIndex = users.findIndex(u => u.email === user.email);
    
    if (existingUserIndex >= 0) {
      users[existingUserIndex] = user;
    } else {
      users.push(user);
    }
    
    localStorage.setItem('registeredUsers', JSON.stringify(users));
    console.log('Saved users to storage:', users);
    this.debugStorage(); // Debug after saving
  }

  // Add this new method for updating user profile
  updateUserProfile(updatedUser: User): void {
    console.log('Updating user profile:', updatedUser);
    
    // Update registered users in localStorage
    const users = this.getRegisteredUsers();
    const userIndex = users.findIndex(u => u.id === updatedUser.id);
    
    if (userIndex >= 0) {
      // Update the user in registered users (keep password)
      users[userIndex] = { ...users[userIndex], ...updatedUser };
      localStorage.setItem('registeredUsers', JSON.stringify(users));
    }
    
    // Update current user session (without password)
    const sessionUser = { ...updatedUser };
    delete sessionUser.password;
    
    localStorage.setItem('currentUser', JSON.stringify(sessionUser));
    this.currentUserSubject.next(sessionUser);
    
    this.debugStorage();
    console.log('Profile updated successfully');
  }

  signup(userData: any): Observable<User> {
    console.log('AuthService signup called with:', userData);
    
    return new Observable(observer => {
      setTimeout(() => {
        // Check if user already exists
        const existingUsers = this.getRegisteredUsers();
        const existingUser = existingUsers.find(u => u.email === userData.email);
        
        if (existingUser) {
          console.log('User already exists');
          observer.error({ error: { message: 'User already exists with this email' } });
          return;
        }

        const newUser: User = {
          id: Date.now(), // Simple ID generation
          email: userData.email,
          username: userData.username,
          firstname: userData.firstname,
          lastname: userData.lastname,
          phone: userData.phone,
          role: userData.role || 'user', // Use role from form data, default to 'user'
          token: 'fake-jwt-token',
          password: userData.password // Store password for demo purposes
        };
        
        console.log('Creating new user:', newUser);
        
        // Save to registered users
        this.saveUserToStorage(newUser);
        
        // Set as current user (without password in session)
        const sessionUser = { ...newUser };
        delete sessionUser.password;
        
        localStorage.setItem('currentUser', JSON.stringify(sessionUser));
        this.currentUserSubject.next(sessionUser);
        
        this.debugStorage(); // Debug after setting current user
        
        console.log('Signup successful, user created');
        observer.next(sessionUser);
        observer.complete();
      }, 1000);
    });
  }

  login(username: string, password: string, loginType: 'user' | 'admin' = 'user'): Observable<User> {
    console.log('AuthService login called with:', username, loginType);
    
    // Debug at start of login
    this.debugStorage();
    
    // First check registered users
    const registeredUsers = this.getRegisteredUsers();
    console.log('Checking against registered users:', registeredUsers);
    
    const registeredUser = registeredUsers.find(u => u.email === username && u.password === password);

    // Demo credentials for admin and default users
    const demoCredentials = {
      'user@demo.com': { password: 'password123', role: 'user' },
      'admin@demo.com': { password: 'admin123', role: 'admin' }
    };

    return new Observable(observer => {
      setTimeout(() => {
        let userToLogin: User | null = null;

        // Check if it's a registered user first
        if (registeredUser) {
          console.log('Found registered user:', registeredUser);
          // Check if login type matches user role
          if (loginType === 'admin' && registeredUser.role !== 'admin') {
            observer.error({ error: { message: 'Admin access required' } });
            return;
          }
          userToLogin = registeredUser;
        } 
        // Check demo credentials
        else {
          console.log('Checking demo credentials');
          const userCredentials = demoCredentials[username as keyof typeof demoCredentials];
          
          if (userCredentials && userCredentials.password === password) {
            // Check if login type matches expected role
            if (loginType === 'admin' && userCredentials.role !== 'admin') {
              observer.error({ error: { message: 'Admin access required' } });
              return;
            }

            userToLogin = {
              id: userCredentials.role === 'admin' ? 1 : 2,
              email: username,
              username: username.split('@')[0],
              role: userCredentials.role as 'admin' | 'user',
              token: 'fake-jwt-token'
            };
          }
        }

        if (userToLogin) {
          // Don't store password in currentUser session
          const sessionUser = { ...userToLogin };
          delete sessionUser.password;
          
          localStorage.setItem('currentUser', JSON.stringify(sessionUser));
          this.currentUserSubject.next(sessionUser);
          
          this.debugStorage(); // Debug after successful login
          
          console.log('Login successful:', sessionUser);
          observer.next(sessionUser);
          observer.complete();
        } else {
          console.log('Login failed - invalid credentials');
          observer.error({ error: { message: 'Invalid credentials' } });
        }
      }, 1000);
    });
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  isAdmin(): boolean {
    return this.currentUserValue?.role === 'admin';
  }
}