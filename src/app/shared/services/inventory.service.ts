import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from './product.service';

export interface InventoryItem {
  productId: number;
  productName: string;
  productImage: string;
  currentStock: number;
  initialStock: number;
  price: number;
  category: string;
  lastUpdated: Date;
}

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private inventoryItems = new BehaviorSubject<InventoryItem[]>([]);
  public inventoryItems$ = this.inventoryItems.asObservable();

  constructor() {
    this.loadInventory();
  }

  private loadInventory(): void {
    const savedInventory = localStorage.getItem('inventory_data');
    if (savedInventory) {
      try {
        const inventory = JSON.parse(savedInventory);
        this.inventoryItems.next(inventory);
      } catch (e) {
        console.error('Failed to load inventory', e);
        this.initializeDefaultInventory();
      }
    } else {
      this.initializeDefaultInventory();
    }
  }

  private saveInventory(): void {
    try {
      localStorage.setItem('inventory_data', JSON.stringify(this.inventoryItems.value));
    } catch (e) {
      console.error('Failed to save inventory', e);
    }
  }

  private initializeDefaultInventory(): void {
    // Initialize with some default inventory items
    // You can populate this with your actual products
    const defaultInventory: InventoryItem[] = [
      {
        productId: 1,
        productName: 'Sample Product 1',
        productImage: '/assets/product1.jpg',
        currentStock: 50,
        initialStock: 50,
        price: 29.99,
        category: 'Electronics',
        lastUpdated: new Date()
      },
      {
        productId: 2,
        productName: 'Sample Product 2',
        productImage: '/assets/product2.jpg',
        currentStock: 30,
        initialStock: 30,
        price: 49.99,
        category: 'Clothing',
        lastUpdated: new Date()
      }
    ];
    
    this.inventoryItems.next(defaultInventory);
    this.saveInventory();
  }

  // Add or update inventory item
  addOrUpdateInventoryItem(product: Product, stock: number): void {
    const currentInventory = [...this.inventoryItems.value];
    const existingItemIndex = currentInventory.findIndex(item => item.productId === product.id);

    const inventoryItem: InventoryItem = {
      productId: product.id,
      productName: product.title,
      productImage: product.image,
      currentStock: stock,
      initialStock: existingItemIndex > -1 ? currentInventory[existingItemIndex].initialStock : stock,
      price: product.price,
      category: product.category,
      lastUpdated: new Date()
    };

    if (existingItemIndex > -1) {
      currentInventory[existingItemIndex] = inventoryItem;
    } else {
      currentInventory.push(inventoryItem);
    }

    this.inventoryItems.next(currentInventory);
    this.saveInventory();
  }

  // Reduce stock when order is placed
  reduceStock(productId: number, quantity: number): boolean {
    const currentInventory = [...this.inventoryItems.value];
    const itemIndex = currentInventory.findIndex(item => item.productId === productId);

    if (itemIndex > -1) {
      const item = currentInventory[itemIndex];
      if (item.currentStock >= quantity) {
        item.currentStock -= quantity;
        item.lastUpdated = new Date();
        this.inventoryItems.next(currentInventory);
        this.saveInventory();
        return true;
      } else {
        console.warn(`Insufficient stock for product ${productId}. Available: ${item.currentStock}, Requested: ${quantity}`);
        return false;
      }
    }
    
    console.warn(`Product ${productId} not found in inventory`);
    return false;
  }

  // Restore stock (for cancelled orders)
  restoreStock(productId: number, quantity: number): void {
    const currentInventory = [...this.inventoryItems.value];
    const itemIndex = currentInventory.findIndex(item => item.productId === productId);

    if (itemIndex > -1) {
      currentInventory[itemIndex].currentStock += quantity;
      currentInventory[itemIndex].lastUpdated = new Date();
      this.inventoryItems.next(currentInventory);
      this.saveInventory();
    }
  }

  // Update stock manually (admin function)
  updateStock(productId: number, newStock: number): void {
    const currentInventory = [...this.inventoryItems.value];
    const itemIndex = currentInventory.findIndex(item => item.productId === productId);

    if (itemIndex > -1) {
      currentInventory[itemIndex].currentStock = newStock;
      currentInventory[itemIndex].lastUpdated = new Date();
      this.inventoryItems.next(currentInventory);
      this.saveInventory();
    }
  }

  // Check if product is available in sufficient quantity
  isAvailable(productId: number, quantity: number = 1): boolean {
    const item = this.inventoryItems.value.find(item => item.productId === productId);
    return item ? item.currentStock >= quantity : false;
  }

  // Get current stock for a product
  getCurrentStock(productId: number): number {
    const item = this.inventoryItems.value.find(item => item.productId === productId);
    return item ? item.currentStock : 0;
  }

  // Get low stock items (less than 10)
  getLowStockItems(): InventoryItem[] {
    return this.inventoryItems.value.filter(item => item.currentStock < 10);
  }

  // Get out of stock items
  getOutOfStockItems(): InventoryItem[] {
    return this.inventoryItems.value.filter(item => item.currentStock === 0);
  }
}