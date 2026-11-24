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
  const releaseLink = document.querySelector("#release");
  const versionLabel = document.querySelector("#version");
  const platformSwitch = document.querySelector(".platform-switch");
  if (site.pcUrl) document.querySelector("#pc").href = site.pcUrl;
  function showPlatformVersion(platform) {
    const pc = platform === "pc" && Number.isInteger(site.pcRevision);
    const platformId = pc ? "pc" : "apk";
    const baseRevision = pc ? site.pcRevision : site.revision;
    const update = site.gameplayUpdate;
    const hasUpdate = update && Number.isInteger(update.revision)
      && update.revision > baseRevision && update.baseId === (pc ? site.pcBaseId : site.baseId)
      && Array.isArray(update.platforms) && update.platforms.includes(platformId);
    versionLabel.textContent = hasUpdate
      ? (pc ? "PC" : "Android") + " · Basis R" + baseRevision + " · Spielupdate R" + update.revision
      : pc ? "PC · R" + site.pcRevision
        : site.delivery === "full_content" ? "Android · R" + site.revision : "Spielstand " + site.version;
    const updateNote = document.querySelector("#gameplay-update");
    if (updateNote) {
      updateNote.hidden = !hasUpdate;
      if (hasUpdate) {
        const size = new Intl.NumberFormat("de-DE", {minimumFractionDigits: 2, maximumFractionDigits: 2})
          .format(update.bytes / 1000000);
        document.querySelector("#gameplay-update-title").textContent =
          "Kumulatives Spielupdate R" + update.revision + " · " + size + " MB. ";
        document.querySelector("#gameplay-update-copy").textContent =
          "Im Hauptmenü „Update laden“ wählen. Nach dem Download das Spiel vollständig schließen und neu starten. "
          + "Der Download oben installiert die R" + baseRevision + "-Basis; das Spielupdate wird danach separat geladen. ";
        const updateLink = document.querySelector("#gameplay-update-release");
        updateLink.href = update.releaseUrl;
        updateLink.textContent = "Neuerungen zu R" + update.revision;
      }
    }
    releaseLink.href = pc ? site.pcReleaseUrl : site.releaseUrl;
    const installationLink = pc ? site.pcDelivery === "bundled_content" : site.delivery === "full_content";
    releaseLink.firstChild.textContent = installationLink
      ? "Installation & Neuerungen " : "Versionshinweise ";
  }
  if (platformSwitch) {
    platformSwitch.addEventListener("click", event => {
      const button = event.target.closest("button[data-platform]");
      if (button) showPlatformVersion(button.dataset.platform);
    });
  }
  showPlatformVersion("apk");
  if (new URLSearchParams(location.search).get("platform") === "pc") {
    const pcButton = platformSwitch?.querySelector('button[data-platform="pc"]');
    if (pcButton) pcButton.click();
  }
  const target = document.querySelector("#milestones");
  if (Array.isArray(site.roadmap) && site.roadmap.length) {
    target.replaceChildren();
    for (const state of ["Spielbar", "Im Test", "Geplant"]) {
      const entries = site.roadmap.filter(entry => entry.status === state);
      if (!entries.length) continue;
      const group = document.createElement("details");
      group.className = "milestone-group";
      group.open = state === "Geplant";
      const label = document.createElement("summary");
      label.textContent = state + " (" + entries.length + ")";
      group.append(label);
      for (const entry of entries) {
        const row = document.createElement("article");
        row.className = "mile";
        const title = document.createElement("h3");
        title.textContent = entry.title;
        const body = document.createElement("p");
        body.textContent = entry.text;
        row.append(title, body);
        group.append(row);
      }
      target.append(group);
    }
  }
}
openWelcome();
