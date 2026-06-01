# Configuración de Endpoints para Backend Flask

## Resumen de Endpoints Requeridos

El frontend Angular espera los siguientes endpoints en tu backend Flask para funcionamiento completo de autenticación y roles:

---

## 1. **POST `/api/auth/login`** - Iniciar Sesión
### Descripción
Verifica las credenciales del usuario y devuelve un token de sesión si son válidas.

### Request Body
```json
{
  "email": "usuario@example.com",
  "password": "password123"
}
```

### Response (Success - 200)
```json
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "usuario": {
    "id": 1,
    "nombre": "Juan Pérez",
    "email": "usuario@example.com",
    "telefono": "+57 1234567",
    "direccion": "Calle 123, Apt 4",
    "rol": "ciudadano",
    "estado": "activo"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Response (Error - 401/404)
```json
{
  "success": false,
  "message": "Email o contraseña incorrectos",
  "error": "INVALID_CREDENTIALS"
}
```

---

## 2. **POST `/api/citizens`** - Registrar Nuevo Ciudadano
### Descripción
Crea una nueva cuenta de usuario con rol "ciudadano" automáticamente.

### Request Body
```json
{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "telefono": "+57 1234567",
  "direccion": "Calle 123, Apt 4",
  "password": "password123",
  "rol": "ciudadano",
  "estado": "activo"
}
```

### Response (Success - 201)
```json
{
  "success": true,
  "message": "Ciudadano registrado exitosamente",
  "usuario": {
    "id": 1,
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "telefono": "+57 1234567",
    "direccion": "Calle 123, Apt 4",
    "rol": "ciudadano",
    "estado": "activo"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Response (Error - 400)
```json
{
  "success": false,
  "message": "El email ya está registrado",
  "error": "EMAIL_EXISTS"
}
```

---

## 3. **GET `/api/auth/verificar-email/{email}`** - Verificar si Email Existe
### Descripción
Verifica si un email ya está registrado en el sistema.

### Response (Success - 200)
```json
{
  "existe": false
}
```

### Response (Email Existe - 200)
```json
{
  "existe": true
}
```

---

## 4. **PUT `/api/citizens/{id}`** - Actualizar Perfil del Ciudadano
### Descripción
Actualiza la información del perfil del usuario autenticado.

### Request Body (parcial)
```json
{
  "nombre": "Juan Pérez Actualizado",
  "telefono": "+57 9876543",
  "direccion": "Nueva dirección"
}
```

### Response (Success - 200)
```json
{
  "success": true,
  "message": "Perfil actualizado correctamente",
  "usuario": {
    "id": 1,
    "nombre": "Juan Pérez Actualizado",
    "email": "juan@example.com",
    "telefono": "+57 9876543",
    "direccion": "Nueva dirección",
    "rol": "ciudadano",
    "estado": "activo"
  }
}
```

---

## 5. **PUT `/api/citizens/{id}/role`** - Cambiar Rol de Usuario (Solo Admin)
### Descripción
Cambia el rol de un usuario. Solo administradores pueden ejecutar esta acción.

### Request Body
```json
{
  "rol": "funcionario"
}
```

### Response (Success - 200)
```json
{
  "success": true,
  "message": "Rol actualizado correctamente",
  "usuario": {
    "id": 1,
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "rol": "funcionario",
    "estado": "activo"
  }
}
```

### Response (Error - 403)
```json
{
  "success": false,
  "message": "No tienes permiso para cambiar roles",
  "error": "FORBIDDEN"
}
```

---

## 6. **Campos Esperados en Respuestas**

### Usuario Object
```typescript
{
  id: number;                  // ID único del usuario
  nombre: string;              // Nombre completo
  email: string;               // Email único
  telefono?: string;           // Teléfono (opcional)
  direccion?: string;          // Dirección (opcional)
  rol: 'ciudadano' | 'funcionario' | 'admin';  // Rol del usuario
  estado: string;              // Estado (activo, inactivo, suspendido, etc)
  latitud?: number;            // Latitud (para ciudadanos)
  longitud?: number;           // Longitud (para ciudadanos)
}
```

---

## 7. **Headers Que Envía el Frontend**

Todos los endpoints (excepto login/registro) recibirán estos headers automáticamente:

```
Authorization: Bearer {token}
X-User-ID: {id}
X-User-Role: {rol}
X-User-Email: {email}
```

---

## 8. **Códigos de Estado HTTP Esperados**

- **200**: OK - La solicitud fue exitosa
- **201**: Created - Recurso creado exitosamente
- **400**: Bad Request - Datos inválidos o validación fallida
- **401**: Unauthorized - Token inválido o expirado
- **403**: Forbidden - Sin permisos para acceder
- **404**: Not Found - Recurso no encontrado
- **500**: Internal Server Error - Error del servidor

---

## 9. **Implementación de Ejemplo (Flask)**

```python
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash, check_password_hash
from app.models import Citizen, User
from app.extensions import db

bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@bp.post("/login")
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    
    # Buscar usuario
    usuario = Citizen.query.filter_by(email=email).first()
    
    if not usuario or not check_password_hash(usuario.password_hash, password):
        return jsonify({
            "success": False,
            "message": "Email o contraseña incorrectos"
        }), 401
    
    # Generar token
    token = create_access_token(identity=usuario.id_citizen)
    
    return jsonify({
        "success": True,
        "message": "Inicio de sesión exitoso",
        "usuario": usuario.to_dict(),
        "token": token
    }), 200

@bp.get("/verificar-email/<email>")
def verificar_email(email):
    existe = Citizen.query.filter_by(email=email).first() is not None
    return jsonify({"existe": existe}), 200
```

---

## 10. **Notas Importantes**

1. **Hash de Contraseñas**: Las contraseñas DEBEN almacenarse con hash (bcrypt, pbkdf2, etc)
2. **Tokens JWT**: Se recomienda usar JWT para autenticación stateless
3. **CORS**: Habilitar CORS para que el frontend pueda acceder a los endpoints
4. **Validación**: Validar todos los campos de entrada en el backend
5. **Roles por Defecto**: Nuevos ciudadanos siempre tienen rol "ciudadano"
6. **Solo Admin**: Solo usuarios con rol "admin" pueden cambiar roles de otros usuarios
7. **Campos Únicos**: El email debe ser único en toda la base de datos

