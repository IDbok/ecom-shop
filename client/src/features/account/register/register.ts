import { Component, inject, OnInit, output, signal } from '@angular/core';
import {  AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { RegisterCreds } from '../../../types/user';
import { AccountService } from '../../../core/services/account-service';
import { JsonPipe } from '@angular/common';
import { TextInput } from '../../../shared/text-input/text-input';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, JsonPipe, TextInput],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register implements OnInit {
  private accountService = inject(AccountService);
  private formBuilder = inject(FormBuilder);
  cancelRegister = output<boolean>();
  protected creds = {} as RegisterCreds;
  protected currentStep = signal(1);
  protected credentialsForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    displayName: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(10)]],
    confirmPassword: ['', [Validators.required, this.matchValues('password')]],
  });
  protected profileForm = this.formBuilder.group({
    gender: ['', [Validators.required]],
    dateOfBirth: ['', [Validators.required]],
    city: ['', [Validators.required]],
    country: ['', [Validators.required]],
  });

  ngOnInit(): void {
    this.credentialsForm.get('password')!.valueChanges.subscribe(() =>
      this.credentialsForm.get('confirmPassword')!.updateValueAndValidity()
    );
  }

  matchValues(matchTo: string): ValidatorFn {
    return (control: AbstractControl) : ValidationErrors | null => {
      return control?.value === control?.parent?.get(matchTo)?.value
        ? null
        : { passwordMismatch: true };
    }
  }

  nextStep() {
    if (this.credentialsForm.valid) {
      this.currentStep.update(prevStep => prevStep + 1);
    }
  }

  previousStep() {    
    this.currentStep.update(privStep => privStep - 1);
  }

  register() {
    if (this.credentialsForm.valid && this.profileForm.valid) {
      const formData = {
        ...this.credentialsForm.value,
        ...this.profileForm.value
      }
      console.log('FormData', formData);
    }
    // this.accountService.register(this.creds).subscribe({
    //   next: response => {
    //     console.log(response);
    //     this.cancel();
    //   },
    //   error: error => console.log(error)
    // });
  }

  cancel() {
    console.log('cancelled');
    this.cancelRegister.emit(false);
  }
}
