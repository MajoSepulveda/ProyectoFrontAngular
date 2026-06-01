import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MaterialModule } from '../../material.module';
import { SecurityService } from '../../services/securityService';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
  formularioLogin!: FormGroup;
  cargando = false;
  mensajeError: string | null = null;
  mensajeExito: string | null = null;
  mostrarPassword = false;

  constructor(
    private fb: FormBuilder,
    private securityService: SecurityService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
  }

  private inicializarFormulario(): void {
    this.formularioLogin = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  /**
   * Ejecuta el login del usuario
   */
  ejecutarLogin(): void {
    if (this.formularioLogin.invalid) {
      this.mensajeError = 'Por favor, completa correctamente todos los campos';
      return;
    }

    this.cargando = true;
    this.mensajeError = null;
    this.mensajeExito = null;

    const { email, password } = this.formularioLogin.value;

    this.securityService.login(email, password).subscribe({
      next: (response) => {
        this.cargando = false;
        if (response.success) {
          this.mensajeExito = `¡Bienvenido ${response.usuario?.nombre}!`;
          
          // Redirigir según el rol
          setTimeout(() => {
            this.redirigirSegunRol(response.usuario?.rol);
          }, 1500);
        }
      },
      error: (error) => {
        this.cargando = false;
        this.mensajeError = error.message || 'Error al iniciar sesión. Verifica tus credenciales.';
      }
    });
  }

  /**
   * Redirige al usuario según su rol
   */
  private redirigirSegunRol(rol?: string): void {
    switch (rol) {
      case 'admin':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'funcionario':
        this.router.navigate(['/funcionario/dashboard']);
        break;
      case 'ciudadano':
      default:
        this.router.navigate(['/ciudadano/dashboard']);
        break;
    }
  }

  /**
   * Alterna la visibilidad de la contraseña
   */
  toggleMostrarPassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  /**
   * Navega al formulario de registro
   */
  irARegistro(): void {
    this.router.navigate(['/registro']);
  }

  /**
   * Obtiene el error de un campo específico
   */
  obtenerError(nombreCampo: string): string {
    const control = this.formularioLogin.get(nombreCampo);
    
    if (!control || !control.errors) {
      return '';
    }

    if (control.hasError('required')) {
      return `${nombreCampo.charAt(0).toUpperCase() + nombreCampo.slice(1)} es requerido`;
    }

    if (control.hasError('email')) {
      return 'Por favor, ingresa un email válido';
    }

    if (control.hasError('minlength')) {
      return `La contraseña debe tener al menos 6 caracteres`;
    }

    return '';
  }
}
