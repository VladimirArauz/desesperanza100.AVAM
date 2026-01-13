async function cargarHistorial() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Debes iniciar sesión para ver tu historial");
    window.location.href = "/iniciarsesion.html";
    return;
  }

  try {
    const res = await fetch("/api/historial", {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      throw new Error("Error cargando historial");
    }

    const compras = await res.json();
    const container = document.getElementById("historialList");

    if (!compras || compras.length === 0) {
      container.innerHTML = '<div class="compra-box text-center">No tienes compras registradas</div>';
      return;
    }

    container.innerHTML = "";

    compras.forEach(compra => {
      // Si detalles ya es un objeto, úsalo directamente; si es string, parsealo
      const detalles = typeof compra.detalles === 'string' 
        ? JSON.parse(compra.detalles) 
        : compra.detalles;
      const fecha = new Date(compra.fecha).toLocaleString();

      const div = document.createElement("div");
      div.className = "compra-box";
      
      let itemsHtml = "";
      detalles.forEach(item => {
        itemsHtml += `
          <div class="compra-item">
            <strong>${item.nombre}</strong> - 
            Cantidad: ${item.qty} - 
            ${(item.precio * item.qty).toFixed(2)}
          </div>
        `;
      });

      div.innerHTML = `
        <div class="compra-header">
          <strong>Fecha:</strong> ${fecha}<br>
          <strong>Total:</strong> ${Number(compra.total).toFixed(2)}
        </div>
        ${itemsHtml}
        <button class="btn btn-verde mt-2" onclick="mostrarTicket(${compra.id})">Ver Ticket</button>
      `;

      container.appendChild(div);
    });

    // Guardar compras para los tickets
    window.comprasData = compras;
  } catch (err) {
    console.error(err);
    alert("Error cargando historial");
  }
}

function mostrarTicket(compraId) {
  const compra = window.comprasData.find(c => c.id === compraId);
  if (!compra) return;

  // Si detalles ya es un objeto, úsalo directamente; si es string, parsealo
  const detalles = typeof compra.detalles === 'string' 
    ? JSON.parse(compra.detalles) 
    : compra.detalles;
  const fecha = new Date(compra.fecha).toLocaleString();

  let itemsHtml = "";
  detalles.forEach(item => {
    itemsHtml += `
      <div style="display:flex; justify-content:space-between; padding:5px 0;">
        <span>${item.nombre} x${item.qty}</span>
        <span>${(item.precio * item.qty).toFixed(2)}</span>
      </div>
    `;
  });

  const ticketHtml = `
    <div class="ticket">
      <h2>🍞 Panadería Desesperanza 🍞</h2>
      <p>================================</p>
      <p><strong>TICKET DE COMPRA</strong></p>
      <p>${fecha}</p>
      <p>================================</p>
      <div class="ticket-items">
        ${itemsHtml}
      </div>
      <div class="ticket-total">
        <p>================================</p>
        <p>TOTAL: ${Number(compra.total).toFixed(2)}</p>
        <p>================================</p>
      </div>
      <p>¡Gracias por su compra!</p>
    </div>
  `;

  document.getElementById("ticketContent").innerHTML = ticketHtml;
  document.getElementById("ticketModal").style.display = "block";
}

document.querySelector(".close-ticket").onclick = function() {
  document.getElementById("ticketModal").style.display = "none";
};

window.onclick = function(event) {
  const modal = document.getElementById("ticketModal");
  if (event.target === modal) {
    modal.style.display = "none";
  }
};

cargarHistorial();