import { Directive, ElementRef, HostBinding, Input, OnInit } from '@angular/core';

@Directive({
  selector: '[appLazyLoad]'
})
export class LazyLoadDirective implements OnInit {
  @HostBinding('attr.loading') loading = 'lazy';
  @Input() appLazyLoad?: string;

  constructor(private el: ElementRef) {}

  ngOnInit() {
    if (this.appLazyLoad && this.el.nativeElement.tagName === 'IMG') {
      this.el.nativeElement.src = this.appLazyLoad;
    }
  }
}