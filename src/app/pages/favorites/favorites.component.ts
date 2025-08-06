// src/app/pages/favorites/favorites.component.ts
import { Component, OnInit } from '@angular/core';
import { FavoritesService } from '../../shared/services/favorites.service';
import { Product } from '../../shared/services/product.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.scss']
})
export class FavoritesPageComponent implements OnInit {
  favorites$!: Observable<Product[]>;

  constructor(private favoritesService: FavoritesService) {}

  ngOnInit(): void {
    this.favorites$ = this.favoritesService.favorites$;
  }

  clearAllFavorites(): void {
    if (confirm('Are you sure you want to clear all favorites?')) {
      this.favoritesService.clearFavorites();
    }
  }

  trackByProductId(index: number, product: Product): number {
    return product.id;
  }

  // ✅ Debug methods (temporary)
  getCurrentUserId(): string | null {
    return this.favoritesService.getCurrentUserId();
  }

  clearUserFavorites(): void {
    this.favoritesService.clearFavorites();
    console.log('Cleared favorites for current user');
  }

  showLocalStorageKeys(): void {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('favorites_'));
    console.log('All favorites storage keys:', keys);
    
    keys.forEach(key => {
      const data = localStorage.getItem(key);
      const count = data ? JSON.parse(data).length : 0;
      console.log(`${key}: ${count} items`);
    });
  }
}