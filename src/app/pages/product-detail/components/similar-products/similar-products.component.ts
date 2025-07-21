import { Component, Input } from '@angular/core';
import { Product } from '../../../../shared/services/product.service';

@Component({
  selector: 'app-similar-products',
  templateUrl: './similar-products.component.html',
  styleUrls: ['./similar-products.component.scss']
})
export class SimilarProductsComponent {
  @Input() products: Product[] | null = [];
}