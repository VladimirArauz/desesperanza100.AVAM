function crearNieve() {
  const snow = document.createElement("div");
  snow.classList.add("snow");
  snow.style.left = Math.random() * window.innerWidth + "px";
  snow.style.animationDuration = 3 + Math.random() * 3 + "s";
  snow.style.opacity = Math.random();

  document.body.appendChild(snow);

  setTimeout(() => snow.remove(), 6000);
}

setInterval(crearNieve, 150);
