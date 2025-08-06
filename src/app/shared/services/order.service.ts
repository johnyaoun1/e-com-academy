import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface OrderItem {
  productId: number;
  name: string;
  quantity: number;
  price: number;
  image: string;
}

export interface Order {
  id: number;
  customerName: string;
  email: string;
  total: number;
  date: string;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  shippingAddress: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: {
    cardLast4: string;
    cardType: string;
  };
  items: OrderItem[];
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private ordersSubject = new BehaviorSubject<Order[]>([]);
  public orders$ = this.ordersSubject.asObservable();

  constructor() {
    this.loadOrders();
  }

  private loadOrders(): void {
    const savedOrders = localStorage.getItem('orders_data');
    if (savedOrders) {
      try {
        const orders = JSON.parse(savedOrders);
        this.ordersSubject.next(orders);
      } catch (e) {
        console.error('Failed to load orders', e);
        this.ordersSubject.next([]);
      }
    }
  }

  private saveOrders(): void {
    try {
      localStorage.setItem('orders_data', JSON.stringify(this.ordersSubject.value));
    } catch (e) {
      console.error('Failed to save orders', e);
    }
  }

  addOrder(order: Order): void {
    const currentOrders = [...this.ordersSubject.value];
    
    // Add timestamp if not present
    if (!order.date) {
      order.date = new Date().toISOString();
    }
    
    // Ensure order has a unique ID
    if (!order.id) {
      order.id = Date.now();
    }
    
    currentOrders.unshift(order); // Add to beginning for latest first
    this.ordersSubject.next(currentOrders);
    this.saveOrders();
  }

  updateOrderStatus(orderId: number, status: Order['status']): void {
    const currentOrders = [...this.ordersSubject.value];
    const orderIndex = currentOrders.findIndex(order => order.id === orderId);
    
    if (orderIndex > -1) {
      currentOrders[orderIndex] = {
        ...currentOrders[orderIndex],
        status
      };
      
      this.ordersSubject.next(currentOrders);
      this.saveOrders();
    }
  }

  getOrderById(orderId: number): Order | undefined {
    return this.ordersSubject.value.find(order => order.id === orderId);
  }

  getOrdersByStatus(status: Order['status']): Order[] {
    return this.ordersSubject.value.filter(order => order.status === status);
  }

  getOrdersByEmail(email: string): Order[] {
    return this.ordersSubject.value.filter(order => 
      order.email.toLowerCase() === email.toLowerCase()
    );
  }

  getOrdersByDateRange(startDate: Date, endDate: Date): Order[] {
    return this.ordersSubject.value.filter(order => {
      const orderDate = new Date(order.date);
      return orderDate >= startDate && orderDate <= endDate;
    });
  }

  getTotalRevenue(): number {
    return this.ordersSubject.value
      .filter(order => order.status !== 'Cancelled')
      .reduce((total, order) => total + order.total, 0);
  }

  getRevenueByDateRange(startDate: Date, endDate: Date): number {
    return this.getOrdersByDateRange(startDate, endDate)
      .filter(order => order.status !== 'Cancelled')
      .reduce((total, order) => total + order.total, 0);
  }

  getTodaysOrders(): Order[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return this.getOrdersByDateRange(today, tomorrow);
  }

  getTodaysRevenue(): number {
    return this.getTodaysOrders()
      .filter(order => order.status !== 'Cancelled')
      .reduce((total, order) => total + order.total, 0);
  }

  getMonthlyStats(year: number, month: number): {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
  } {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);
    
    const monthlyOrders = this.getOrdersByDateRange(startDate, endDate)
      .filter(order => order.status !== 'Cancelled');
    
    const totalRevenue = monthlyOrders.reduce((total, order) => total + order.total, 0);
    const totalOrders = monthlyOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    return {
      totalOrders,
      totalRevenue,
      averageOrderValue
    };
  }

  deleteOrder(orderId: number): void {
    const currentOrders = this.ordersSubject.value.filter(order => order.id !== orderId);
    this.ordersSubject.next(currentOrders);
    this.saveOrders();
  }

  // Get popular products based on order history
  getPopularProducts(): { productId: number; name: string; totalQuantity: number; totalRevenue: number }[] {
    const productStats: { [key: number]: { name: string; totalQuantity: number; totalRevenue: number } } = {};
    
    this.ordersSubject.value
      .filter(order => order.status !== 'Cancelled')
      .forEach(order => {
        order.items.forEach(item => {
          if (!productStats[item.productId]) {
            productStats[item.productId] = {
              name: item.name,
              totalQuantity: 0,
              totalRevenue: 0
            };
          }
          productStats[item.productId].totalQuantity += item.quantity;
          productStats[item.productId].totalRevenue += item.quantity * item.price;
        });
      });
    
    return Object.entries(productStats)
      .map(([productId, stats]) => ({
        productId: parseInt(productId),
        name: stats.name,
        totalQuantity: stats.totalQuantity,
        totalRevenue: stats.totalRevenue
      }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity);
  }

  // Clear all orders (admin function)
  clearAllOrders(): void {
    this.ordersSubject.next([]);
    this.saveOrders();
  }

  // Export orders as JSON
  exportOrdersAsJson(): string {
    return JSON.stringify(this.ordersSubject.value, null, 2);
  }
}