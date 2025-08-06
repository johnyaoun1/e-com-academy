import { Component, OnInit } from '@angular/core';
import { OrderService, Order } from '../../../shared/services/order.service';
import { InventoryService, InventoryItem } from '../../../shared/services/inventory.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  // Orders data
  orders: Order[] = [];
  totalRevenue = 0;
  totalOrders = 0;
  recentOrders: Order[] = [];
  
  // Inventory data
  inventoryItems: InventoryItem[] = [];
  lowStockItems: InventoryItem[] = [];
  outOfStockItems: InventoryItem[] = [];
  totalProducts = 0;
  
  // Active tab - explicitly typed to avoid TypeScript errors
  activeTab: 'orders' | 'inventory' | 'dashboard' = 'dashboard';

  constructor(
    private orderService: OrderService,
    private inventoryService: InventoryService
  ) {
    // Bind global functions for inline actions
    (window as any).updateOrderStatus = this.updateOrderStatus.bind(this);
    (window as any).updateStock = this.updateInventoryStock.bind(this);
  }

  ngOnInit(): void {
    // Subscribe to orders
    this.orderService.orders$.subscribe(orders => {
      this.orders = orders;
      this.totalOrders = orders.length;
      this.totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
      this.recentOrders = orders.slice(0, 5);
    });

    // Subscribe to inventory
    this.inventoryService.inventoryItems$.subscribe(items => {
      this.inventoryItems = items;
      this.totalProducts = items.length;
      this.lowStockItems = this.inventoryService.getLowStockItems();
      this.outOfStockItems = this.inventoryService.getOutOfStockItems();
    });
  }

  setActiveTab(tab: 'orders' | 'inventory' | 'dashboard'): void {
    this.activeTab = tab;
  }

  getStatusColor(status: string): string {
    switch(status) {
      case 'Processing': return '#FFA500';
      case 'Shipped': return '#1E90FF';
      case 'Delivered': return '#32CD32';
      case 'Cancelled': return '#FF0000';
      default: return '#000000';
    }
  }

  updateOrderStatus(id: number, status: Order['status']): void {
    // If order is being cancelled, restore stock
    if (status === 'Cancelled') {
      const order = this.orders.find(o => o.id === id);
      if (order) {
        order.items.forEach(item => {
          this.inventoryService.restoreStock(item.productId, item.quantity);
        });
      }
    }
    
    this.orderService.updateOrderStatus(id, status);
  }

  updateInventoryStock(productId: number): void {
    const inputElement = document.getElementById(`stock-${productId}`) as HTMLInputElement;
    if (inputElement) {
      const newStock = parseInt(inputElement.value, 10);
      if (!isNaN(newStock) && newStock >= 0) {
        this.inventoryService.updateStock(productId, newStock);
      } else {
        alert('Please enter a valid stock quantity');
      }
    }
  }

  // Dashboard summary methods
  getOrdersToday(): number {
    const today = new Date().toDateString();
    return this.orders.filter(order => 
      new Date(order.date).toDateString() === today
    ).length;
  }

  getRevenueToday(): number {
    const today = new Date().toDateString();
    return this.orders
      .filter(order => new Date(order.date).toDateString() === today)
      .reduce((sum, order) => sum + order.total, 0);
  }

  getPendingOrders(): number {
    return this.orders.filter(order => order.status === 'Processing').length;
  }

  getStockAlerts(): number {
    return this.lowStockItems.length + this.outOfStockItems.length;
  }

  // Export functions
  exportOrders(): void {
    const csvContent = this.convertOrdersToCSV();
    this.downloadCSV(csvContent, 'orders_export.csv');
  }

  exportInventory(): void {
    const csvContent = this.convertInventoryToCSV();
    this.downloadCSV(csvContent, 'inventory_export.csv');
  }

  private convertOrdersToCSV(): string {
    const headers = ['Order ID', 'Customer', 'Email', 'Total', 'Date', 'Status', 'Items'];
    const rows = this.orders.map(order => [
      order.id,
      order.customerName,
      order.email,
      order.total.toFixed(2),
      new Date(order.date).toLocaleDateString(),
      order.status,
      order.items.map(item => `${item.name} (${item.quantity})`).join('; ')
    ]);

    return [headers, ...rows].map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');
  }

  private convertInventoryToCSV(): string {
    const headers = ['Product ID', 'Product Name', 'Category', 'Price', 'Current Stock', 'Initial Stock', 'Last Updated'];
    const rows = this.inventoryItems.map(item => [
      item.productId,
      item.productName,
      item.category,
      item.price.toFixed(2),
      item.currentStock,
      item.initialStock,
      new Date(item.lastUpdated).toLocaleDateString()
    ]);

    return [headers, ...rows].map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');
  }

  private downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}