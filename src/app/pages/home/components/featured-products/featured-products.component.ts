import { Component, Input } from '@angular/core';
import { Product } from '../../../../shared/services/product.service';

@Component({
  selector: 'app-featured-products',
  templateUrl: './featured-products.component.html',
  styleUrls: ['./featured-products.component.scss']
})
export class FeaturedProductsComponent {
  @Input() products: Product[] | null = [];
}