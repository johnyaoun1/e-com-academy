// src/app/shared/components/header/header.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { FavoritesService } from '../../services/favorites.service';
import { Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  currentUser$: Observable<any>;
  showUserMenu = false;
  favoritesCount$!: Observable<number>;

  constructor(
    private authService: AuthService,
    private router: Router,
    private favoritesService: FavoritesService
  ) {
    this.currentUser$ = this.authService.currentUser;
  }

  ngOnInit(): void {
    this.favoritesCount$ = this.favoritesService.favorites$.pipe(
      map(favorites => favorites.length)
    );

    // ✅ DEBUG: Log user object to see available properties
    this.currentUser$.subscribe(user => {
      console.log('🔍 FULL USER OBJECT:', user);
      console.log('🔍 User properties:', user ? Object.keys(user) : 'No user');
      
      // Check common user ID properties
      if (user) {
        console.log('🔍 user.id:', user.id);
        console.log('🔍 user._id:', user._id);
        console.log('🔍 user.email:', user.email);
        console.log('🔍 user.username:', user.username);
        console.log('🔍 user.sub:', user.sub);
        console.log('🔍 user.firstname:', user.firstname);
        console.log('🔍 user.firstName:', user.firstName);
      }
    });

    // ✅ Migrate guest favorites when user logs in
    this.currentUser$.pipe(
      filter(user => !!user) // Only when user exists (logged in)
    ).subscribe(user => {
      // Small delay to ensure favorites service has processed the user change
      setTimeout(() => {
        this.favoritesService.migrateGuestFavorites();
      }, 100);
    });
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }

  goToProfile() {
    this.showUserMenu = false;
    this.router.navigate(['/profile']);
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }

  logout() {
    this.showUserMenu = false;
    
    // ✅ Clear user-specific favorites data
    this.favoritesService.clearUserData();
    
    this.authService.logout();
  }

  // Close menu when clicking outside
  onClickOutside() {
    this.showUserMenu = false;
  }

  navigateToFavorites(): void {
    this.router.navigate(['/favorites']);
  }
}