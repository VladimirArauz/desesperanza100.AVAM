// --- CARGAR CATÁLOGO ---
async function cargarCatalogo() {
  try {
    const res = await fetch("/api/panes");
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    const panes = await res.json();

    const cont = document.getElementById("catalogo");
    if (!cont) return; // nothing to render into
    cont.innerHTML = "";

    if (!Array.isArray(panes) || panes.length === 0) {
      cont.innerHTML = `
        <div class="col-12 text-center">
          <div class="card-pan">No hay panes disponibles.</div>
        </div>
      `;
      return;
    }

    panes.forEach((pan) => {
      const div = document.createElement("div");
      div.className = "col-md-4";

      // Ensure safe values and formatting
      const precio = Number(pan.precio ?? 0).toFixed(2);
      const cantidad = Number(pan.cantidad ?? 0);
      const descripcion = pan.descripcion ?? "";
      const nombre = pan.nombre ?? "Pan sin nombre";

      div.innerHTML = `
        <div class="card-pan">
          <h4>${nombre}</h4>
          <p><strong>Precio:</strong> $${precio}</p>
          <p><strong>Cantidad:</strong> ${cantidad}</p>
          <p>${descripcion}</p>
          ${pan.imagen ? `<img class="pan-img" alt="Imagen de ${nombre}" src="data:${pan.imagen_mimetype || 'image/jpeg'};base64,${pan.imagen}">` : ""}
          <div class="d-flex gap-2 mt-2">
            <button class="btn btn-verde btn-add" data-id="${pan.id}">Agregar al carrito</button>
            <button class="btn btn-rojo btn-delete" data-id="${pan.id}" style="display:none">Eliminar</button>
            <button class="btn btn-verde btn-edit" data-id="${pan.id}" style="display:none">Editar</button>
          </div>
        </div>
      `;

      cont.appendChild(div);
    });

    // Attach event listeners for add to cart / edit / delete
    document.querySelectorAll(".btn-add").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const item = panes.find((p) => String(p.id) === String(id));
        addToCart(item);
      });
    });
    // Show edit/delete if logged in
    const token = localStorage.getItem("token");
    if (token) {
      document.querySelectorAll(".btn-delete").forEach((btn) => {
        btn.style.display = "inline-block";
        btn.addEventListener("click", async () => {
          if (!confirm("¿Eliminar este pan?")) return;
          try {
            const res = await fetch(`/api/panes/${btn.dataset.id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            alert(json.message || json.error || json);
            if (json.ok) cargarCatalogo();
          } catch (e) {
            console.error(e);
            alert("Error eliminando pan");
          }
        });
      });
      document.querySelectorAll(".btn-edit").forEach((btn) => {
        btn.style.display = "inline-block";
        btn.addEventListener("click", () => {
          window.location.href = `/editar.html?id=${btn.dataset.id}`;
        });
      });
    }
  } catch (e) {
    console.error("Error cargando catálogo:", e);
    const cont = document.getElementById("catalogo");
    if (cont) cont.innerHTML = `<div class="col-12 text-center">Error cargando catálogo.</div>`;
  }
}

cargarCatalogo();

// --- GUARDAR PAN ---
const form = document.getElementById("formPan");
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = form.elements["nombre"]?.value?.trim();
    const precio = Number(form.elements["precio"]?.value);
    const cantidad = Number(form.elements["cantidad"]?.value);
    const descripcion = form.elements["descripcion"]?.value?.trim();
    const imagenField = form.elements["imagen"];

    if (!nombre) return alert("Ingresa el nombre del pan");
    if (isNaN(precio)) return alert("Precio inválido");
    if (isNaN(cantidad)) return alert("Cantidad inválida");
    if (!imagenField || !imagenField.files || imagenField.files.length === 0)
      return alert("Debes seleccionar una imagen");

    // require login
    const token = localStorage.getItem("token");
    if (!token) return alert("Debes iniciar sesión para registrar un pan");

    try {
        const data = new FormData(form);
        const token = localStorage.getItem("token");
        const res = await fetch("/api/guardar", {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body: data,
        });

      const json = await res.json();
      if (!res.ok) {
        const errMsg = json?.error || json?.message || `Error ${res.status}`;
        alert(`No se pudo guardar el pan: ${errMsg}`);
        return;
      }

      alert(json.message || "Guardado");
      form.reset();
      // After a short delay return to the catalog
      setTimeout(() => (window.location.href = "/"), 700);
    } catch (err) {
      console.error("Error guardando pan:", err);
      alert("Ocurrió un error al guardar el pan");
    }
  });
}

// --- Gestión de sesión básica en frontend ---
function renderUserButtons() {
  const btnRegistrar = document.getElementById("btnRegistrar");
  const btnLogin = document.getElementById("btnLogin");
  const btnLogout = document.getElementById("btnLogout");
  const btnUserRegister = document.getElementById("btnUserRegister");
  const userGreeting = document.getElementById("userGreeting");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (user) {
    if (btnLogin) btnLogin.style.display = "none";
    if (btnRegistrar) btnRegistrar.style.display = "inline-block";
    if (btnUserRegister) btnUserRegister.style.display = "none";
    if (btnLogout) {
      btnLogout.style.display = "inline-block";
      btnLogout.onclick = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        location.reload();
      };
    }
    if (userGreeting) userGreeting.textContent = `Hola ${user.nombre}`;
    // update cart count when user changes state
    updateCartCount();
    } else {
    if (btnLogin) btnLogin.style.display = "inline-block";
    if (btnRegistrar) btnRegistrar.style.display = "none";
    if (btnUserRegister) btnUserRegister.style.display = "inline-block";
    if (btnLogout) btnLogout.style.display = "none";
    if (userGreeting) userGreeting.textContent = "";
    updateCartCount();
  }
}

renderUserButtons();

// Cart utilities
function getCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]");
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

function addToCart(item) {
  if (!item) return;
  const cart = getCart();
  const idx = cart.findIndex((c) => c.id === item.id);
  if (idx >= 0) cart[idx].qty += 1;
  else cart.push({ id: item.id, nombre: item.nombre, precio: item.precio, qty: 1 });
  saveCart(cart);
  alert("Agregado al carrito");
}

function updateCartCount() {
  const el = document.getElementById("cartCount");
  if (!el) return;
  const cart = getCart();
  const total = cart.reduce((s, it) => s + it.qty, 0);
  el.textContent = total;
}

updateCartCount();

// MAPA LEAFLET
if (document.getElementById("map")) {
  const lat = 19.447183;
  const lng = -99.157582;

  const map = L.map("map").setView([lat, lng], 15);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
  }).addTo(map);

  L.marker([lat, lng])
    .addTo(map)
    .bindPopup("Panadería Desesperanza<br>Estamos aquí 🍞")
    .openPopup();
}
