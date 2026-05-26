const layers = [...document.querySelectorAll(".layer")];
const items = [...document.querySelectorAll(".list-item")];

let activeIndex = 0;

function focusLayer(index) {
  activeIndex = index;

  items.forEach((item) => item.classList.remove("active"));
  layers.forEach((layer) => layer.classList.remove("active"));

  items[index]?.classList.add("active");
  layers[index]?.classList.add("active");
}

items.forEach((item, index) => {
  item.addEventListener("mouseenter", () => focusLayer(index));
  item.addEventListener("click", () => focusLayer(index));
});

layers.forEach((layer, index) => {
  layer.addEventListener("mouseenter", () => focusLayer(index));
});

/* subtle automatic detail pulse */
setInterval(() => {
  const currentLayer = layers[activeIndex];
  if (!currentLayer) return;

  currentLayer.classList.add("pulse-detail");

  setTimeout(() => {
    currentLayer.classList.remove("pulse-detail");
  }, 900);
}, 4200);
