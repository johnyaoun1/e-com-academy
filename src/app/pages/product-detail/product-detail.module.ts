import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductDetailComponent } from '../product-detail.component';
import { ProductGalleryComponent } from './components/product-gallery/product-gallery.component';
import { ProductInfoComponent } from './components/product-info/product-info.component';
import { SimilarProductsComponent } from './components/similar-products/similar-products.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    ProductDetailComponent,
    ProductGalleryComponent,
    ProductInfoComponent,
    SimilarProductsComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild([
      { path: '', component: ProductDetailComponent }
    ])
  ]
})
export class ProductDetailModule { }