import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  Auth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  authState,
  signOut,
  GoogleAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
  User,
} from '@angular/fire/auth';
import { filter, take, timeout } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { SecurityService } from './securityService';
import { Usuario } from '../models/auth.models';

const MS_REDIRECT_KEY = 'ms_auth_redirect';

@Injectable({ providedIn: 'root' })
export class SocialAuthService {

  private auth = inject(Auth);

  constructor(
    private securityService: SecurityService,
    private router: Router
  ) {}

  async procesarLogin(firebaseUser: User): Promise<void> {
    const token = await firebaseUser.getIdToken();
    const usuario: Usuario = {
      nombre: firebaseUser.displayName ?? firebaseUser.email ?? 'Usuario',
      email: firebaseUser.email ?? '',
      estado: 'activo',
    };
    this.securityService.iniciarSesion(usuario, token);
    this.router.navigate(['/dashboard']);
  }

  async loginConGoogle(): Promise<void> {
    const result = await signInWithPopup(this.auth, new GoogleAuthProvider());
    await this.procesarLogin(result.user);
  }

  async loginConGithub(): Promise<void> {
    const result = await signInWithPopup(this.auth, new GithubAuthProvider());
    await this.procesarLogin(result.user);
  }

  async loginConMicrosoft(): Promise<void> {
    const provider = new OAuthProvider('microsoft.com');
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      // Firebase 12 maneja COOP: same-origin de Microsoft con polling fallback
      const result = await signInWithPopup(this.auth, provider);
      await this.procesarLogin(result.user);
    } catch (popupError: any) {
      // Si el popup falla por COOP, caemos al flujo redirect
      if (popupError?.code === 'auth/popup-blocked' || popupError?.code === 'auth/cancelled-popup-request') {
        throw popupError;
      }
      console.warn('Popup falló, intentando redirect:', popupError?.code);
      localStorage.setItem(MS_REDIRECT_KEY, '1');
      await signInWithRedirect(this.auth, provider);
    }
  }

  async verificarRedirectMicrosoft(): Promise<void> {
    if (!localStorage.getItem(MS_REDIRECT_KEY)) return;
    localStorage.removeItem(MS_REDIRECT_KEY);

    try {
      const result = await getRedirectResult(this.auth);
      if (result?.user) {
        await this.procesarLogin(result.user);
        return;
      }
      const user = await firstValueFrom(
        authState(this.auth).pipe(
          filter((u): u is User => u !== null),
          take(1),
          timeout(8000)
        )
      );
      await this.procesarLogin(user);
    } catch (error) {
      console.error('Microsoft redirect: error al procesar resultado', error);
    }
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.securityService.logout();
    this.router.navigate(['/authentication/login']);
  }
}