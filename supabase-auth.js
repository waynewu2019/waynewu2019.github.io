// Shared Supabase Auth helper. Include the supabase-js CDN script BEFORE this file.
//
// ============================================================
//  CONFIG — if you create or restore a Supabase project, update
//  these two values and redeploy. Everything else on the gated
//  pages (specs, performance, portal, roadmap, admin) picks the
//  new values up automatically from this single file.
// ============================================================
const SB_URL = 'https://sxqfjrwjozahabuppxii.supabase.co';
const SB_ANON_KEY = 'sb_publishable_VczqX23SJJUdTICVevZc-w_Cya1b3IV';
// ============================================================

const sb = window.supabase.createClient(SB_URL, SB_ANON_KEY);

// Turns low-level network failures (backend unreachable, DNS dead,
// CORS blocked) into a message site visitors can act on, instead of
// the raw browser "Failed to fetch".
function sbFriendlyError(err) {
  const raw = (err && (err.message || String(err))) || '';
  const isNetwork = /failed to fetch|networkerror|load failed|err_name_not_resolved|err_internet_disconnected|err_connection/i.test(raw)
    || (err && err.name === 'TypeError');
  if (isNetwork) {
    return new Error('Unable to reach the partner login service right now. This is usually temporary — please try again in a few minutes, or email hello@symaticslab.com for access.');
  }
  return err instanceof Error ? err : new Error(raw || 'Sign-in failed. Please check your email and password.');
}

async function sbSignIn(email, password) {
  try {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return { data, error: sbFriendlyError(error) };
    return { data, error: null };
  } catch (e) {
    return { data: null, error: sbFriendlyError(e) };
  }
}

async function sbSignOut() {
  return sb.auth.signOut();
}

async function sbGetSession() {
  const { data } = await sb.auth.getSession();
  return data.session;
}

async function sbFetchProtected(path, opts) {
  const session = await sbGetSession();
  if (!session) return null;
  opts = opts || {};
  opts.headers = Object.assign({}, opts.headers, { 'Authorization': 'Bearer ' + session.access_token });
  return fetch(path, opts);
}

// Shared sign-out used by the small session bar injected on gated pages
// (specs, performance, roadmap). Portal has its own dedicated button that
// also calls this.
async function handlePartnerSignout() {
  await sbSignOut();
  location.reload();
}

// Injects a small "Signed in as ... / End Session" bar at the top of a
// gated content container after protected content loads.
function injectSessionBar(containerEl, email) {
  if (!containerEl || document.getElementById('partner-session-bar')) return;
  const bar = document.createElement('div');
  bar.id = 'partner-session-bar';
  bar.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;background:#F7F8FB;border:1px solid var(--border,#e5e7eb);border-radius:8px;padding:10px 14px;margin-bottom:20px;font-size:13px;color:var(--body,#555);';
  bar.innerHTML = 'Signed in as <strong>' + email + '</strong>' +
    '<button type="button" onclick="handlePartnerSignout()" style="background:#fff;border:1px solid var(--border,#e5e7eb);border-radius:6px;padding:6px 12px;font-size:12.5px;cursor:pointer;color:var(--ink,#111);">End Session</button>';
  containerEl.insertBefore(bar, containerEl.firstChild);
}
