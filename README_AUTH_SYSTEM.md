# RESUMEN: Sistema de Autenticación y Roles Angular

## ✅ ¿Qué se ha creado?

### 1. **Servicio de Seguridad** (`securityService.ts`)
   - ✅ Función **`login()`** - Verifica email registrado en backend
   - ✅ Función **`registro()`** - Crea nuevo ciudadano con rol "ciudadano" por defecto
   - ✅ Función **`verificarEmailRegistrado()`** - Valida email único
   - ✅ Gestión de sesiones (guardar/recuperar token y usuario)
   - ✅ Control de roles (verificar permisos)
   - ✅ Métodos: `esAdmin()`, `esFuncionario()`, `esCiudadano()`

### 2. **Interceptor de Autenticación** (`auth.interceptor.ts`)
   - ✅ Agrega token automáticamente a cada petición HTTP
   - ✅ Agrega headers con información del usuario:
     - `Authorization: Bearer {token}`
     - `X-User-ID: {id}`
     - `X-User-Role: {rol}`
     - `X-User-Email: {email}`
   - ✅ Maneja errores HTTP (401, 403, 500, etc)
   - ✅ Logout automático si sesión expira (401)

### 3. **Guards de Rutas** (`auth.guard.ts`)
   - ✅ `AuthGuard` - Protege rutas (sesión activa)
   - ✅ `RoleGuard` - Protege por rol específico
   - ✅ `AdminGuard` - Solo administradores
   - ✅ `FuncionarioGuard` - Funcionarios y admins
   - ✅ `CiudadanoGuard` - Solo ciudadanos

### 4. **Componentes UI**
   - ✅ **Login Component** (`login.component.ts/html/scss`)
     - Interfaz moderna y responsiva
     - Validación de campos
     - Redireccionamiento según rol
   
   - ✅ **Registro Component** (`registro.component.ts/html/scss`)
     - Registro de nuevos ciudadanos
     - Validación de email único (con debounce)
     - Validación de contraseñas coincidentes
     - Aceptación de términos

### 5. **Modelos de Datos** (`auth.models.ts`)
   - Interfaces TypeScript para tipos seguros
   - Usuario, LoginRequest, RegistroRequest, SesionData

### 6. **Configuración actualizada** (`app.config.ts`)
   - Interceptor registrado en providers
   - HttpClient configurado correctamente

---

## 🔑 Funcionalidades Implementadas

### Login (Verificar email en backend)
```typescript
this.securityService.login('usuario@email.com', 'password').subscribe({
  next: (response) => {
    console.log('Logueado como:', response.usuario.nombre);
    // Redirecciona según rol automáticamente
  }
});
```

### Registro (Crear como ciudadano)
```typescript
this.securityService.registro({
  nombre: 'Juan',
  email: 'juan@email.com',
  password: 'password123'
  // rol se establece como 'ciudadano' automáticamente
}).subscribe({
  next: (response) => {
    console.log('Registrado:', response.usuario.nombre);
  }
});
```

### Verificación de Rol
```typescript
// En componentes
if (this.securityService.esAdmin()) {
  // mostrar opciones admin
}

// En templates (Observables)
<div *ngIf="(rol$ | async) === 'admin'">
  Solo para admins
</div>
```

### Proteger Rutas
```typescript
{
  path: 'admin/dashboard',
  component: AdminComponent,
  canActivate: [AdminGuard]  // Solo administradores
}
```

---

## 🛠️ PRÓXIMOS PASOS

### 1️⃣ **Actualizar Backend Flask**
   Lee el archivo: `BACKEND_ENDPOINTS_REQUIRED.md`
   
   Necesita crear/actualizar estos endpoints:
   - `POST /api/auth/login` - Validar credenciales
   - `POST /api/citizens` - Registrar nuevo ciudadano
   - `GET /api/auth/verificar-email/{email}` - Validar email único
   - `PUT /api/citizens/{id}` - Actualizar perfil
   - `PUT /api/citizens/{id}/role` - Cambiar rol (solo admin)

### 2️⃣ **Agregar Rutas al Frontend**
   Lee el archivo: `RUTAS_ANGULAR_NECESARIAS.md`
   
   Actualizar `app.routes.ts` con:
   - Rutas de login/registro
   - Rutas protegidas por rol
   - Guards en las rutas

