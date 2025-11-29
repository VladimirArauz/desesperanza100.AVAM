# Panadería Desesperanza - Proyecto

Pequeña app para listar panes (catálogo), registrar un nuevo pan con imagen y autenticación básica de usuarios.

## Requisitos
- Node.js (v18+ recomendado)
- MySQL

## Setup
1. Instala dependencias:
```powershell
npm install
```
2. Crea la base de datos y tablas (ejemplo):
```sql
CREATE DATABASE IF NOT EXISTS desesperanza100;
USE desesperanza100;

CREATE TABLE IF NOT EXISTS panes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255),
  precio DECIMAL(10,2),
  cantidad INT,
  descripcion TEXT,
  imagen LONGBLOB,
  imagen_mimetype VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  contrasena VARCHAR(255)
);
```
3. Opcional: configura variables de entorno:

- DB_HOST (por defecto: localhost)
- DB_USER (por defecto: root)
- DB_PASSWORD (por defecto: n0m3l0)
- DB_NAME (por defecto: desesperanza100)

4. Ejecuta el servidor:
```powershell
npm start
```

5. Abre el navegador en http://localhost:3000/

## Notas
- El front-end se encuentra en `public/`.
- Endpoints:
  - GET `/api/panes` - Devuelve catálogo
  - POST `/api/guardar` - Guarda un pan (form-data, campo `imagen`)
  - POST `/api/registrarusuario` - Registra usuario (JSON)
  - POST `/api/login` - Login de usuario (JSON)
   - PUT `/api/panes/:id` - Actualiza pan (multipart/form-data) **requiere autorización**
   - DELETE `/api/panes/:id` - Elimina pan **requiere autorización**

  Nota: Para operaciones protegidas (guardar, editar, eliminar), debes iniciar sesión y usar el token que te devuelve `/api/login`. En el frontend el token se guarda en `localStorage`.

  Notas sobre inicio de sesión
  - Al iniciar sesión desde `/iniciarsesion.html`, la app guarda el usuario en `localStorage` y muestra botones de registrar y cerrar sesión en la barra superior.
