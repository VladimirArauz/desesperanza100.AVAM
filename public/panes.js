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
          ${pan.imagen ? `<img class="pan-img" alt="Imagen de ${nombre}" src="data:image/jpeg;base64,${pan.imagen}">` : ""}
        </div>
      `;

      cont.appendChild(div);
    });
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

    try {
      const data = new FormData(form);
      const res = await fetch("/api/guardar", {
        method: "POST",
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
