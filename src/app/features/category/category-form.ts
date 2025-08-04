import { Component, EventEmitter, inject, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-category-form',
  imports: [ReactiveFormsModule],
  templateUrl: './category-form.html',
  styles: ``
})
export class CategoryForm {

  private fb : FormBuilder = inject(FormBuilder);

  @Output() submitName = new EventEmitter<string>();

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
  });

  submit() {
    if (this.form.valid) {
      this.submitName.emit(this.form.value.name!);
      this.form.reset();
    }
  }

}
