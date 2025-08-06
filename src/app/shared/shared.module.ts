import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Components
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { ProductCardComponent } from './components/product-card/product-card.component';
import { SearchBarComponent } from './components/search-bar/search-bar.component';
import { CartHeaderComponent } from './components/cart-header/cart-header.component';
import { AddToFavoritesComponent } from './components/add-to-favorites/add-to-favorites.component'; // ✅ Add this

// Pipes
import { CurrencyFormatPipe } from './pipes/currency-format.pipe';
import { TruncatePipe } from './pipes/truncate.pipe';

// Directives
import { LazyLoadDirective } from './directives/lazy-load.directive';

@NgModule({
  declarations: [
    HeaderComponent,
    FooterComponent,
    ProductCardComponent,
    SearchBarComponent,
    CurrencyFormatPipe,
    CartHeaderComponent,
    AddToFavoritesComponent, // ✅ Add this
    TruncatePipe,
    LazyLoadDirective
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    HeaderComponent,
    CartHeaderComponent,
    FooterComponent,
    ProductCardComponent,
    SearchBarComponent,
    AddToFavoritesComponent, // ✅ Add this
    CurrencyFormatPipe,
    TruncatePipe,
    LazyLoadDirective
  ]
})
export class SharedModule { }