import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Layout } from "./layout/layout";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Layout],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'angular-starter';
}
