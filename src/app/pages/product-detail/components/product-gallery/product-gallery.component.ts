import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-product-gallery',
  templateUrl: './product-gallery.component.html',
  styleUrls: ['./product-gallery.component.scss']
})
export class ProductGalleryComponent {
  @Input() images: string[] = [];
  selectedImage = 0;

  selectImage(index: number) {
    this.selectedImage = index;
  }
}