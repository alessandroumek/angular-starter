import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Category } from '../../models/category';

@Component({
  selector: 'app-category-list',
  imports: [ReactiveFormsModule],
  templateUrl: './category-list.html',
  styles: ``
})
export class CategoryList {
  @Input() categories: Category[] = [];
  @Input() editingId: string | null = null;

  @Output() edit = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();
  @Output() delete = new EventEmitter<string>();
  @Output() saveEdit = new EventEmitter<{ id: string; name: string }>();

  editForms = new Map<string, ReturnType<FormBuilder['group']>>();

  constructor(private fb: FormBuilder) { }

  getForm(id: string, name: string) {
    if (!this.editForms.has(id)) {
      this.editForms.set(
        id,
        this.fb.group({
          name: [name, [Validators.required, Validators.minLength(2)]],
        })
      );
    }
    return this.editForms.get(id)!;
  }

  onSave(id: string) {
    const form = this.editForms.get(id);
    if (form?.valid) {
      this.saveEdit.emit({ id, name: form.value.name });
      this.editForms.delete(id);
    }
  }
}
