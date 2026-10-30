/* Cloudflare Pages Function · one shared copy of the Axiom India Office Options dashboard for every viewer
   Bind a KV namespace to this Pages project under the variable name STATE (Settings → Functions → KV namespace bindings).
   Optional: environment variable RESET_PW; when set, "Restore Delivered Version" is accepted only with the matching x-reset-pw header.
   GET  /api/state → the saved record (JSON) · 404 when nothing is saved yet · 304 when If-None-Match carries the current version
   PUT  /api/state → saves the record · 409 when someone else saved in between (the page merges and retries) · 403 when a reset carries the wrong password */
const JSONH = {'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store'};
const LIMIT = 12 * 1024 * 1024;
const KEY = 'axiom-india-options-state';

export async function onRequestGet({request, env}) {
  if (!env.STATE) return new Response(JSON.stringify({error: 'KV binding STATE is missing'}), {status: 500, headers: JSONH});
  const got = await env.STATE.getWithMetadata(KEY);
  if (!got || !got.value) return new Response('null', {status: 404, headers: JSONH});
  const ver = String((got.metadata && got.metadata.ver) || 0);
  const inm = (request.headers.get('if-none-match') || '').replace(/"/g, '');
  if (inm && inm === ver) return new Response(null, {status: 304, headers: {'cache-control': 'no-store', etag: '"' + ver + '"'}});
  return new Response(got.value, {status: 200, headers: Object.assign({etag: '"' + ver + '"'}, JSONH)});
}

export async function onRequestPut({request, env}) {
  if (!env.STATE) return new Response(JSON.stringify({error: 'KV binding STATE is missing'}), {status: 500, headers: JSONH});
  const body = await request.text();
  if (body.length > LIMIT) return new Response(JSON.stringify({error: 'too large'}), {status: 413, headers: JSONH});
  let j;
  try { j = JSON.parse(body) } catch (e) { return new Response(JSON.stringify({error: 'bad json'}), {status: 400, headers: JSONH}) }
  if (!j || typeof j !== 'object' || !j.S || typeof j.S !== 'object' || typeof j.ver !== 'number') return new Response(JSON.stringify({error: 'bad state'}), {status: 400, headers: JSONH});
  if (j.reset && env.RESET_PW && request.headers.get('x-reset-pw') !== env.RESET_PW) return new Response(JSON.stringify({error: 'reset refused'}), {status: 403, headers: JSONH});
  const cur = await env.STATE.getWithMetadata(KEY);
  const curVer = cur && cur.metadata ? Number(cur.metadata.ver) || 0 : 0;
  if (!j.reset) {
    if (j.base != null && Number(j.base) !== curVer) return new Response(JSON.stringify({ok: false, ver: curVer}), {status: 409, headers: JSONH});   // compare-and-swap: the writer must have seen the current version
    if (curVer > j.ver) return new Response(JSON.stringify({ok: false, ver: curVer}), {status: 409, headers: JSONH});
  } else if (j.ver <= curVer) { j.ver = curVer + 1; }
  const out = JSON.stringify(j);
  await env.STATE.put(KEY, out, {metadata: {ver: j.ver, by: String(j.by || '').slice(0, 40), at: new Date().toISOString()}});
  return new Response(JSON.stringify({ok: true, ver: j.ver}), {status: 200, headers: JSONH});
}

export async function onRequestOptions() {
  return new Response(null, {status: 204, headers: {allow: 'GET, PUT, OPTIONS'}});
}
