import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductService, Product } from '../shared/services/product.service';
import { CartService } from '../shared/services/cart.service';
import { Observable, switchMap } from 'rxjs';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit {
  product$!: Observable<Product>;
  similarProducts$!: Observable<Product[]>;
  quantity = 1;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService
  ) {}

  ngOnInit() {
    this.product$ = this.route.params.pipe(
      switchMap(params => this.productService.getProductById(+params['id']))
    );

    this.similarProducts$ = this.product$.pipe(
      switchMap(product => this.productService.getSimilarProducts(product))
    );
  }

  onQuantityChange(quantity: number) {
    this.quantity = quantity;
  }

  addToCart(product: Product) {
    this.cartService.addToCart(product, this.quantity);
  }
}