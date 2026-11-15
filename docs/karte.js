(() => {
  "use strict";
  const pins = document.querySelector("#map-pins");
  const info = document.querySelector("#map-info");
  if (!pins) return;
  const full = pins.dataset.mode === "voll";
  const W = 2626, H = 1756;

  // Punkte auseinanderziehen: Mindestabstand in Bildpixeln, sanfte Rückfeder
  // zur echten Lage. Große Abstände bleiben erhalten, nur Staus lösen sich.
  function spread(points) {
    const MIN = 50, n = points.length;
    const a = points.map(p => ({ x: p.x / 100 * W, y: p.y / 100 * H }));
    const q = a.map(p => ({ x: p.x, y: p.y }));
    for (let it = 0; it < 400; it++) {
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        // Breite zählt halb: Beschriftungen sind breit, aber flach.
        let dx = (q[j].x - q[i].x) * 0.5, dy = q[j].y - q[i].y;
        let d = Math.hypot(dx, dy);
        if (d >= MIN) continue;
        if (d < 0.01) { dx = Math.cos(i * 2.4 + j); dy = Math.sin(i * 2.4 + j); d = 1; }
        const push = (MIN - d) / 2 * 0.5;
        dx /= d; dy /= d;
        q[i].x -= dx * push * 2; q[i].y -= dy * push;
        q[j].x += dx * push * 2; q[j].y += dy * push;
      }
      for (let i = 0; i < n; i++) {
        q[i].x += (a[i].x - q[i].x) * 0.02; q[i].y += (a[i].y - q[i].y) * 0.02;
        q[i].x = Math.min(W - 12, Math.max(12, q[i].x)); q[i].y = Math.min(H - 12, Math.max(12, q[i].y));
      }
    }
    return points.map((p, i) => Object.assign({}, p, { x: q[i].x / W * 100, y: q[i].y / H * 100 }));
  }

  fetch("./karte.json").then(r => r.json()).then(raw => {
    const points = spread(raw);
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
        const max = full ? 99 : 8;
        for (const n of p.orte.slice(0, max)) { const s = document.createElement("span"); s.textContent = n; tip.append(s); }
        if (p.orte.length > max) { const s = document.createElement("span"); s.textContent = "… und " + (p.orte.length - max) + " weitere"; tip.append(s); }
        let tx = "-50%", ty = "calc(-100% - 14px)";
        if (p.y < 22) ty = "14px";
        if (p.x < 12) tx = "-10px";
        if (p.x > 88) tx = "calc(-100% + 10px)";
        tip.style.left = p.x + "%"; tip.style.top = p.y + "%"; tip.style.transform = "translate(" + tx + "," + ty + ")";
        pins.append(tip); b.setAttribute("aria-expanded", "true");
      });
      pins.append(b);
      if (full) {
        const l = document.createElement("span");
        l.className = "map-label";
        l.style.left = p.x + "%"; l.style.top = p.y + "%";
        const name = p.orte[0].split(" – ")[0];
        l.textContent = (name.length > 26 ? name.slice(0, 25) + "…" : name) + (p.orte.length > 1 ? " +" + (p.orte.length - 1) : "");
        pins.append(l);
      }
    }
    document.addEventListener("click", close);
    if (info) info.textContent = points.reduce((n, p) => n + p.orte.length, 0) + " Schauplätze an " + points.length + " Stellen.";
  }).catch(() => {});
})();
