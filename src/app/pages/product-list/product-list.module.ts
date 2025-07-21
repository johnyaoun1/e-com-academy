import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductListComponent } from '../product-list.component';
import { FilterSidebarComponent } from './components/filter-sidebar/filter-sidebar.component';
import { ProductGridComponent } from './components/product-grid/product-grid.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    ProductListComponent,
    FilterSidebarComponent,
    ProductGridComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild([
      { path: '', component: ProductListComponent }
    ])
  ]
})
export class ProductListModule { }