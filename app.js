import express from "express";
import cors from "cors";
import fileUpload from "express-fileupload";
import pkg from "pg";
const { Client } = pkg;

import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "cambiame123";

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());

// Servir carpeta public
app.use(express.static(path.join(__dirname, "public")));
// Log de peticiones para depuración
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Conexión a MySQL con soporte de variables de entorno
let db;
async function initDb() {
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "n0m3l0",
      database: process.env.DB_NAME || "desesperanza100",
    });
    console.log("Conectado a MySQL");
  } catch (err) {
    console.error("No se pudo conectar a MySQL:", err.message);
    db = null;
  }
}

async function ensureTables() {
  if (!db) return;
  // Crear tablas mínimas si no existen
  await db.execute(`
    CREATE TABLE IF NOT EXISTS panes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(255),
      precio DECIMAL(10,2),
      cantidad INT,
      descripcion TEXT,
      imagen LONGBLOB,
      imagen_mimetype VARCHAR(255)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(255),
      email VARCHAR(255) UNIQUE,
      contrasena VARCHAR(255)
    )
  `);
}

// Middleware para proteger rutas
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer "))
    return res.status(401).json({ ok: false, error: "No autorizado" });
  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ ok: false, error: "Token inválido" });
  }
}

// --- Rutas: catálogo de panes ---
app.get("/api/panes", async (req, res) => {
  if (!db) return res.status(500).json({ error: "DB no disponible" });

  try {
    const [rows] = await db.execute(
      "SELECT id, nombre, precio, cantidad, descripcion, imagen, imagen_mimetype FROM panes"
    );

    const data = rows.map((pan) => ({
      ...pan,
      imagen: pan.imagen ? pan.imagen.toString("base64") : null,
      imagen_mimetype: pan.imagen_mimetype || "image/jpeg",
    }));
    res.json(data);
  } catch (e) {
    console.error("Error obteniendo panes:", e);
    res.status(500).json({ error: "Error al consultar panes" });
  }
});

  // GET single pan
  app.get("/api/panes/:id", async (req, res) => {
    if (!db) return res.status(500).json({ error: "DB no disponible" });
    try {
      const { id } = req.params;
      const [rows] = await db.execute("SELECT id, nombre, precio, cantidad, descripcion, imagen, imagen_mimetype FROM panes WHERE id = ?", [id]);
      if (rows.length === 0) return res.status(404).json({ error: "No encontrado" });
      const pan = rows[0];
      pan.imagen = pan.imagen ? pan.imagen.toString("base64") : null;
      pan.imagen_mimetype = pan.imagen_mimetype || "image/jpeg";
      res.json(pan);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error al consultar" });
    }
  });

// Health check
app.get("/health", (req, res) => {
  res.json({ ok: true, db: !!db });
});

// --- Guardar nuevo pan ---
app.post("/api/guardar", requireAuth, async (req, res) => {
  if (!db) return res.status(500).json({ error: "DB no disponible" });
  try {
    // FormData -> req.body fields, files -> req.files
    const { nombre, precio, cantidad, descripcion } = req.body;
    const imagenFile = req.files?.imagen;

    if (!nombre || !precio || !cantidad || !imagenFile) {
      return res.status(400).json({ ok: false, error: "Faltan campos" });
    }

    // Convertir valores
    const precioNum = parseFloat(precio);
    const cantidadNum = parseInt(cantidad, 10);
    if (isNaN(precioNum) || isNaN(cantidadNum)) {
      return res.status(400).json({ ok: false, error: "Precio o cantidad inválidos" });
    }

    // Validación simple del tipo de archivo (image/*)
    if (!imagenFile.mimetype.startsWith("image/")) {
      return res.status(400).json({ ok: false, error: "Archivo no es una imagen" });
    }

    const imagenData = imagenFile.data;
    const sql =
      "INSERT INTO panes (nombre, precio, cantidad, descripcion, imagen, imagen_mimetype) VALUES (?, ?, ?, ?, ?, ?)";
    await db.execute(sql, [nombre, precioNum, cantidadNum, descripcion || "", imagenData, imagenFile.mimetype]);

    res.json({ ok: true, message: "Pan guardado exitosamente" });
  } catch (err) {
    console.error("Error guardando pan:", err);
    res.status(500).json({ ok: false, error: "Error guardando pan" });
  }
});

