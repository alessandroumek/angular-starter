import { Component, inject, signal } from '@angular/core';
import { Category } from '../../models/category';
import { CategoryService } from './category.service';
import { CategoryForm } from './category-form';
import { CategoryList } from './category-list';

@Component({
  selector: 'app-category-container',
  imports: [
    CategoryList,
    CategoryForm
  ],
  templateUrl: './category-container.html',
  styles: ``
})
export class CategoryContainer {
  public categories = signal<Category[]>([]);
  public editingId = signal<string | null>(null);

  private service: CategoryService = inject(CategoryService);

  constructor() {
    this.load();
  }

  async load() {
    const data = await this.service.getAll();
    this.categories.set(data);
  }

  async addCategory(name: string) {
    const newCategory = await this.service.create({ name });
    this.categories.update((prev) => [...prev, newCategory]);
  }

  startEdit(id: string) {
    this.editingId.set(id);
  }

  cancelEdit() {
    this.editingId.set(null);
  }

  async saveEdit(id: string, name: string) {
    const updated = await this.service.update(id, { name });
    this.categories.update((cats) =>
      cats.map((c) => (c.id === id ? updated : c))
    );
    this.cancelEdit();
  }

  async deleteCategory(id: string) {
    await this.service.delete(id);
    this.categories.update((cats) => cats.filter((c) => c.id !== id));
  }
}
