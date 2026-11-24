"use strict";
// Run the actual browser script against a small DOM model; no network or packages.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "docs/ui.js"), "utf8");
const dataContext = {window: {}};
vm.runInNewContext(fs.readFileSync(path.join(root, "docs/data.js"), "utf8"), dataContext);
const base = structuredClone(dataContext.window.NAC_SITE);
delete base.gameplayUpdate;
const update = {
  baseId: "nac-android-r12-content-20261123", revision: 13,
  bytes: 1201556,
  sha256: "d35ad172072b5fda8fb885f2954a09d609a9985f4678a52aaa68fc3220b07c7c",
  url: "https://github.com/grandelbart-oss/akatsuki-chronicles-updates/releases/download/nac-android-r12-content-20261123-r13/update.pck",
  releaseUrl: "https://github.com/grandelbart-oss/akatsuki-chronicles-updates/releases/tag/nac-android-r12-content-20261123-r13",
  platforms: ["apk", "pc"], cumulative: true
};

function render(patch, search = "") {
  const nodes = new Map();
  const node = selector => {
    if (!nodes.has(selector)) nodes.set(selector, {
      hidden: false, firstChild: {textContent: ""}, classList: {toggle() {}},
      listeners: {}, addEventListener(name, callback) { this.listeners[name] = callback; },
      append() {}, replaceChildren() {}, showModal() {}, close() {}, focus() {}
    });
    return nodes.get(selector);
  };
  const platformSwitch = node(".platform-switch");
  const choose = platform => {
    const button = {dataset: {platform}, closest() { return this; }};
    platformSwitch.listeners.click({target: button});
  };
  platformSwitch.querySelector = () => ({click() { choose("pc"); }});
  node("[data-paypal]").href = "https://example.invalid/donate";
  const site = structuredClone(base);
  if (patch) site.gameplayUpdate = structuredClone(patch);
  vm.runInNewContext(source, {
    window: {NAC_SITE: site},
    document: {
      querySelector: node, querySelectorAll() { return []; },
      createElement() { return {append() {}}; }
    },
    location: {hash: "#download", search}, URLSearchParams, Intl
  });
  return {node, choose, site};
}

const noUpdate = render(null);
assert.equal(noUpdate.node("#version").textContent, "Android · R12");
assert.equal(noUpdate.node("#gameplay-update").hidden, true);
const pcBase = render(null, "?platform=pc");
assert.equal(pcBase.node("#version").textContent, "PC · R12");
assert.equal(pcBase.node("#release").href, "#pc-installation");

const both = render(update);
assert.equal(both.node("#version").textContent, "Android · Basis R12 · Spielupdate R13");
assert.equal(both.node("#gameplay-update").hidden, false);
assert.equal(both.node("#gameplay-update-title").textContent, "Kumulatives Spielupdate R13 · 1,20 MB. ");
assert.match(both.node("#gameplay-update-copy").textContent, /Update laden/);
assert.match(both.node("#gameplay-update-copy").textContent, /vollständig schließen und neu starten/);
assert.equal(both.node("#gameplay-update-release").href, update.releaseUrl);
both.choose("pc");
assert.equal(both.node("#version").textContent, "PC · Basis R12 · Spielupdate R13");
assert.equal(both.node("#gameplay-update").hidden, false);
assert.equal(both.node("#release").href, "#pc-installation");
both.choose("apk");
assert.equal(both.node("#release").href, "#installation");
assert.equal(both.node("#apk").href, base.apkUrl);
assert.equal(both.node("#pc").href, base.pcUrl);
assert.equal(both.site.revision, 12);
assert.equal(both.site.pcRevision, 12);

const deepLink = render(update, "?platform=pc");
assert.equal(deepLink.node("#version").textContent, "PC · Basis R12 · Spielupdate R13");
const androidOnly = render({...update, platforms: ["apk"]}, "?platform=pc");
assert.equal(androidOnly.node("#gameplay-update").hidden, true);
assert.equal(androidOnly.node("#version").textContent, "PC · R12");
for (const invalid of [{...update, baseId: "another-base"}, {...update, revision: 12}]) {
  const result = render(invalid);
  assert.equal(result.node("#gameplay-update").hidden, true);
  assert.equal(result.node("#version").textContent, "Android · R12");
}
console.log("PASS: R12 without patch, R13 on Android/PC, manual restart instructions, unchanged installers, PC deep link, incompatible update hidden.");
