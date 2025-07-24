import { Component, EventEmitter, inject, input, Output, signal } from '@angular/core';
import { FormGroup, Validators, FormBuilder, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-authenticate',
  imports: [ReactiveFormsModule],
  templateUrl: './authenticate.html',
  styles: ``
})
export class Authenticate {
  readonly loading = input(signal(false));
  @Output() submitted = new EventEmitter<{email:string, password: string}>();

  private formBuilder: FormBuilder = inject(FormBuilder);

  loginForm: FormGroup = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
  });

  /**
   * Submit the login form and emit the login credentials as an event.
   *
   * If the form is invalid, this function will mark all form controls as touched.
   * If the form is valid, this function will emit an event with a payload containing
   * the email and password.
   */
  onSubmit(): void {
    this.loginForm.markAllAsTouched();
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.submitted.emit({ email, password });
    }
  }
}
