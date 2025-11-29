async function fetchPan(id) {
  const res = await fetch(`/api/panes/${id}`);
  if (!res.ok) throw new Error("No se encontró pan");
  return res.json();
}

function getIdFromQuery() {
  const params = new URLSearchParams(location.search);
  return params.get("id");
}

async function init() {
  const id = getIdFromQuery();
  if (!id) return alert("ID no especificado");

  try {
    const pan = await fetchPan(id);
    document.getElementById("nombre").value = pan.nombre || "";
    document.getElementById("precio").value = pan.precio || "";
    document.getElementById("cantidad").value = pan.cantidad || "";
    document.getElementById("descripcion").value = pan.descripcion || "";
  } catch (err) {
    console.error(err);
    alert("Error cargando pan");
  }

  const form = document.getElementById("formEditar");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return alert("Debes iniciar sesión para editar");
    const data = new FormData(form);
    try {
      const res = await fetch(`/api/panes/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });
      const json = await res.json();
      if (!res.ok || !json.ok) return alert(json.error || json.message || "Error");
      alert(json.message || "Actualizado");
      window.location.href = "/";
    } catch (err) {
      console.error(err);
      alert("Error actualizando");
    }
  });
}

init();
