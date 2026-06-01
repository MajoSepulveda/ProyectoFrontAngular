# Rutas Necesarias para Frontend Angular

## Actualización de `app.routes.ts`

Agrega las siguientes rutas a tu archivo `app.routes.ts` para que los componentes de autenticación funcionen correctamente:

```typescript
import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegistroComponent } from './components/registro/registro.component';
import { AuthGuard, RoleGuard, AdminGuard, FuncionarioGuard } from './services/auth.guard';

export const routes: Routes = [
  // ==================== RUTAS PÚBLICAS ====================
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'registro',
    component: RegistroComponent,
  },

  // ==================== RUTAS PROTEGIDAS ====================
  
  // Dashboard de Ciudadano (solo ciudadanos)
  {
    path: 'ciudadano',
    canActivate: [RoleGuard],
    data: { roles: ['ciudadano'] },
    children: [
      {
        path: 'dashboard',
        component: DashboardCiudadanoComponent, // Crea este componente
      },
      {
        path: 'perfil',
        component: PerfilCiudadanoComponent, // Crea este componente
      },
      {
        path: 'puntos',
        component: MisPuntosComponent, // Crea este componente
      },
      // Agrega más rutas de ciudadano aquí
    ]
  },

  // Dashboard de Funcionario (funcionarios y admins)
  {
    path: 'funcionario',
    canActivate: [FuncionarioGuard],
    children: [
      {
        path: 'dashboard',
        component: DashboardFuncionarioComponent, // Crea este componente
      },
      {
        path: 'gestion-ciudadanos',
        component: GestionCiudadanosComponent, // Crea este componente
      },
      // Agrega más rutas de funcionario aquí
    ]
  },

  // Dashboard de Administrador (solo admins)
  {
    path: 'admin',
    canActivate: [AdminGuard],
    children: [
      {
        path: 'dashboard',
        component: DashboardAdminComponent, // Crea este componente
      },
      {
        path: 'usuarios',
        component: GestionUsuariosComponent, // Crea este componente
      },
      {
        path: 'roles',
        component: GestionRolesComponent, // Crea este componente
      },
      {
        path: 'secciones',
        component: GestionSeccionesComponent, // Crea este componente
      },
      // Agrega más rutas de admin aquí
    ]
  },

  // Página de acceso denegado
  {
    path: 'acceso-denegado',
    component: AccesoDenegadoComponent, // Crea este componente
  },

  // ==================== RUTAS POR DEFECTO ====================
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
```

---

## Componentes Necesarios a Crear

### 1. Dashboard Ciudadano
**Ruta**: `/ciudadano/dashboard`
- Muestra información del ciudadano
- Puntos acumulados
- Historial de actividades
- Datos personales

### 2. Dashboard Funcionario
**Ruta**: `/funcionario/dashboard`
- Resumen de ciudadanos
- Estadísticas
- Asignaciones de trabajo

### 3. Dashboard Admin
**Ruta**: `/admin/dashboard`
- Vista general del sistema
- Estadísticas globales
- Acceso rápido a gestión

### 4. Gestión de Usuarios (Admin)
**Ruta**: `/admin/usuarios`
- Lista de todos los usuarios
- Crear, editar, eliminar usuarios
- Ver y cambiar roles

### 5. Acceso Denegado
**Ruta**: `/acceso-denegado`
- Página que se muestra cuando un usuario no tiene permisos

---

## Usar los Guards en Rutas

### Guard de Rol Específico
```typescript
{
  path: 'admin/dashboard',
  component: DashboardAdminComponent,
  canActivate: [RoleGuard],
  data: { roles: ['admin'] }  // Solo admin
}
```

### Guard de Múltiples Roles
```typescript
{
  path: 'reportes',
  component: ReportesComponent,
  canActivate: [RoleGuard],
  data: { roles: ['admin', 'funcionario'] }  // Admin o funcionario
}
```

### Guard Genérico (Cualquier Usuario Autenticado)
```typescript
{
  path: 'perfil',
  component: PerfilComponent,
  canActivate: [AuthGuard]  // Cualquier usuario autenticado
}
```

### Guard Específico de Admin
```typescript
{
  path: 'admin',
  component: AdminComponent,
  canActivate: [AdminGuard]  // Solo admins
}
```

---

## Cómo Inyectar el Servicio de Seguridad en Componentes

```typescript
import { Component, OnInit } from '@angular/core';
import { SecurityService } from './services/securityService';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  usuario$ = this.securityService.usuarioActual$;
  rol$ = this.securityService.rol$;

  constructor(private securityService: SecurityService) {}

  ngOnInit(): void {}

  logout(): void {
    this.securityService.logout();
    // Redirigir a login
  }

  // Verificar permisos
  esAdmin() {
    return this.securityService.esAdmin();
  }

  esFuncionario() {
    return this.securityService.esFuncionario();
  }

  esCiudadano() {
    return this.securityService.esCiudadano();
  }
}
```

---

## Validaciones Condicionales en Plantillas HTML

```html
<!-- Solo visible para admins -->
<div *ngIf="(rol$ | async) === 'admin'">
  <a routerLink="/admin/dashboard">Dashboard Admin</a>
</div>

<!-- Solo visible para funcionarios y admins -->
<div *ngIf="(rol$ | async) === 'funcionario' || (rol$ | async) === 'admin'">
  <a routerLink="/funcionario/dashboard">Dashboard Funcionario</a>
</div>

<!-- Para cualquier usuario autenticado -->
<div *ngIf="usuario$ | async as usuario">
  <span>Bienvenido {{ usuario.nombre }}</span>
</div>
```

---

## Configuración de URL del Backend

En el archivo `securityService.ts`, actualiza la URL del backend si es necesario:

```typescript
private readonly API_URL = 'http://localhost:5000/api'; // Cambia según tu config
```

---

## Información de Roles

```
┌─────────────────────────────────────────────────────┐
│ ROL       │ DESCRIPCIÓN          │ PERMISOS         │
├─────────────────────────────────────────────────────┤
│ CIUDADANO │ Usuario normal       │ Ver su perfil    │
│           │                      │ Ver puntos       │
│           │                      │ Crear reportes   │
├─────────────────────────────────────────────────────┤
│ FUNCIONARIO│ Empleado público    │ Ciudadano +      │
│           │                      │ Ver ciudadanos   │
│           │                      │ Gestionar datos  │
├─────────────────────────────────────────────────────┤
│ ADMIN     │ Administrador        │ Todos +          │
│           │                      │ Cambiar roles    │
│           │                      │ Gestionar admins │
└─────────────────────────────────────────────────────┘
```

