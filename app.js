import express from "express";
import cors from "cors";
import fileUpload from "express-fileupload";
import pkg from "pg";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const { Pool } = pkg;

/* ======================
   Configuración básica
====================== */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "cambiame123";

/* ======================
   Middlewares
====================== */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());
app.use(express.static(path.join(__dirname, "public")));

/* ======================
   PostgreSQL
====================== */
let db;

async function initDb() {
  try {
    db = new Pool({
      connectionString:
        process.env.DATABASE_URL ||
        "postgresql://root:mxTICIx8y4cJ65hL4oebymFPzmkVLnFh@dpg-d5g60m3e5dus73do8th0-a.oregon-postgres.render.com:5432/desesperanza_8zy8",
      ssl: { rejectUnauthorized: false },
    });

    await db.query("SELECT 1");
    console.log("✅ PostgreSQL conectado");
  } catch (err) {
    console.error("❌ Error PostgreSQL:", err);
    process.exit(1);
  }
}

async function ensureTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS panes (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(255) NOT NULL,
      precio NUMERIC(10,2) NOT NULL,
      cantidad INT NOT NULL,
      descripcion TEXT,
      imagen BYTEA,
      imagen_mimetype VARCHAR(255)
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      contrasena VARCHAR(255) NOT NULL
    )
  `);
}

/* ======================
   Middlewares custom
====================== */
function requireDB(req, res, next) {
  if (!db) return res.status(500).json({ error: "DB no disponible" });
  next();
}

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No autorizado" });
  }
  try {
    const token = auth.split(" ")[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }
}

/* ======================
   Rutas
====================== */

// Health
app.get("/health", requireDB, (req, res) => {
  res.json({ ok: true });
});

// Obtener panes
app.get("/api/panes", requireDB, async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM panes ORDER BY id DESC");

    const panes = result.rows.map(p => ({
      ...p,
      imagen: p.imagen ? p.imagen.toString("base64") : null,
      imagen_mimetype: p.imagen_mimetype || "image/jpeg",
    }));

    res.json(panes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error cargando panes" });
  }
});

// Obtener pan por ID
app.get("/api/panes/:id", requireDB, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query("SELECT * FROM panes WHERE id=$1", [id]);

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Pan no encontrado" });

    const pan = result.rows[0];
    pan.imagen = pan.imagen ? pan.imagen.toString("base64") : null;

    res.json(pan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error consultando pan" });
  }
});

// Guardar pan
app.post("/api/guardar", requireDB, requireAuth, async (req, res) => {
  try {
    const { nombre, precio, cantidad, descripcion } = req.body;
    const imagenFile = req.files?.imagen;

    if (!nombre || !precio || !cantidad || !imagenFile) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    await db.query(
      `INSERT INTO panes 
      (nombre, precio, cantidad, descripcion, imagen, imagen_mimetype)
      VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        nombre,
        precio,
        cantidad,
        descripcion || "",
        imagenFile.data,
        imagenFile.mimetype,
      ]
    );

    res.json({ ok: true, message: "Pan guardado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error guardando pan" });
  }
});

// Actualizar pan
app.put("/api/panes/:id", requireDB, requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, precio, cantidad, descripcion } = req.body;
    const imagenFile = req.files?.imagen;

    const fields = [];
    const values = [];
    let i = 1;

    if (nombre) { fields.push(`nombre=$${i++}`); values.push(nombre); }
    if (precio) { fields.push(`precio=$${i++}`); values.push(precio); }
    if (cantidad) { fields.push(`cantidad=$${i++}`); values.push(cantidad); }
    if (descripcion) { fields.push(`descripcion=$${i++}`); values.push(descripcion); }
    if (imagenFile) {
      fields.push(`imagen=$${i++}`, `imagen_mimetype=$${i++}`);
      values.push(imagenFile.data, imagenFile.mimetype);
    }

    if (fields.length === 0)
      return res.status(400).json({ error: "Nada que actualizar" });

    values.push(id);

    await db.query(
      `UPDATE panes SET ${fields.join(", ")} WHERE id=$${i}`,
      values
    );

    res.json({ ok: true, message: "Pan actualizado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error actualizando pan" });
  }
});

// Eliminar pan
app.delete("/api/panes/:id", requireDB, requireAuth, async (req, res) => {
  try {
    await db.query("DELETE FROM panes WHERE id=$1", [req.params.id]);
    res.json({ ok: true, message: "Pan eliminado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error eliminando pan" });
  }
});

// Registro usuario
app.post("/api/registrarusuario", requireDB, async (req, res) => {
  try {
    const { nombre, email, contrasena } = req.body;
    if (!nombre || !email || !contrasena)
      return res.status(400).json({ error: "Datos incompletos" });

    const existe = await db.query(
      "SELECT id FROM usuarios WHERE email=$1",
      [email]
    );

    if (existe.rows.length > 0)
      return res.status(400).json({ error: "Correo ya registrado" });

    const hash = await bcrypt.hash(contrasena, 10);

    await db.query(
      "INSERT INTO usuarios (nombre,email,contrasena) VALUES ($1,$2,$3)",
      [nombre, email, hash]
    );

    res.json({ ok: true, message: "Usuario registrado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error registrando usuario" });
  }
});

// Login
app.post("/api/login", requireDB, async (req, res) => {
  try {
    const { email, contrasena } = req.body;

    const result = await db.query(
      "SELECT * FROM usuarios WHERE email=$1",
      [email]
    );

    if (result.rows.length === 0)
      return res.status(400).json({ error: "Usuario no encontrado" });

    const usuario = result.rows[0];
    const ok = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!ok) return res.status(400).json({ error: "Contraseña incorrecta" });

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      ok: true,
      usuario: { id: usuario.id, nombre: usuario.nombre, email },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en login" });
  }
});

/* ======================
   Start
====================== */
async function start() {
  await initDb();
  await ensureTables();

  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  });

  app.listen(PORT, () => {
    console.log(`🚀 Servidor en http://localhost:${PORT}`);
  });
}

start();
