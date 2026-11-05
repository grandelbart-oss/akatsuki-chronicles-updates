(() => {
  "use strict";
  const groups = ["Minispiele", "Training", "Zetsus Reisen", "HD-Sprites", "Bijū & Geister", "Akatsuki", "Kanon-Figuren"];
  const filters = document.querySelector(".gallery-filters");
  const grid = document.querySelector(".gallery-grid");
  const status = document.querySelector("#gallery-status");
  const viewer = document.querySelector("#viewer");
  const stage = viewer.querySelector(".viewer-stage");
  const previous = document.querySelector("#viewer-prev");
  const next = document.querySelector("#viewer-next");
  let items = [];
  let selection = [];
  let index = 0;

  function display(number) {
    index = number;
    const item = selection[index];
    const isFilm = Boolean(item.poster);
    const media = document.createElement(isFilm ? "video" : "img");
    if (isFilm) {
      media.controls = true;
      media.playsInline = true;
      media.poster = item.poster;
      media.preload = "metadata";
    } else {
      media.alt = item.title;
    }
    media.src = item.src;
    media.addEventListener("error", () => {
      stage.textContent = "Die Vorschau konnte nicht geladen werden. Versuche „Original öffnen“.";
    }, {once: true});
    stage.replaceChildren(media);
    document.querySelector("#viewer-title").textContent = item.title;
    document.querySelector("#viewer-copy").textContent = item.caption;
    document.querySelector("#viewer-file").href = item.src;
    previous.disabled = index === 0;
    next.disabled = index + 1 === selection.length;
    if (!viewer.open) viewer.showModal();
  }

  function choose(group) {
    selection = items.filter(item => item.category === group);
    for (const button of filters.children) button.setAttribute("aria-pressed", String(button.textContent === group));
    grid.replaceChildren();
    selection.forEach((item, i) => {
      const card = document.createElement("button");
      card.className = "gallery-card";
      card.type = "button";
      card.setAttribute("aria-haspopup", "dialog");
      const frame = document.createElement("span");
      frame.className = item.poster ? "gallery-frame movie" : "gallery-frame sheet";
      const img = document.createElement("img");
      img.src = item.poster || item.src;
      img.loading = "lazy";
      img.alt = "";
      frame.append(img);
      if (item.poster) {
        const play = document.createElement("span");
        play.className = "play";
        play.setAttribute("aria-hidden", "true");
        play.textContent = "▶";
        frame.append(play);
      }
      const label = document.createElement("strong");
      label.textContent = item.title;
      card.append(frame, label);
      card.addEventListener("click", () => display(i));
      grid.append(card);
    });
    status.textContent = selection.length + (selection.length === 1 ? " Vorschau" : " Vorschauen");
  }

  viewer.addEventListener("close", () => { stage.replaceChildren(); });
  previous.addEventListener("click", () => display(index - 1));
  next.addEventListener("click", () => display(index + 1));

  async function load() {
    try {
      const lists = await Promise.all(["filme","figuren"].map(async folder => {
        const result = await fetch("./media/" + folder + "/index.json");
        if (!result.ok) throw Error("Medienliste fehlt");
        return result.json();
      }));
      items = lists.flat();
      for (const group of groups.filter(name => items.some(item => item.category === name))) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = group;
        button.addEventListener("click", () => choose(group));
        filters.append(button);
      }
      if (filters.firstChild) choose(filters.firstChild.textContent);
    } catch {
      status.textContent = "Die Galerie konnte nicht geladen werden. Bitte lade die Seite erneut.";
    }
  }
  load();
})();
