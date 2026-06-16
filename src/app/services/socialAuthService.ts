import { Component, inject } from '@angular/core';
import { Auth, signInWithPopup, GoogleAuthProvider, user, GithubAuthProvider, OAuthProvider } from '@angular/fire/auth';


@Component({
  selector: 'app-login',
  template: `<button (click)="loginConGoogle()">Iniciar sesión con Google</button>`,
  standalone: true // Quita esto si tu plantilla usa NgModules antiguos
})
export class LoginComponent {
  // Inyectamos el servicio de autenticación de Firebase
  private auth = inject(Auth); 

  async loginConGoogle() {
    try {
      // Creamos el proveedor de Google
      const proveedor = new GoogleAuthProvider();
      
      // Abrimos la ventana emergente de Google
      const resultado = await signInWithPopup(this.auth, proveedor);
      
      // Aquí ya tienes los datos del usuario autenticado
      console.log('Usuario logueado con éxito:', resultado.user);
      
    } catch (error) {
      console.error('Error al autenticar con Google:', error);
    }
  }

// Dentro de tu clase LoginComponent, añade:
async loginConGithub() {
  try {
    const proveedor = new GithubAuthProvider();
    const resultado = await signInWithPopup(this.auth, proveedor);
    console.log('Usuario de GitHub:', resultado.user);
  } catch (error) {
    console.error('Error con GitHub:', error);
  }
}


// Dentro de tu clase LoginComponent, añade:
async loginConMicrosoft() {
  try {
    const proveedor = new OAuthProvider('microsoft.com');
    const resultado = await signInWithPopup(this.auth, proveedor);
    console.log('Usuario de Microsoft:', resultado.user);
  } catch (error) {
    console.error('Error con Microsoft:', error);
  }
}


}
