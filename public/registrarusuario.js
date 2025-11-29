const formRegistro = document.getElementById("formRegistro");
if (formRegistro) {
  formRegistro.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(formRegistro).entries());
    const payload = {
      nombre: formData.nombre,
      email: formData.email,
      contrasena: formData.contrasena,
    };

    try {
      const res = await fetch("/api/registrarusuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      alert(json.message || json.error || json.mensaje);
      if (json.ok) window.location.href = "/iniciarsesion.html";
    } catch (err) {
      console.error(err);
      alert("Error en el servidor");
    }
  });
}
