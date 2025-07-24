import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminDashboardComponent } from './dashboard/admin-dashboard/admin-dashboard.component';
import { AdminProductsComponent } from './products/admin-products/admin-products.component';
import { AdminUsersComponent } from './users/admin-users/admin-users.component';
import { SharedModule } from '../shared/shared.module';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AgGridModule } from 'ag-grid-angular';


@NgModule({
  declarations: [
    AdminDashboardComponent,
    AdminProductsComponent,

  ],
  imports: [
    CommonModule,
    AgGridModule,
    SharedModule,
    AdminUsersComponent,
    RouterModule.forChild([
      {
        path: '',
        canActivate: [AuthGuard],
        data: { roles: ['admin'] },
        children: [
          { path: 'dashboard', component: AdminDashboardComponent },
          { path: 'products', component: AdminProductsComponent },
          { path: 'users', component: AdminUsersComponent },
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
        ]
      }
    ])
  ]
})
export class AdminModule { }