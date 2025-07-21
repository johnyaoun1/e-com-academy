import { Component, OnInit } from '@angular/core';
import { ProductService, Product } from '../../shared/services/product.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  featuredProducts$!: Observable<Product[]>;
  categories$!: Observable<string[]>;

  constructor(private productService: ProductService) {}

  ngOnInit() {
    this.featuredProducts$ = this.productService.getAllProducts().pipe(
      map(products => products.slice(0, 8))
    );
    this.categories$ = this.productService.getCategories();
  }
}