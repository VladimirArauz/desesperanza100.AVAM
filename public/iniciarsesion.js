const formLogin = document.getElementById("formLogin");
if (formLogin) {
  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(formLogin).entries());
    const payload = { email: values.email, contrasena: values.contrasena };
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      alert(json.message || json.error);
      if (json.ok) {
        // Guardar usuario y token en localStorage
        if (json.usuario) localStorage.setItem("user", JSON.stringify(json.usuario));
        if (json.token) localStorage.setItem("token", json.token);
        window.location.href = "/";
      }
    } catch (err) {
      console.error(err);
      alert("Error en el servidor");
    }
  });
}
