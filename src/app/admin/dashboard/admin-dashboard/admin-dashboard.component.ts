import { Component, OnInit, Inject } from '@angular/core';
// Update the import path to the correct location of product.service.ts
import { ProductService, Product } from '../../../shared/services/product.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SharedModule } from "../../../shared/shared.module";

interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  totalOrders: number;
  totalRevenue: number;
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  stats: DashboardStats = {
    totalProducts: 0,
    totalCategories: 0,
    totalOrders: 0,
    totalRevenue: 0
  };
  recentProducts$!: Observable<Product[]>;

  constructor(@Inject(ProductService) private productService: ProductService) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.productService.getAllProducts().subscribe(products => {
      this.stats.totalProducts = products.length;
      this.stats.totalRevenue = products.reduce((sum, p) => sum + p.price, 0);
    });

    this.productService.getCategories().subscribe(categories => {
      this.stats.totalCategories = categories.length;
    });

    this.recentProducts$ = this.productService.getAllProducts().pipe(
      map(products => products.slice(0, 5))
    );
  }
  
}
