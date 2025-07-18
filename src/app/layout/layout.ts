import { Component, Input, input } from '@angular/core';
import { Footer } from './footer/footer';
import { Header, MenuItem } from './header/header';

@Component({
  selector: 'app-layout',
  imports: [Footer, Header],
  templateUrl: './layout.html',
  styles: ``
})
export class Layout {
  @Input() title: string = '';
  @Input() menuItems: MenuItem[] = [];
}
