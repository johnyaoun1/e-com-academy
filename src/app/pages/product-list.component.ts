// product-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService, Product } from '../shared/services/product.service';
import { Observable, combineLatest, Subject } from 'rxjs';
import { map, takeUntil, finalize } from 'rxjs/operators';
import { Params } from '@angular/router';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit, OnDestroy {
  products$!: Observable<Product[]>;
  categories$!: Observable<string[]>;
  loading = true;
  selectedCategory = '';
  selectedSort = 'featured';
  priceRange = { min: 0, max: 1000 };
  searchQuery = '';
  showFilters = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    console.log('🚀 ProductListComponent initialized');
    
    // Load categories
    this.categories$ = this.productService.getCategories();
    
    // Load products and handle loading state
    this.products$ = combineLatest([
      this.route.queryParams,
      this.productService.getAllProducts()
    ]).pipe(
      takeUntil(this.destroy$),
      map(([params, products]: [Params, Product[]]) => {
        console.log('📦 Products received:', products.length);
        
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
        
        console.log('🔍 Filtered products:', products.length);
        return products;
      }),
      finalize(() => {
        this.loading = false;
        console.log('✅ Loading completed');
      })
    );

    // Initial load - this ensures products load immediately
    this.loadProducts();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProducts() {
    console.log('🔄 Loading products...');
    this.loading = true;
    
    // Force immediate load
    this.productService.getAllProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          console.log('✅ Products loaded successfully:', products.length);
          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Error loading products:', error);
          this.loading = false;
        }
      });
  }

  onFilterChange(filters: any) {
    console.log('🔧 Filters changed:', filters);
    
    this.selectedCategory = filters.category;
    this.selectedSort = filters.sort;
    this.priceRange = filters.priceRange;
    
    this.products$ = this.productService.getAllProducts().pipe(
      takeUntil(this.destroy$),
      map(products => {
        // Apply category filter
        if (this.selectedCategory && this.selectedCategory !== 'all') {
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
          default:
            // Keep original order for 'featured'
            break;
        }
        
        console.log('🎯 Final filtered products:', products.length);
        return products;
      })
    );
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }
}