import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-hero',
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.scss']
})
export class HeroComponent {
  constructor(private router: Router) {}

  hopNow(): void {
  // Navigate to products page
  this.router.navigate(['/products']);
}

exploreCollection(): void {
  // Scroll to featured products or navigate to specific collection
  const element = document.querySelector('.featured-products');
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  } else {
    this.router.navigate(['/products']);
  }
}

}