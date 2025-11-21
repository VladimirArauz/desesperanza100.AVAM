// =============================
//     CARGAR CATÁLOGO
// =============================
async function cargarCatalogo() {
  const res = await fetch("/api/panes");
  const panes = await res.json();

  const cont = document.getElementById("catalogo");
  cont.innerHTML = "";

  panes.forEach((pan) => {
    const div = document.createElement("div");
    div.style.border = "1px solid #ccc";
    div.style.padding = "10px";
    div.style.margin = "10px";
    div.style.width = "250px";

    div.innerHTML = `
      <h3>${pan.nombre}</h3>
      <p><strong>Precio:</strong> $${pan.precio}</p>
      <p><strong>Cantidad:</strong> ${pan.cantidad}</p>
      <p>${pan.descripcion}</p>
      ${pan.imagen ? `<img src="data:image/jpeg;base64,${pan.imagen}" width="200">` : "Sin imagen"}
    `;

    cont.appendChild(div);
  });
}

cargarCatalogo();

// =============================
//   GUARDAR PAN NUEVO
// =============================
const form = document.getElementById("formPan");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = new FormData(form);

  const res = await fetch("/api/guardar", {
    method: "POST",
    body: data,
  });

  const json = await res.json();
  alert(json.message || json.error);

  cargarCatalogo();
});

// =============================
//     MAPA LEAFLET
// =============================
const lat = -67.043144;
const lng = 54.641906;

const map = L.map("map").setView([lat, lng], 15);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
}).addTo(map);

L.marker([lat, lng])
  .addTo(map)
  .bindPopup("Panadería Desesperanza<br>Estamos aquí 🍞")
  .openPopup();
