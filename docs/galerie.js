(() => {
  "use strict";
  const groups = ["Bosskämpfe", "Weltkarten", "Spielszenen", "Feste", "Natur", "Akatsuki", "Kanon-Figuren", "Bijū & Geister", "HD-Sprites", "Zetsus Reisen", "Training", "Minispiele"];
  const bijuAnchor = "biju-und-geister";
  const filters = document.querySelector(".gallery-filters");
  const grid = document.querySelector(".gallery-grid");
  const status = document.querySelector("#gallery-status");
  const viewer = document.querySelector("#viewer");
  const stage = viewer.querySelector(".viewer-stage");
  const forms = document.querySelector("#viewer-forms");
  const formSelect = document.querySelector("#viewer-form");
  const scaleButton = document.querySelector("#viewer-scale");
  const pixels = document.querySelector("#viewer-pixels");
  const previous = document.querySelector("#viewer-prev");
  const next = document.querySelector("#viewer-next");
  let items = [];
  let selection = [];
  let index = 0;

  function setScale(native) {
    stage.classList.toggle("native", native);
    scaleButton.setAttribute("aria-pressed", String(native));
    scaleButton.textContent = native ? "An Bildschirm anpassen" : "Originalgröße · 1:1";
    stage.scrollTop = stage.scrollLeft = 0;
  }
  scaleButton.addEventListener("click", () => setScale(!stage.classList.contains("native")));
  formSelect.addEventListener("change", () => display(index, Number(formSelect.value)));

  function display(number, selectedForm) {
    index = number;
    const item = selection[index];
    selectedForm ??= item.comparison ? -1 : 0;
    const originals = item.originals || [];
    const original = originals[selectedForm];
    pixels.textContent = "";
    forms.hidden = !originals.length;
    formSelect.replaceChildren(...originals.map((entry, n) => new Option(entry.title, String(n))),
      new Option(item.comparison ? "Größenvergleich im Kampfmaßstab" : "Gesamte Bildtafel", "-1"));
    formSelect.value = String(selectedForm);
    setScale(false);
    const isFilm = Boolean(item.poster);
    const media = document.createElement(isFilm ? "video" : "img");
    if (isFilm) {
      media.controls = true;
      media.playsInline = true;
      media.poster = item.poster;
      media.preload = "metadata";
    } else {
      media.alt = original?.title || item.title;
      media.addEventListener("load", () => {
        if (stage.contains(media)) pixels.textContent = media.naturalWidth + " × " + media.naturalHeight + " Pixel";
      }, {once:true});
    }
    media.src = original?.src || item.src;
    media.addEventListener("error", () => {
      stage.textContent = "Die Vorschau konnte nicht geladen werden. Versuche „Original öffnen“.";
    }, {once: true});
    stage.replaceChildren(media);
    document.querySelector("#viewer-title").textContent = original?.title || item.title;
    document.querySelector("#viewer-copy").textContent = item.caption;
    document.querySelector("#viewer-file").href = media.src;
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
      if (item.originals?.length) {
        const hint = document.createElement("small");
        hint.textContent = item.originals.length === 1 ? "Originalbild ansehen" : "Originalbilder ansehen";
        card.append(hint);
      }
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
        if (group === "Bijū & Geister") button.id = bijuAnchor;
        button.addEventListener("click", () => choose(group));
        filters.append(button);
      }
      const showLinkedGroup = () => {
        const biju = document.getElementById(bijuAnchor);
        if (biju && location.hash === "#" + bijuAnchor) {
          choose(biju.textContent);
          biju.scrollIntoView({block:"start"});
        }
      };
      if (filters.firstChild) choose(filters.firstChild.textContent);
      showLinkedGroup();
      window.addEventListener("hashchange", showLinkedGroup);
    } catch {
      status.textContent = "Die Galerie konnte nicht geladen werden. Bitte lade die Seite erneut.";
    }
  }
  load();
})();
