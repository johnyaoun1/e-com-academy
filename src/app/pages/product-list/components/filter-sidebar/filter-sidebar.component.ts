import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-filter-sidebar',
  templateUrl: './filter-sidebar.component.html',
  styleUrls: ['./filter-sidebar.component.scss']
})
export class FilterSidebarComponent implements OnInit {
  @Input() categories: string[] | null = [];
  @Input() selectedCategory = '';
  @Output() filterChange = new EventEmitter<any>();

  mobileFilterOpen = false;
  selectedSort = 'featured';
  priceRange = { min: 0, max: 1000 };
  maxPrice = 1000;

  sortOptions = [
    { value: 'featured', label: 'Featured' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Top Rated' }
  ];

  ngOnInit() {}

  toggleMobileFilter() {
    this.mobileFilterOpen = !this.mobileFilterOpen;
  }

  onCategoryChange(category: string) {
    this.selectedCategory = category;
    this.emitChanges();
    this.closeMobileFilter();
  }

  onSortChange(sort: string) {
    this.selectedSort = sort;
    this.emitChanges();
    this.closeMobileFilter();
  }

  onPriceChange(type: 'min' | 'max', value: string) {
    const numValue = parseInt(value) || 0;
    this.priceRange[type] = numValue;
    this.emitChanges();
  }

  clearFilters() {
    this.selectedCategory = '';
    this.selectedSort = 'featured';
    this.priceRange = { min: 0, max: 1000 };
    this.emitChanges();
  }

  private emitChanges() {
    this.filterChange.emit({
      category: this.selectedCategory,
      sort: this.selectedSort,
      priceRange: this.priceRange
    });
  }

  private closeMobileFilter() {
    if (this.mobileFilterOpen) {
      this.mobileFilterOpen = false;
    }
  }

  ngOnDestroy() {
    this.mobileFilterOpen = false;
  }
}