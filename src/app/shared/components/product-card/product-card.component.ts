import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss']
})
export class ProductCardComponent {
  @Input() product: any;
  
  constructor(private router: Router) {}

  viewProduct(): void {
    if (this.product?.id) {
      this.router.navigate(['/product', this.product.id]);
    }
  }

  addToCart(event: Event): void {
    event.stopPropagation();
    console.log('Add to cart:', this.product);
  }
}