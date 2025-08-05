// header.component.ts - Add profile access
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  currentUser$: Observable<any>;
  showUserMenu = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser;
  }

  ngOnInit(): void {}

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }

  goToProfile() {
    this.showUserMenu = false;
    this.router.navigate(['/profile']);
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }

  logout() {
    this.showUserMenu = false;
    this.authService.logout();
  }

  // Close menu when clicking outside
  onClickOutside() {
    this.showUserMenu = false;
  }
}