import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styles: ``
})
export class Header {
  @Input() title: string = '';
  @Input() menuItems: MenuItem[] = [];

  @Output() signOut = new EventEmitter<void>();
}

export type MenuItem = {
  text: string;
  link: string[];
};