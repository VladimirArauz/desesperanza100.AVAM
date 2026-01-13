async function cargarEstadisticas() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Debes iniciar sesión para ver estadísticas");
    window.location.href = "/iniciarsesion.html";
    return;
  }

  try {
    const res = await fetch("/api/estadisticas", {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      throw new Error("Error cargando estadísticas");
    }

    const data = await res.json();

    // Gráfica de panes más vendidos
    const ctxPanes = document.getElementById("chartPanes");
    if (ctxPanes && data.panesVendidos && data.panesVendidos.length > 0) {
      new Chart(ctxPanes, {
        type: "bar",
        data: {
          labels: data.panesVendidos.map(p => p.nombre),
          datasets: [{
            label: "Cantidad Vendida",
            data: data.panesVendidos.map(p => p.total_vendido),
            backgroundColor: "#005c00",
            borderColor: "#ff0000",
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false }
          }
        }
      });
    }

    // Gráfica de usuarios top
    const ctxUsuarios = document.getElementById("chartUsuarios");
    if (ctxUsuarios && data.usuariosTop && data.usuariosTop.length > 0) {
      new Chart(ctxUsuarios, {
        type: "pie",
        data: {
          labels: data.usuariosTop.map(u => u.nombre),
          datasets: [{
            data: data.usuariosTop.map(u => u.total_gastado),
            backgroundColor: ["#ff0000", "#005c00", "#4040fb", "#ff8800", "#00ff00"],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true
        }
      });
    }

    // Gráfica de ganancias
    const ctxGanancias = document.getElementById("chartGanancias");
    if (ctxGanancias && data.ganancias && data.ganancias.length > 0) {
      new Chart(ctxGanancias, {
        type: "line",
        data: {
          labels: data.ganancias.map(g => g.dia),
          datasets: [{
            label: "Ganancias ($)",
            data: data.ganancias.map(g => g.ganancia),
            backgroundColor: "rgba(0, 92, 0, 0.2)",
            borderColor: "#005c00",
            borderWidth: 3,
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: true }
          }
        }
      });
    }
  } catch (err) {
    console.error(err);
    alert("Error cargando estadísticas");
  }
}

cargarEstadisticas();