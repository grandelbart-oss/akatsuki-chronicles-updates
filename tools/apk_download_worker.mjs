export const KEY = 'nac-android-20261108-113924/AkatsukiChronicles.apk';
export const SIZE = 2219565579;
export function byteRange(value, size) {
  const m = /^bytes=(\d*)-(\d*)$/.exec(value || '');
  if (!m || (!m[1] && !m[2])) return null;
  let start, end;
  if (!m[1]) {
    const suffix = Number(m[2]);
    if (!Number.isSafeInteger(suffix) || suffix <= 0) return null;
    start = Math.max(0, size - suffix); end = size - 1;
  } else {
    start = Number(m[1]); end = m[2] ? Number(m[2]) : size - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || end < start) return null;
    end = Math.min(end, size - 1);
  }
  return { offset: start, length: end - start + 1 };
}
export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname !== '/' + KEY) return new Response('Not found', {status:404});
    if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', {status:405, headers:{Allow:'GET, HEAD'}});
    const meta = await env.APK.head(KEY);
    if (!meta || meta.size !== SIZE) return new Response('Download unavailable', {status:503, headers:{'Retry-After':'60'}});
    const headers = new Headers({
      'Content-Type':'application/vnd.android.package-archive',
      'Content-Disposition':'attachment; filename="AkatsukiChronicles.apk"',
      'Content-Length':String(meta.size), 'Accept-Ranges':'bytes',
      'ETag':meta.httpEtag, 'Last-Modified':meta.uploaded.toUTCString(),
      'Cache-Control':'public, max-age=31536000, immutable',
      'X-Content-Type-Options':'nosniff'
    });
    if (request.headers.get('If-None-Match')?.split(',').some(v => v.trim() === meta.httpEtag || v.trim() === '*')) return new Response(null, {status:304, headers});
    let range;
    if (request.method === 'GET' && request.headers.has('Range')) {
      const ir = request.headers.get('If-Range');
      const matches = !ir || ir === meta.httpEtag || (Number.isFinite(Date.parse(ir)) && meta.uploaded.getTime() <= Date.parse(ir) + 999);
      if (matches) {
        range = byteRange(request.headers.get('Range'), meta.size);
        if (!range) return new Response(null, {status:416, headers:{'Content-Range':`bytes */${meta.size}`, 'Accept-Ranges':'bytes'}});
        headers.set('Content-Range', `bytes ${range.offset}-${range.offset + range.length - 1}/${meta.size}`);
        headers.set('Content-Length', String(range.length));
      }
    }
    if (request.method === 'HEAD') return new Response(null, {status:200, headers});
    const object = await env.APK.get(KEY, range ? {range} : {});
    if (!object || object.httpEtag !== meta.httpEtag) return new Response('Download changed; retry', {status:503});
    return new Response(object.body, {status:range ? 206 : 200, headers});
  }
};
