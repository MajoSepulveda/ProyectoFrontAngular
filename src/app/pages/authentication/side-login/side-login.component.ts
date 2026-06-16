import { Component, inject, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { SocialAuthService } from 'src/app/services/socialAuthService';

@Component({
  selector: 'app-side-login',
  imports: [RouterModule, MaterialModule, FormsModule, ReactiveFormsModule],
  templateUrl: './side-login.component.html',
})
export class AppSideLoginComponent implements OnInit {

  private socialAuth = inject(SocialAuthService);

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.socialAuth.verificarRedirectMicrosoft();
  }

  form = new FormGroup({
    uname: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
    ]),
    password: new FormControl('', [Validators.required]),
  });

  get f() {
    return this.form.controls;
  }

  submit() {
    this.router.navigate(['/dashboard']);
  }

  async loginConGoogle(): Promise<void> {
    try {
      await this.socialAuth.loginConGoogle();
    } catch (error: any) {
      console.error('Error Google:', error?.code, error?.message);
    }
  }

  async loginConGithub(): Promise<void> {
    try {
      await this.socialAuth.loginConGithub();
    } catch (error: any) {
      console.error('Error GitHub:', error?.code, error?.message);
    }
  }

  async loginConMicrosoft(): Promise<void> {
    try {
      await this.socialAuth.loginConMicrosoft();
    } catch (error: any) {
      console.error('Error Microsoft:', error?.code, error?.message);
    }
  }
}
