import { Component, Input } from '@angular/core';
import { Product } from '../../../../shared/services/product.service';

@Component({
  selector: 'app-product-grid',
  templateUrl: './product-grid.component.html',
  styleUrls: ['./product-grid.component.scss']
})
export class ProductGridComponent {
  @Input() products: Product[] | null = null;

  trackByProductId(index: number, product: Product): number {
    return product.id;
  }
}