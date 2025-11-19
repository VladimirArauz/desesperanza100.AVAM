// Cargar catálogo desde el servidor
async function cargarCatalogo() {
  const catalogo = document.getElementById("catalogo");
  catalogo.innerHTML = "Cargando...";

  try {
    const res = await fetch("/api/panes");
    const data = await res.json();

    if (!Array.isArray(data)) {
      catalogo.innerHTML = "Error al cargar panes";
      return;
    }

    catalogo.innerHTML = "";

    data.forEach(pan => {
      const div = document.createElement("div");
      div.style.border = "1px solid #ccc";
      div.style.padding = "10px";
      div.style.margin = "10px 0";
      div.style.borderRadius = "8px";

      const img = document.createElement("img");
      img.src = `data:image/jpeg;base64,${pan.imagen}`;
      img.style.width = "150px";
      img.style.height = "150px";
      img.style.objectFit = "cover";
      img.style.borderRadius = "8px";

      div.innerHTML = `
        <h3>${pan.nombre}</h3>
        <p><strong>Precio:</strong> $${pan.precio}</p>
        <p><strong>Cantidad:</strong> ${pan.cantidad}</p>
        <p>${pan.descripcion}</p>
      `;

      div.prepend(img);
      catalogo.appendChild(div);
    });
  } catch (err) {
    catalogo.innerHTML = "Error de conexión con el servidor";
  }
}

// Guardar pan en la base de datos
const formPan = document.getElementById("formPan");
formPan.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(formPan);

  try {
    const res = await fetch("/api/guardar", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if (data.ok) {
      alert("Pan guardado correctamente");
      formPan.reset();
      cargarCatalogo();
    } else {
      alert("Error al guardar el pan");
    }
  } catch (error) {
    alert("Error de conexión con el servidor");
  }
});

// Cargar catálogo al entrar\ ncargarCatalogo();