// --- Registro de usuario ---
app.post("/api/registrarusuario", async (req, res) => {
  if (!db) return res.status(500).json({ ok: false, error: "DB no disponible" });
  try {
    const { nombre, email, contrasena } = req.body;
    if (!nombre || !email || !contrasena) {
      return res.status(400).json({ ok: false, error: "Faltan datos" });
    }
    const [rows] = await db.execute("SELECT id FROM usuarios WHERE email = ?", [email]);
    if (rows.length > 0) {
      return res.status(400).json({ ok: false, error: "El correo ya está registrado" });
    }
    const hash = await bcrypt.hash(contrasena, 10);
    await db.execute("INSERT INTO usuarios (nombre, email, contrasena) VALUES (?, ?, ?)", [nombre, email, hash]);
    console.log(`Usuario registrado: ${email}`);
    res.json({ ok: true, message: "Usuario registrado correctamente" });
  } catch (err) {
    console.error("Error registrar usuario:", err);
    res.status(500).json({ ok: false, error: "Error en el servidor" });
  }
});

// --- Login ---
app.post("/api/login", async (req, res) => {
  if (!db) return res.status(500).json({ ok: false, error: "DB no disponible" });
  try {
    const { email, contrasena } = req.body;
    if (!email || !contrasena) return res.status(400).json({ ok: false, error: "Faltan datos" });
    const [rows] = await db.execute("SELECT * FROM usuarios WHERE email = ?", [email]);
    if (rows.length === 0) return res.status(400).json({ ok: false, error: "Usuario no encontrado" });
    const usuario = rows[0];
    // Soporta columnas 'contrasena' y 'contraseña' en la BD
    const hashed = usuario.contrasena ?? usuario.contraseña;
    if (!hashed) return res.status(500).json({ ok: false, error: "No se encontró la contraseña del usuario en la BD" });
    const esValida = await bcrypt.compare(contrasena, hashed);
    if (!esValida) return res.status(400).json({ ok: false, error: "Contraseña incorrecta" });
    console.log(`Inicio de sesión: ${email}`);
    // generate token
    const token = jwt.sign({ id: usuario.id, email: usuario.email }, JWT_SECRET, { expiresIn: "8h" });
    res.json({ ok: true, message: "Inicio de sesión exitoso", usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email }, token });
  } catch (err) {
    console.error("Error login:", err);
    res.status(500).json({ ok: false, error: "Error en el servidor" });
  }
});

// Actualizar pan - requiere autenticación
app.put("/api/panes/:id", requireAuth, async (req, res) => {
  if (!db) return res.status(500).json({ ok: false, error: "DB no disponible" });
  try {
    const { id } = req.params;
    const { nombre, precio, cantidad, descripcion } = req.body;
    const imagenFile = req.files?.imagen;

    // Construir SQL dinámicamente
    const fields = [];
    const values = [];
    if (nombre) {
      fields.push("nombre = ?");
      values.push(nombre);
    }
    if (precio !== undefined) {
      fields.push("precio = ?");
      values.push(parseFloat(precio));
    }
    if (cantidad !== undefined) {
      fields.push("cantidad = ?");
      values.push(parseInt(cantidad, 10));
    }
    if (descripcion !== undefined) {
      fields.push("descripcion = ?");
      values.push(descripcion);
    }
    if (imagenFile) {
      fields.push("imagen = ?", "imagen_mimetype = ?");
      values.push(imagenFile.data, imagenFile.mimetype);
    }
    if (fields.length === 0) return res.status(400).json({ ok: false, error: "Nada para actualizar" });
    values.push(id);
    const sql = `UPDATE panes SET ${fields.join(", ")} WHERE id = ?`;
    await db.execute(sql, values);
    res.json({ ok: true, message: "Pan actualizado" });
  } catch (err) {
    console.error("Error actualizando pan:", err);
    res.status(500).json({ ok: false, error: "Error actualizando" });
  }
});

// Eliminar pan - requiere autenticación
app.delete("/api/panes/:id", requireAuth, async (req, res) => {
  if (!db) return res.status(500).json({ ok: false, error: "DB no disponible" });
  try {
    const { id } = req.params;
    await db.execute("DELETE FROM panes WHERE id = ?", [id]);
    res.json({ ok: true, message: "Pan eliminado" });
  } catch (err) {
    console.error("Error eliminando pan:", err);
    res.status(500).json({ ok: false, error: "Error eliminando" });
  }
});

async function start() {
  await initDb();
  await ensureTables();

  // Ruta principal
  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  });

  // Fallback compatible con Express 5
  app.use((req, res, next) => {
    if (req.method === "GET" && req.accepts("html") && !req.path.startsWith("/api/")) {
      return res.sendFile(path.join(__dirname, "public", "index.html"));
    }
    next();
  });

  app.listen(PORT, () => {
    console.log(`Servidor arriba en http://localhost:${PORT}`);
  });
}

start();

