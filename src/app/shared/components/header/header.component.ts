import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  menuOpen = false;
  cartItemCount = 0;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Initialize cart count
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  navigateToCart(): void {
    this.router.navigate(['/cart']);
  }
}