import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService, Product } from '../shared/services/product.service';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Params } from '@angular/router';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {
  products$!: Observable<Product[]>;
  categories$!: Observable<string[]>;
  loading = true;
  selectedCategory = '';
  selectedSort = 'featured';
  priceRange = { min: 0, max: 1000 };
  searchQuery = '';
  showFilters = false;

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router // Add Router injection
  ) {}

  ngOnInit() {
    this.categories$ = this.productService.getCategories();
    
    this.products$ = combineLatest([
      this.route.queryParams,
      this.productService.getAllProducts()
    ]).pipe(
      map(([params, products]: [Params, Product[]]) => {
        this.loading = false;
        
        // Apply search filter
        if (params['search']) {
          this.searchQuery = params['search'];
          products = products.filter(p => 
            p.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(this.searchQuery.toLowerCase())
          );
        }
        
        // Apply category filter
        if (params['category']) {
          this.selectedCategory = params['category'];
          products = products.filter(p => p.category === this.selectedCategory);
        }
        
        return products;
      })
    );
  }

  onFilterChange(filters: any) {
    this.selectedCategory = filters.category;
    this.selectedSort = filters.sort;
    this.priceRange = filters.priceRange;
    
    this.products$ = this.productService.getAllProducts().pipe(
      map(products => {
        // Apply category filter
        if (this.selectedCategory) {
          products = products.filter(p => p.category === this.selectedCategory);
        }
        
        // Apply price filter
        products = products.filter(p => 
          p.price >= this.priceRange.min && p.price <= this.priceRange.max
        );
        
        // Apply search filter
        if (this.searchQuery) {
          products = products.filter(p => 
            p.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(this.searchQuery.toLowerCase())
          );
        }
        
        // Apply sorting
        switch (this.selectedSort) {
          case 'price-low':
            products.sort((a, b) => a.price - b.price);
            break;
          case 'price-high':
            products.sort((a, b) => b.price - a.price);
            break;
          case 'rating':
            products.sort((a, b) => b.rating.rate - a.rating.rate);
            break;
        }
        
        return products;
      })
    );
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }
}