(() => {
  "use strict";
  const pins = document.querySelector("#map-pins");
  const info = document.querySelector("#map-info");
  if (!pins) return;
  fetch("./karte.json").then(r => r.json()).then(points => {
    let tip = null;
    const close = () => {
      if (tip) { tip.remove(); tip = null; }
      pins.querySelectorAll("[aria-expanded=true]").forEach(b => b.setAttribute("aria-expanded", "false"));
    };
    for (const p of points) {
      const b = document.createElement("button");
      b.className = "map-pin"; b.type = "button";
      b.style.left = p.x + "%"; b.style.top = p.y + "%";
      b.setAttribute("aria-label", p.orte[0] + (p.orte.length > 1 ? " und " + (p.orte.length - 1) + " weitere" : ""));
      b.setAttribute("aria-expanded", "false");
      b.addEventListener("click", e => {
        e.stopPropagation();
        const open = b.getAttribute("aria-expanded") === "true";
        close();
        if (open) return;
        tip = document.createElement("div"); tip.className = "map-tip";
        const head = document.createElement("b"); head.textContent = p.land;
        tip.append(head);
        for (const n of p.orte.slice(0, 8)) { const s = document.createElement("span"); s.textContent = n; tip.append(s); }
        if (p.orte.length > 8) { const s = document.createElement("span"); s.textContent = "… und " + (p.orte.length - 8) + " weitere"; tip.append(s); }
        let tx = "-50%", ty = "calc(-100% - 14px)";
        if (p.y < 22) ty = "14px";
        if (p.x < 12) tx = "-10px";
        if (p.x > 88) tx = "calc(-100% + 10px)";
        tip.style.left = p.x + "%"; tip.style.top = p.y + "%"; tip.style.transform = "translate(" + tx + "," + ty + ")";
        pins.append(tip); b.setAttribute("aria-expanded", "true");
      });
      pins.append(b);
    }
    document.addEventListener("click", close);
    info.textContent = points.reduce((n, p) => n + p.orte.length, 0) + " Schauplätze an " + points.length + " Stellen.";
  }).catch(() => {});
})();
