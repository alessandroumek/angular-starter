import { Component, computed, inject, signal, WritableSignal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Layout } from "./layout/layout";
import { MenuItem } from './layout/header/header';
import { Authenticate } from './authenticate/authenticate';
import { SupabaseService } from './core/supabase.service';

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

  private supabaseService: SupabaseService = inject(SupabaseService);

  user = computed(()=> this.supabaseService.user()); 
  loading = computed(() => this.supabaseService.loading());

  async signIn($event: { email: string; password: string; }){  
    await this.supabaseService.signIn($event.email, $event.password)
  }

  signOut(){
    this.supabaseService.signOut();
  }
}
