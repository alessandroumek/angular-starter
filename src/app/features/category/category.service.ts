// services/category.service.ts
import { inject, Injectable } from '@angular/core';

import { Category } from '../../models/category';
import { SupabaseService } from '../../core/supabase.service';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private table = 'Category';

  private supabaseService: SupabaseService = inject(SupabaseService);

  get client () { return this.supabaseService.client };

  async getAll(): Promise<Category[]> {
    const { data, error } = await this.client.from(this.table).select('*').order('name');
    if (error) throw error;
    return data as Category[];
  }

  async getById(id: string): Promise<Category | null> {
    const { data, error } = await this.client.from(this.table).select('*').eq('id', id).single();
    if (error) throw error;
    return data as Category;
  }

  async create(category: Partial<Category>): Promise<Category> {
    const { data, error } = await this.client.from(this.table).insert(category).select().single();
    if (error) throw error;
    return data as Category;
  }

  async update(id: string, updates: Partial<Category>): Promise<Category> {
    const { data, error } = await this.client.from(this.table).update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as Category;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from(this.table).delete().eq('id', id);
    if (error) throw error;
  }
}
