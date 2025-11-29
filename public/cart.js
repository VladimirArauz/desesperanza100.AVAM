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
  // attach listeners
  document.querySelectorAll('.btn-increase').forEach(btn=> btn.addEventListener('click', (e)=>{ const i=Number(btn.dataset.idx); const cart=getCart(); cart[i].qty+=1; saveCart(cart); renderCart(); }));
  document.querySelectorAll('.btn-decrease').forEach(btn=> btn.addEventListener('click', (e)=>{ const i=Number(btn.dataset.idx); const cart=getCart(); if(cart[i].qty>1) cart[i].qty -= 1; else cart.splice(i,1); saveCart(cart); renderCart(); }));
  document.querySelectorAll('.btn-remove').forEach(btn=> btn.addEventListener('click',(e)=>{ const i=Number(btn.dataset.idx); const cart=getCart(); cart.splice(i,1); saveCart(cart); renderCart(); }));
  document.getElementById('checkout').addEventListener('click', ()=>{ alert('Gracias por su compra (demo).'); localStorage.removeItem('cart'); renderCart(); updateCartCount(); });
}

renderCart();
