import { Component, OnInit } from '@angular/core';
import { ProductService, Product } from '../../../shared/services/product.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ColDef, GridReadyEvent, GridApi, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';

interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  totalOrders: number;
  totalRevenue: number;
}

interface Order {
  id: number;
  customerName: string;
  date: string;
  total: number;
  status: string;
  items: number;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  orders: number;
  totalSpent: number;
  lastOrder: string;
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
    totalOrders: 150,
    totalRevenue: 0
  };

  // AG-Grid configurations
  private gridApi!: GridApi;
  private productGridApi!: GridApi;
  private orderGridApi!: GridApi;
  private customerGridApi!: GridApi;

  // Product Grid
  productColumnDefs: ColDef[] = [
    { field: 'id', headerName: 'ID', width: 80, sortable: true, filter: true },
    { field: 'title', headerName: 'Product Name', flex: 1, sortable: true, filter: true },
    { 
      field: 'price', 
      headerName: 'Price', 
      width: 120, 
      sortable: true, 
      filter: 'agNumberColumnFilter',
      valueFormatter: (params: ValueFormatterParams) => `$${params.value?.toFixed(2)}` 
    },
    { field: 'category', headerName: 'Category', width: 150, sortable: true, filter: true },
    { 
      field: 'rating.rate', 
      headerName: 'Rating', 
      width: 100, 
      sortable: true,
      valueFormatter: (params: ValueFormatterParams) => `${params.value?.toFixed(1)}⭐` 
    },
    {
      headerName: 'Actions',
      width: 150,
      cellRenderer: (params: ICellRendererParams) => `
        <button class="btn-edit" onclick="window.editProduct(${params.data.id})">Edit</button>
        <button class="btn-delete" onclick="window.deleteProduct(${params.data.id})">Delete</button>
      `
    }
  ];

  // Orders Grid
  orderColumnDefs: ColDef[] = [
    { field: 'id', headerName: 'Order ID', width: 100, sortable: true, filter: true },
    { field: 'customerName', headerName: 'Customer', flex: 1, sortable: true, filter: true },
    { 
      field: 'date', 
      headerName: 'Date', 
      width: 120, 
      sortable: true,
      valueFormatter: (params: ValueFormatterParams) => new Date(params.value).toLocaleDateString()
    },
    { 
      field: 'total', 
      headerName: 'Total', 
      width: 120, 
      sortable: true,
      valueFormatter: (params: ValueFormatterParams) => `$${params.value?.toFixed(2)}`
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 120, 
      sortable: true,
      cellRenderer: (params: ICellRendererParams) => {
        const status = params.value;
        const statusClass = status === 'Completed' ? 'status-completed' : 
                           status === 'Pending' ? 'status-pending' : 'status-cancelled';
        return `<span class="${statusClass}">${status}</span>`;
      }
    },
    { field: 'items', headerName: 'Items', width: 80, sortable: true }
  ];

  // Customers Grid
  customerColumnDefs: ColDef[] = [
    { field: 'id', headerName: 'ID', width: 80, sortable: true, filter: true },
    { field: 'name', headerName: 'Name', flex: 1, sortable: true, filter: true },
    { field: 'email', headerName: 'Email', flex: 1, sortable: true, filter: true },
    { field: 'orders', headerName: 'Orders', width: 100, sortable: true },
    { 
      field: 'totalSpent', 
      headerName: 'Total Spent', 
      width: 130, 
      sortable: true,
      valueFormatter: (params: ValueFormatterParams) => `$${params.value?.toFixed(2)}`
    },
    { 
      field: 'lastOrder', 
      headerName: 'Last Order', 
      width: 120, 
      sortable: true,
      valueFormatter: (params: ValueFormatterParams) => new Date(params.value).toLocaleDateString()
    }
  ];

  // Data
  products: Product[] = [];
  orders: Order[] = [];
  customers: Customer[] = [];

  // Grid options
  defaultColDef: ColDef = {
    resizable: true,
    sortable: true,
    filter: true
  };

  constructor(private productService: ProductService) {
    // Bind global functions for actions
    (window as any).editProduct = this.editProduct.bind(this);
    (window as any).deleteProduct = this.deleteProduct.bind(this);
  }

  ngOnInit(): void {
    this.loadDashboardData();
    this.generateMockData();
  }

  loadDashboardData(): void {
    this.productService.getAllProducts().subscribe(products => {
      this.products = products;
      this.stats.totalProducts = products.length;
      this.stats.totalRevenue = products.reduce((sum, p) => sum + p.price, 0);
    });

    this.productService.getCategories().subscribe(categories => {
      this.stats.totalCategories = categories.length;
    });
  }

  generateMockData(): void {
    // Generate mock orders
    this.orders = Array.from({ length: 25 }, (_, i) => ({
      id: 1000 + i,
      customerName: `Customer ${i + 1}`,
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      total: Math.random() * 500 + 50,
      status: ['Completed', 'Pending', 'Cancelled'][Math.floor(Math.random() * 3)],
      items: Math.floor(Math.random() * 5) + 1
    }));

    // Generate mock customers
    this.customers = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: `Customer ${i + 1}`,
      email: `customer${i + 1}@example.com`,
      orders: Math.floor(Math.random() * 10) + 1,
      totalSpent: Math.random() * 1000 + 100,
      lastOrder: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString()
    }));
  }

  // Grid events
  onProductGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.productGridApi = params.api;
    params.api.sizeColumnsToFit();
  }

  onOrderGridReady(params: GridReadyEvent): void {
    this.orderGridApi = params.api;
    params.api.sizeColumnsToFit();
  }

  onCustomerGridReady(params: GridReadyEvent): void {
    this.customerGridApi = params.api;
    params.api.sizeColumnsToFit();
  }

  // Action methods
  editProduct(productId: number): void {
    console.log('Edit product:', productId);
    // Implement edit functionality
  }

  deleteProduct(productId: number): void {
    console.log('Delete product:', productId);
    // Implement delete functionality
  }

  // Export functionality
  exportProducts(): void {
    if (this.productGridApi) {
      this.productGridApi.exportDataAsCsv({ fileName: 'products.csv' });
    }
  }

  exportOrders(): void {
    if (this.orderGridApi) {
      this.orderGridApi.exportDataAsCsv({ fileName: 'orders.csv' });
    }
  }

  exportCustomers(): void {
    if (this.customerGridApi) {
      this.customerGridApi.exportDataAsCsv({ fileName: 'customers.csv' });
    }
  }
}