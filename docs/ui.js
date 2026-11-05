"use strict";

const site = window.NAC_SITE;
const roadmap = document.querySelector("#roadmap-panel");
const welcome = document.querySelector("#welcome");
const next = document.querySelector("#welcome-next");
const back = document.querySelector("#welcome-back");
const heading = document.querySelector("#welcome-heading");
const copy = document.querySelector("#welcome-copy");
const link = document.querySelector("#welcome-link");
const counter = document.querySelector("#page-count");
const paypal = document.querySelector("[data-paypal]").href;
const official = "https://naruto-official.com/";
const steps = [
  {
    title: "Ein Fanprojekt.",
    text: "Akatsuki Chronicles entsteht aus Begeisterung für Naruto. Unterstütze bitte auch die offiziellen Manga, Anime und Spiele, damit die Menschen hinter dieser Welt weiter neue Geschichten erzählen können.",
    href: official,
    label: "Zur offiziellen Naruto-Seite"
  },
  {
    title: "Danke fürs Testen.",
    text: "Schön, dass du mit uns durch die Shinobi-Welt ziehst. Wenn ein Weg versperrt ist, ein Gespräch hängen bleibt oder eine Figur seltsam läuft, hilft uns dein Bugreport. Ein Bild der Stelle macht das Nachspielen leichter."
  },
  {
    title: "Wenn du etwas geben magst.",
    text: "Wenn dir das Spiel Freude macht, kannst du die Arbeit daran freiwillig mit einer Spende unterstützen. Auch mit einem Bugreport oder einer weiteren Testrunde hilfst du uns.",
    href: paypal,
    label: "Freiwillig über PayPal spenden"
  }
];
let step = 0;

function drawStep() {
  const page = steps[step];
  heading.textContent = page.title;
  copy.textContent = page.text;
  link.hidden = !page.href;
  if (page.href) {
    link.href = page.href;
    link.firstChild.textContent = page.label + " ";
  }
  next.firstChild.textContent = step === steps.length - 1 ? "Zur Website " : "Weiter ";
  back.hidden = step === 0;
  counter.textContent = (step + 1) + " von " + steps.length;
  document.querySelectorAll(".progress i").forEach((bar, index) => bar.classList.toggle("done", index <= step));
}
function openWelcome() {
  step = 0;
  drawStep();
  welcome.showModal();
  next.focus({preventScroll: true});
}
next.addEventListener("click", () => {
  if (step < steps.length - 1) {
    ++step;
    drawStep();
  } else {
    welcome.close();
  }
});
back.addEventListener("click", () => {
  if (step > 0) {
    --step;
    drawStep();
    if (step === 0) next.focus();
  }
});
document.querySelector("#welcome-open").addEventListener("click", openWelcome);
document.querySelectorAll('a[href="#roadmap"]').forEach(anchor => anchor.addEventListener("click", () => { roadmap.open = true; }));
if (location.hash === "#roadmap") roadmap.open = true;

if (site) {
  document.querySelector("#apk").href = site.apkUrl;
  document.querySelector("#release").href = site.releaseUrl;
  document.querySelector("#version").textContent = "Spielstand " + site.version;
  const target = document.querySelector("#milestones");
  if (Array.isArray(site.roadmap) && site.roadmap.length) {
    target.replaceChildren();
    for (const entry of site.roadmap) {
      const row = document.createElement("article");
      row.className = "mile";
      const status = document.createElement("span");
      status.className = "state";
      status.textContent = entry.status;
      const title = document.createElement("h3");
      title.textContent = entry.title;
      const body = document.createElement("p");
      body.textContent = entry.text;
      row.append(status, title, body);
      target.append(row);
    }
  }
}
openWelcome();
