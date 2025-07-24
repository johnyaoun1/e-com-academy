import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating: {
    rate: number;
    count: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'https://fakestoreapi.com'; // ✅ Working API
  
  private productsSubject = new BehaviorSubject<Product[]>([]);
  public products$ = this.productsSubject.asObservable();

  constructor(private http: HttpClient) {}

  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products`).pipe(
      tap(products => {
        console.log('✅ Products loaded from FakeStore:', products.length);
        this.productsSubject.next(products);
      })
    );
  }

  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`);
  }

  getProductsByCategory(category: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products/category/${category}`);
  }

  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/products/categories`);
  }

  searchProducts(query: string): Observable<Product[]> {
    return this.getAllProducts().pipe(
      map(products => 
        products.filter(product => 
          product.title.toLowerCase().includes(query.toLowerCase()) ||
          product.description.toLowerCase().includes(query.toLowerCase())
        )
      )
    );
  }

  getSimilarProducts(product: Product): Observable<Product[]> {
    return this.getProductsByCategory(product.category).pipe(
      map(products => products.filter(p => p.id !== product.id).slice(0, 4))
    );
  }
}