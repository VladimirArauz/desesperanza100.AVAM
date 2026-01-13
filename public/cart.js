function getCart() { return JSON.parse(localStorage.getItem('cart')||'[]'); }
function saveCart(cart){ localStorage.setItem('cart', JSON.stringify(cart)); updateCartCount(); }

function renderCart(){
  const el = document.getElementById('cartList');
  if(!el) return;
  const cart = getCart();
  if(cart.length===0){ el.innerHTML = '<p>Carrito vacío</p>'; return; }
  let html = '<ul class="list-group mb-3">';
  cart.forEach((it, idx)=>{
    html += `<li class="list-group-item d-flex justify-content-between align-items-center">
      <div>
        <strong>${it.nombre}</strong><br/>
        <small>$${Number(it.precio).toFixed(2)}</small>
      </div>
      <div>
        <button data-idx="${idx}" class="btn btn-outline-secondary btn-decrease">-</button>
        <span style="margin:0 10px">${it.qty}</span>
        <button data-idx="${idx}" class="btn btn-outline-secondary btn-increase">+</button>
        <button data-idx="${idx}" class="btn btn-rojo btn-remove">Eliminar</button>
      </div>
    </li>`;
  });
  html += '</ul>';
  const total = cart.reduce((s,it)=> s + (it.qty * Number(it.precio)), 0);
  html += `<div class="d-flex justify-content-between align-items-center"><h4>Total: $${total.toFixed(2)}</h4><button id="checkout" class="btn btn-verde">Pagar</button></div>`;
  el.innerHTML = html;
  
  document.querySelectorAll('.btn-increase').forEach(btn=> btn.addEventListener('click', (e)=>{ const i=Number(btn.dataset.idx); const cart=getCart(); cart[i].qty+=1; saveCart(cart); renderCart(); }));
  document.querySelectorAll('.btn-decrease').forEach(btn=> btn.addEventListener('click', (e)=>{ const i=Number(btn.dataset.idx); const cart=getCart(); if(cart[i].qty>1) cart[i].qty -= 1; else cart.splice(i,1); saveCart(cart); renderCart(); }));
  document.querySelectorAll('.btn-remove').forEach(btn=> btn.addEventListener('click',(e)=>{ const i=Number(btn.dataset.idx); const cart=getCart(); cart.splice(i,1); saveCart(cart); renderCart(); }));
  
  document.getElementById('checkout').addEventListener('click', async ()=>{ 
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Debes iniciar sesión para realizar una compra");
      window.location.href = "/iniciarsesion.html";
      return;
    }

    const cart = getCart();
    const total = cart.reduce((s,it)=> s + (it.qty * Number(it.precio)), 0);

    try {
      const res = await fetch("/api/comprar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ carrito: cart, total: total })
      });

      const json = await res.json();
      
      if (!res.ok || !json.ok) {
        alert(json.error || "Error procesando compra");
        return;
      }

      mostrarTicketCompra(cart, total);
      localStorage.removeItem('cart');
      renderCart();
      updateCartCount();
    } catch (err) {
      console.error(err);
      alert("Error procesando compra");
    }
  });
}

function mostrarTicketCompra(cart, total) {
  const fecha = new Date().toLocaleString();
  
  let itemsHtml = "";
  cart.forEach(item => {
    itemsHtml += `
      <div style="display:flex; justify-content:space-between; padding:5px 0;">
        <span>${item.nombre} x${item.qty}</span>
        <span>$${(item.precio * item.qty).toFixed(2)}</span>
      </div>
    `;
  });

  const ticketHtml = `
    <div style="font-family: 'Courier New', monospace; text-align: center; padding: 20px;">
      <h2 style="color: #ff0000; border-bottom: 2px dashed #000; padding-bottom: 10px;">🍞 Panadería Desesperanza 🍞</h2>
      <p>================================</p>
      <p><strong>TICKET DE COMPRA</strong></p>
      <p>${fecha}</p>
      <p>================================</p>
      <div style="text-align: left; margin: 20px 0;">
        ${itemsHtml}
      </div>
      <div style="border-top: 2px dashed #000; padding-top: 10px; font-weight: bold; font-size: 1.2em;">
        <p>================================</p>
        <p>TOTAL: $${total.toFixed(2)}</p>
        <p>================================</p>
      </div>
      <p>¡Gracias por su compra!</p>
      <button onclick="cerrarTicket()" class="btn btn-verde" style="margin-top: 20px;">Cerrar</button>
    </div>
  `;

  const modalDiv = document.createElement("div");
  modalDiv.id = "ticketModalCompra";
  modalDiv.style.cssText = "position:fixed; z-index:1000; left:0; top:0; width:100%; height:100%; background-color:rgba(0,0,0,0.7);";
  
  const contentDiv = document.createElement("div");
  contentDiv.style.cssText = "background-color:#ffffff; margin:5% auto; padding:20px; border:3px solid #005c00; width:80%; max-width:500px; border-radius:10px; color:black;";
  contentDiv.innerHTML = ticketHtml;
  
  modalDiv.appendChild(contentDiv);
  document.body.appendChild(modalDiv);
}

window.cerrarTicket = function() {
  const modal = document.getElementById("ticketModalCompra");
  if (modal) {
    modal.remove();
  }
};

renderCart();