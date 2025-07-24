import { Component, signal, WritableSignal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Layout } from "./layout/layout";
import { MenuItem } from './layout/header/header';
import { Authenticate } from './authenticate/authenticate';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Layout, Authenticate],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'Angular Starter';
  protected menuItems: MenuItem[] = [];

  // Implemented base login code just for test ui
  // change user() signIn() signOut() to interact with your backend  
  private _user : WritableSignal<null | { name: string }> = signal(null);

  get user() {
    return this._user;
  }

  loading = signal(false);

  signIn($event: { email: string; password: string; }){
    console.log('signIn', $event)
    this._user.set({
      name: $event.email
    })
  }

  signOut(){
    this._user.set(null);
  }
}