### 3️⃣ **Crear Componentes de Dashboards**
   - DashboardCiudadano
   - DashboardFuncionario
   - DashboardAdmin
   - GestionUsuarios
   - AccesoDenegado

### 4️⃣ **Integración Interceptores**
   El interceptor ya está configurado, pero verifica que:
   - El backend responda con token JWT
   - El backend valide los headers X-User-*

---

## 📊 Flujo de Autenticación

```
┌─────────────────────────────────────────────────────────┐
│ USUARIO NUEVO                                           │
├─────────────────────────────────────────────────────────┤
│ 1. Accede a /registro                                   │
│ 2. Completa formulario                                  │
│ 3. Sistema verifica email único en backend             │
│ 4. POST /api/citizens con rol="ciudadano"              │
│ 5. Backend retorna usuario + token                     │
│ 6. Front guarda token y usuario en localStorage        │
│ 7. Redirecciona a /ciudadano/dashboard                 │
│ 8. Interceptor agrega token a todas las peticiones     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ USUARIO EXISTENTE                                       │
├─────────────────────────────────────────────────────────┤
│ 1. Accede a /login                                      │
│ 2. Ingresa email y contraseña                          │
│ 3. POST /api/auth/login con credenciales              │
│ 4. Backend valida y retorna usuario + token           │
│ 5. Front guarda sesión                                 │
│ 6. Redirecciona según rol:                            │
│    - admin → /admin/dashboard                          │
│    - funcionario → /funcionario/dashboard              │
│    - ciudadano → /ciudadano/dashboard                  │
│ 7. Guard protege rutas según rol                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ CAMBIO DE ROL (Solo Admin)                              │
├─────────────────────────────────────────────────────────┤
│ 1. Admin accede a /admin/usuarios                       │
│ 2. Selecciona usuario y cambia rol                     │
│ 3. PUT /api/citizens/{id}/role con nuevo rol          │
│ 4. Backend valida que sea admin                        │
│ 5. Actualiza rol del usuario en BD                     │
│ 6. Usuario ve cambio en próximo login                  │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Estructura de Archivos Creados

```
src/app/
├── components/
│   ├── login/
│   │   ├── login.component.ts
│   │   ├── login.component.html
│   │   └── login.component.scss
│   └── registro/
│       ├── registro.component.ts
│       ├── registro.component.html
│       └── registro.component.scss
├── models/
│   └── auth.models.ts
├── services/
│   ├── securityService.ts
│   ├── auth.interceptor.ts
│   └── auth.guard.ts
└── app.config.ts (actualizado)
```

---

## 🔐 Información Importante

### Almacenamiento de Sesión
- **Token**: `localStorage['token_auth']`
- **Usuario**: `localStorage['usuario_actual']`
- **Sesión**: `localStorage['sesion_data']`

### Headers Enviados Automáticamente
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-User-ID: 1
X-User-Role: ciudadano
X-User-Email: usuario@email.com
```

### Roles Disponibles
1. **ciudadano** - Usuario normal
2. **funcionario** - Empleado público
3. **admin** - Administrador del sistema

---

## ❓ Preguntas Frecuentes

**P: ¿Cómo cambio la URL del backend?**
A: En `securityService.ts`, línea ~20:
```typescript
private readonly API_URL = 'http://localhost:5000/api';
```

**P: ¿Cómo agrego roles personalizados?**
A: 
1. Actualiza la interface `Usuario` en `auth.models.ts`
2. Crea un nuevo guard si es necesario
3. Actualiza `app.routes.ts`

**P: ¿Cómo verifico si el usuario es admin en templates?**
A:
```html
<div *ngIf="securityService.esAdmin()">Solo admin</div>
```

**P: ¿Qué pasa si expira el token?**
A: El interceptor detecta 401 y:
1. Borra la sesión
2. Redirige a login automáticamente

**P: ¿Cómo logout?**
A:
```typescript
this.securityService.logout();
```

---

## 📞 Soporte

Si necesitas:
- Cambiar la URL del backend
- Agregar más campos al usuario
- Crear más roles
- Personalizar validaciones

Solo comunícalo y se actualizarán estos archivos.

