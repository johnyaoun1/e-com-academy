import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Product } from '../../../../shared/services/product.service';

@Component({
  selector: 'app-product-info',
  templateUrl: './product-info.component.html',
  styleUrls: ['./product-info.component.scss']
})
export class ProductInfoComponent {
  @Input() product!: Product;
  @Output() quantityChange = new EventEmitter<number>();
  @Output() addToCart = new EventEmitter<void>();

  quantity = 1;
  activeTab = 'description';

  updateQuantity(change: number) {
    const newQuantity = this.quantity + change;
    if (newQuantity > 0) {
      this.quantity = newQuantity;
      this.quantityChange.emit(this.quantity);
    }
  }

  onAddToCart() {
    this.addToCart.emit();
  }
}