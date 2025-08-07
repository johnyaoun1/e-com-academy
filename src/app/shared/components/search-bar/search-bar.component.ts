// src/app/shared/components/search-bar/search-bar.component.ts
import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss']
})
export class SearchBarComponent {
  @Output() search = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();
  
  searchQuery = '';

  constructor(private router: Router) {}

  onSearch() {
    if (this.searchQuery.trim()) {
      console.log('Searching for:', this.searchQuery);
      
      // Navigate to products page with search query
      this.router.navigate(['/products'], {
        queryParams: { search: this.searchQuery.trim() }
      });
      
      // Emit the search event
      this.search.emit(this.searchQuery);
      
      // Don't clear the search query so user can see what they searched for
    }
  }

  onClose() {
    this.searchQuery = '';
    this.close.emit();
  }
}