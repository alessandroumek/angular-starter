import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;

  user = signal<User | null>(null); // Signal to track authentication state
  loading = signal(true);  

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    this.checkAuth();
  }

  get client() {
    return this.supabase;
  }

  private async checkAuth() {
    const { data, error } = await this.supabase.auth.getUser();
    if (error) {
      this.user.set(null);
    } else {
      this.user.set(data.user);
    }
    this.loading.set(false);
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.user.set(session?.user || null);
    });
  }

  async signIn(email: string, password: string) {
    this.loading.set(true);
    const {data: { user }, error} = await this.supabase.auth.signInWithPassword({ email, password });
    this.loading.set(false);
    if (error) throw error;
    if(user){
      this.user.set(user);
    }
    return user;
  }

  async signOut() {
    await this.supabase.auth.signOut();
  }

}