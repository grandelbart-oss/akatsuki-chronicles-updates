(() => {
  'use strict';
  const mount = document.getElementById('report-mount');
  if (!mount) return;
  const endpoint = 'https://script.google.com/macros/s/AKfycbwSxv-P3cnkb2zM4GLbIBI8eilwgz4zzQmLfVeyRqavfNOsyB7P3WAMxplvj-aDV1HfeQ/exec';
  const maxSize = 2 * 1024 * 1024;
  const maxPictures = 5;
  const maxText = 2500;
  const accepted = ['image/png', 'image/jpeg', 'image/webp'];

  mount.innerHTML = `
    <form class="report-form">
      <div class="report-field">
        <div class="report-label"><label for="report-message">Was ist passiert?</label>
          <small class="report-count" id="report-count">0 / 2.500</small></div>
        <textarea id="report-message" name="message" rows="5" required maxlength="2500"
          aria-describedby="report-count" placeholder="Wo warst du im Spiel? Was hast du gemacht und was ist danach passiert?"></textarea>
      </div>
      <div class="report-field report-files">
        <label class="report-label" for="report-pictures">Screenshots anhängen <small>(optional)</small></label>
        <input class="report-upload" id="report-pictures" type="file" accept="image/png,image/jpeg,image/webp" multiple aria-describedby="report-limits">
        <small id="report-limits">Bis zu 5 Bilder als PNG, JPG oder WebP, je maximal 2 MiB.</small>
        <ul class="report-selected" aria-label="Ausgewählte Bilder"></ul>
      </div>
      <small>Dein Text und deine ausgewählten Bilder gehen an grandelbart@gmail.com.</small>
      <button class="report-submit" type="submit">Bug Report senden</button>
      <p class="report-status" aria-live="polite" role="status"></p>
    </form>`;
  const form = mount.querySelector('form');
  const message = form.querySelector('textarea');
  const picker = form.querySelector('input');
  const selected = form.querySelector('ul');
  const status = form.querySelector('[role="status"]');
  const counter = form.querySelector('.report-count');
  const submit = form.querySelector('[type="submit"]');
  let files = [];
  let reportId = '';
  let busy = false;

  function inform(text, error = false) {
    status.textContent = text;
    status.dataset.state = error ? 'error' : 'info';
  }
  function changed() {
    reportId = '';
    inform('');
    counter.textContent = message.value.length.toLocaleString('de-DE') + ' / 2.500';
  }
  function drawFiles() {
    selected.replaceChildren();
    for (const file of files) {
      const item = document.createElement('li');
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Entfernen';
      remove.setAttribute('aria-label', file.name + ' entfernen');
      remove.addEventListener('click', () => {
        if (busy) return;
        files = files.filter(entry => entry !== file);
        changed();
        drawFiles();
      });
      item.append(document.createTextNode(file.name + ' '), remove);
      selected.append(item);
    }
  }
  message.addEventListener('input', changed);
  picker.addEventListener('change', () => {
    const additions = Array.from(picker.files);
    picker.value = '';
    if (!additions.length || busy) return;
    if (additions.length + files.length > maxPictures) {
      inform('Du kannst insgesamt bis zu fünf Bilder auswählen.', true);
      return;
    }
    for (const file of additions) {
      if (file.size === 0 || file.size > maxSize || !accepted.includes(file.type)) {
        inform('Bitte wähle ein PNG-, JPG- oder WebP-Bild bis 2 MiB. Prüfe die Datei ' + file.name + '.', true);
        return;
      }
    }
    files.push(...additions);
    changed();
    drawFiles();
  });

  function attachment(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({mime: file.type, data: reader.result.split(',')[1]});
      reader.onerror = () => reject(new Error('file'));
      reader.readAsDataURL(file);
    });
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    const text = message.value.trim();
    if (!text || message.value.length > maxText) {
      inform('Beschreibe den Fehler mit 1 bis 2.500 Zeichen.', true);
      message.focus();
      return;
    }
    if (text.split('\n').length > 2000) {
      inform('Bitte fasse den Bericht auf weniger als 2.001 Zeilen zusammen.', true);
      return;
    }
    busy = true;
    for (const control of form.elements) control.disabled = true;
    submit.textContent = 'Wird gesendet …';
    inform('Dein Bericht wird übertragen.');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90000);
    try {
      // Der Dienst erkennt bei unverändertem Inhalt einen wiederholten Versuch an dieser ID.
      if (!reportId) reportId = Array.from(crypto.getRandomValues(new Uint8Array(16)),
        byte => byte.toString(16).padStart(2, '0')).join('');
      const images = await Promise.all(files.map(attachment));
      const response = await fetch(endpoint, {
        method: 'POST', mode: 'cors', redirect: 'follow', credentials: 'omit',
        headers: {'Content-Type': 'text/plain;charset=UTF-8'},
        body: JSON.stringify({id: reportId, message: text, images}), signal: controller.signal
      });
      if (!response.ok || (await response.json()).ok !== true) {
        inform('Der Versanddienst hat den Bericht nicht bestätigt. Deine Eingaben sind noch da. Bitte versuche es später erneut.', true);
        return;
      }
      form.reset();
      files = [];
      drawFiles();
      changed();
      inform('Bericht gesendet. Danke fürs Testen!');
      status.dataset.state = 'success';
    } catch (err) {
      inform(err.message === 'file' ? 'Ein Bild konnte nicht gelesen werden. Bitte wähle es erneut aus.'
        : 'Keine Versandbestätigung erhalten. Bitte prüfe deine Verbindung und versuche es erneut.', true);
    } finally {
      clearTimeout(timer);
      busy = false;
      for (const control of form.elements) control.disabled = false;
      submit.textContent = 'Bug Report senden';
    }
  });
})();
