import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { MaterialModule } from '../../material.module';
import { SecurityService } from '../../services/securityService';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './registro.component.html'
})
export class RegistroComponent implements OnInit {
  formularioRegistro!: FormGroup;
  cargando = false;
  mensajeError: string | null = null;
  mensajeExito: string | null = null;
  mostrarPassword = false;
  mostrarConfirmarPassword = false;
  emailVerificando = false;
  emailExiste = false;

  constructor(
    private fb: FormBuilder,
    private securityService: SecurityService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
    this.configurarValidacionEmail();
  }

  private inicializarFormulario(): void {
    this.formularioRegistro = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.pattern(/^[\d\s\-\+\(\)]{7,}$/)]],
      direccion: [''],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmarPassword: ['', Validators.required],
      aceptoTerminos: [false, Validators.requiredTrue]
    }, {
      validators: this.validarPasswordsIguales
    });
  }

  /**
   * Configura la validación de email único con debounce
   */
  private configurarValidacionEmail(): void {
    const emailControl = this.formularioRegistro.get('email');
    
    emailControl?.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      map((email: string) => {
        if (email && this.esCorreoValido(email)) {
          this.emailVerificando = true;
          return email;
        }
        return null;
      })
    ).subscribe((email: string | null) => {
      if (email) {
        this.securityService.verificarEmailRegistrado(email).subscribe({
          next: (existe) => {
            this.emailVerificando = false;
            this.emailExiste = existe;
            if (existe) {
              emailControl?.setErrors({ 'emailExistente': true });
            }
          },
          error: () => {
            this.emailVerificando = false;
          }
        });
      }
    });
  }

  /**
   * Validador personalizado para que las contraseñas coincidan
   */
  private validarPasswordsIguales(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmarPassword = group.get('confirmarPassword')?.value;

    if (password && confirmarPassword && password !== confirmarPassword) {
      group.get('confirmarPassword')?.setErrors({ 'passwordNoCoincide': true });
      return { 'passwordNoCoincide': true };
    }

    return null;
  }

  /**
   * Ejecuta el registro del nuevo usuario (ciudadano)
   */
  ejecutarRegistro(): void {
    if (this.formularioRegistro.invalid || this.emailExiste) {
      this.mensajeError = 'Por favor, completa correctamente todos los campos';
      return;
    }

    this.cargando = true;
    this.mensajeError = null;
    this.mensajeExito = null;

    const formData = this.formularioRegistro.getRawValue();
    const datosRegistro = {
      nombre: formData.nombre,
      email: formData.email,
      telefono: formData.telefono || undefined,
      direccion: formData.direccion || undefined,
      password: formData.password,
      // Los siguientes datos se establecen por defecto en el backend
      rol: 'ciudadano',
      estado: 'activo'
    };

    this.securityService.registro(datosRegistro).subscribe({
      next: (response) => {
        this.cargando = false;
        if (response.success) {
          this.mensajeExito = `¡Bienvenido ${response.usuario?.nombre}! Tu cuenta como ciudadano ha sido creada.`;
          
          // Redirigir al dashboard de ciudadano después de 2 segundos
          setTimeout(() => {
            this.router.navigate(['/ciudadano/dashboard']);
          }, 2000);
        }
      },
      error: (error) => {
        this.cargando = false;
        this.mensajeError = error.message || 'Error al registrarse. Por favor, intenta de nuevo.';
      }
    });
  }

  /**
   * Alterna la visibilidad de la contraseña
   */
  toggleMostrarPassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  /**
   * Alterna la visibilidad de la confirmación de contraseña
   */
  toggleMostrarConfirmarPassword(): void {
    this.mostrarConfirmarPassword = !this.mostrarConfirmarPassword;
  }

  /**
   * Navega al login
   */
  irALogin(): void {
    this.router.navigate(['/login']);
  }

  /**
   * Verifica si un email es válido
   */
  private esCorreoValido(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Obtiene el error de un campo específico
   */
  obtenerError(nombreCampo: string): string {
    const control = this.formularioRegistro.get(nombreCampo);
    
    if (!control || !control.errors) {
      return '';
    }

    if (control.hasError('required')) {
      return `${nombreCampo.charAt(0).toUpperCase() + nombreCampo.slice(1)} es requerido`;
    }

    if (control.hasError('email')) {
      return 'Por favor, ingresa un email válido';
    }

    if (control.hasError('emailExistente')) {
      return 'Este email ya está registrado';
    }

    if (control.hasError('minlength')) {
      const length = control.getError('minlength').requiredLength;
      return `Mínimo ${length} caracteres requeridos`;
    }

    if (control.hasError('pattern')) {
      return 'Formato inválido';
    }

    if (control.hasError('passwordNoCoincide')) {
      return 'Las contraseñas no coinciden';
    }

    if (control.hasError('requiredTrue')) {
      return 'Debes aceptar los términos y condiciones';
    }

    return '';
  }
}
