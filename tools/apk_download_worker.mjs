// Generated catalog contains only locally verified, immutable APK objects.
export const CATALOG = /*BEGIN_CATALOG*/{"nac-android-20261108-113924/AkatsukiChronicles.apk":{"bytes":2219565579,"sha256":"7eb360e9a1fc7f5f67a5adec55cc6ab84f5976333182c8caa6e1648495cce241"},"nac-android-20261110-204351/AkatsukiChronicles.apk":{"bytes":2227446051,"sha256":"5ad521d12f06d8badf95f65756267dedbea5368abeca2a6f5e1b49c9c0ade1df"}}/*END_CATALOG*/;
export function validateCatalog(catalog) {
  if (!catalog || typeof catalog !== 'object' || Array.isArray(catalog) || !Object.keys(catalog).length) throw Error('Empty catalog');
  for (const [key, entry] of Object.entries(catalog)) {
    if (!/^nac-android-\d{8}(?:-\d{6})?\/AkatsukiChronicles\.apk$/.test(key)
        || !Number.isSafeInteger(entry.bytes) || entry.bytes <= 0 || !/^[a-f0-9]{64}$/.test(entry.sha256)) throw Error('Invalid catalog entry');
  }
  return catalog;
}
export function byteRange(value, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value || '');
  if (!match || (!match[1] && !match[2])) return null;
  let start, end;
  if (!match[1]) {
    const suffix = Number(match[2]);
    if (!Number.isSafeInteger(suffix) || suffix <= 0) return null;
    start = Math.max(0, size - suffix); end = size - 1;
  } else {
    start = Number(match[1]); end = match[2] ? Number(match[2]) : size - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || end < start) return null;
    end = Math.min(end, size - 1);
  }
  return {offset:start, length:end - start + 1};
}
export function createHandler(catalog) {
  validateCatalog(catalog);
  return {async fetch(request, env) {
    const key = new URL(request.url).pathname.slice(1);
    if (!Object.hasOwn(catalog, key)) return new Response('Not found', {status:404});
    if (!['GET','HEAD'].includes(request.method)) return new Response('Method not allowed', {status:405, headers:{Allow:'GET, HEAD'}});
    const expected = catalog[key], meta = await env.APK.head(key);
    if (!meta || meta.size !== expected.bytes || meta.customMetadata?.sha256 !== expected.sha256) return new Response('Download unavailable', {status:503, headers:{'Retry-After':'60'}});
    const headers = new Headers({
      'Content-Type':'application/vnd.android.package-archive',
      'Content-Disposition':'attachment; filename="AkatsukiChronicles.apk"',
      'Content-Length':String(meta.size), 'Accept-Ranges':'bytes',
      ETag:meta.httpEtag, 'Last-Modified':meta.uploaded.toUTCString(),
      'Cache-Control':'public, max-age=31536000, immutable', 'X-Content-Type-Options':'nosniff'
    });
    const conditional = request.headers.get('If-None-Match');
    if (conditional?.split(',').some(value => value.trim().replace(/^W\//,'') === meta.httpEtag || value.trim() === '*')) return new Response(null, {status:304, headers});
    let range;
    if (request.method === 'GET' && request.headers.has('Range')) {
      const ir = request.headers.get('If-Range');
      if (!ir || ir === meta.httpEtag || (!ir.startsWith('W/') && Number.isFinite(Date.parse(ir)) && meta.uploaded.getTime() <= Date.parse(ir) + 999)) {
        range = byteRange(request.headers.get('Range'), meta.size);
        if (!range) return new Response(null, {status:416, headers:{'Content-Range':`bytes */${meta.size}`, 'Accept-Ranges':'bytes'}});
        headers.set('Content-Range', `bytes ${range.offset}-${range.offset+range.length-1}/${meta.size}`);
        headers.set('Content-Length', String(range.length));
      }
    }
    if (request.method === 'HEAD') return new Response(null, {status:200, headers});
    const object = await env.APK.get(key, range ? {range} : {});
    if (!object || object.httpEtag !== meta.httpEtag || object.customMetadata?.sha256 !== expected.sha256) return new Response('Download changed; retry', {status:503});
    return new Response(object.body, {status:range ? 206 : 200, headers});
  }};
}
export default createHandler(CATALOG);
