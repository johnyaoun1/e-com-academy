import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss']
})
export class SearchBarComponent {
  @Output() search = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();
  
  searchQuery = '';

  onSearch() {
    if (this.searchQuery.trim()) {
      this.search.emit(this.searchQuery);
      this.searchQuery = '';
    }
  }

  onClose() {
    this.close.emit();
  }
}