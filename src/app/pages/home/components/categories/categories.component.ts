import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent {
  @Input() categories: string[] | null = [];

  categoryImages: { [key: string]: string } = {
    "men's clothing": 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=400',
    "women's clothing": 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400',
    "jewelery": 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400',
    "electronics": 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400'
  };

  constructor(private router: Router) {}

  navigateToCategory(category: string) {
    this.router.navigate(['/products'], { queryParams: { category } });
  }
}