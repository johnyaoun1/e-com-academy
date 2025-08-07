import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from './product.service';
import { AuthService } from '../../auth/services/auth.service'; // ✅ Import your auth service

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private favoritesSubject = new BehaviorSubject<Product[]>([]);
  public favorites$ = this.favoritesSubject.asObservable();
  private currentUserId: string | null = null;

  constructor(private authService: AuthService) {
    //  Subscribe to user changes
    this.authService.currentUser.subscribe(user => {
      const rawUserId = user?.id || user?.email || null;
      const newUserId: string | null = rawUserId !== null ? String(rawUserId) : null;
      
      if (newUserId !== this.currentUserId) {
        this.currentUserId = newUserId;
        this.loadFavoritesFromStorage(); // Load favorites for new user
      }
    });
  }

  private getUserFavoritesKey(): string {
    // Use user-specific localStorage key
    return this.currentUserId ? `favorites_${this.currentUserId}` : 'favorites_guest';
  }

  private loadFavoritesFromStorage(): void {
    const favoritesKey = this.getUserFavoritesKey();
    const savedFavorites = localStorage.getItem(favoritesKey);
    
    if (savedFavorites) {
      try {
        const favorites = JSON.parse(savedFavorites);
        this.favoritesSubject.next(favorites);
      } catch (error) {
        console.error('Error loading favorites from localStorage:', error);
        this.favoritesSubject.next([]); // Reset to empty on error
      }
    } else {
      this.favoritesSubject.next([]); // No saved favorites for this user
    }
  }

  private saveFavoritesToStorage(): void {
    const favoritesKey = this.getUserFavoritesKey();
    const favorites = this.favoritesSubject.value;
    localStorage.setItem(favoritesKey, JSON.stringify(favorites));
  }

  addToFavorites(product: Product): void {
    if (!this.currentUserId) {
      console.warn('User not logged in - favorites will be stored as guest');
    }

    const currentFavorites = this.favoritesSubject.value;
    if (!this.isInFavorites(product.id)) {
      const updatedFavorites = [...currentFavorites, product];
      this.favoritesSubject.next(updatedFavorites);
      this.saveFavoritesToStorage();
    }
  }

  removeFromFavorites(productId: number): void {
    const currentFavorites = this.favoritesSubject.value;
    const updatedFavorites = currentFavorites.filter(item => item.id !== productId);
    this.favoritesSubject.next(updatedFavorites);
    this.saveFavoritesToStorage();
  }

  toggleFavorite(product: Product): void {
    if (this.isInFavorites(product.id)) {
      this.removeFromFavorites(product.id);
    } else {
      this.addToFavorites(product);
    }
  }

  isInFavorites(productId: number): boolean {
    return this.favoritesSubject.value.some(item => item.id === productId);
  }

  getFavoritesCount(): number {
    return this.favoritesSubject.value.length;
  }

  clearFavorites(): void {
    this.favoritesSubject.next([]);
    const favoritesKey = this.getUserFavoritesKey();
    localStorage.removeItem(favoritesKey);
  }

  // Clear all user data on logout
  clearUserData(): void {
    this.currentUserId = null;
    this.favoritesSubject.next([]);
  }

  // Get current user ID for debugging
  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  // Migrate guest favorites to logged-in user
  migrateGuestFavorites(): void {
    if (!this.currentUserId) return;

    const guestFavorites = localStorage.getItem('favorites_guest');
    if (guestFavorites) {
      try {
        const guestFavoritesArray = JSON.parse(guestFavorites);
        const currentFavorites = this.favoritesSubject.value;
        
        // Merge guest favorites with user favorites (avoid duplicates)
        const mergedFavorites = [...currentFavorites];
        guestFavoritesArray.forEach((guestFav: Product) => {
          if (!mergedFavorites.some(fav => fav.id === guestFav.id)) {
            mergedFavorites.push(guestFav);
          }
        });

        this.favoritesSubject.next(mergedFavorites);
        this.saveFavoritesToStorage();
        
        // Clear guest favorites after migration
        localStorage.removeItem('favorites_guest');
        
        console.log(`Migrated ${guestFavoritesArray.length} guest favorites to user account`);
      } catch (error) {
        console.error('Error migrating guest favorites:', error);
      }
    }
  }
}