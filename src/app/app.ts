import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Layout } from "./layout/layout";
import { MenuItem } from './layout/header/header';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Layout],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'Angular Starter';
  protected menuItems: MenuItem[] = [];
}
