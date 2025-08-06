// src/app/shared/components/add-to-favorites/add-to-favorites.component.ts
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FavoritesService } from '../../services/favorites.service';
import { Product } from '../../services/product.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-add-to-favorites',
  templateUrl: './add-to-favorites.component.html',
  styleUrls: ['./add-to-favorites.component.scss']
})
export class AddToFavoritesComponent implements OnInit, OnDestroy {
  @Input() product!: Product;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  
  isInFavorites = false;
  private subscription = new Subscription();

  constructor(private favoritesService: FavoritesService) {}

  ngOnInit(): void {
    this.isInFavorites = this.favoritesService.isInFavorites(this.product.id);

    this.subscription.add(
      this.favoritesService.favorites$.subscribe(favorites => {
        this.isInFavorites = favorites.some(fav => fav.id === this.product.id);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  toggleFavorite(): void {
    this.favoritesService.toggleFavorite(this.product);
  }
}