const SUPABASE_URL = "https://abdbghwzbqhssoaiynbw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiZGJnaHd6YnFoc3NvYWl5bmJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMDg5OTEsImV4cCI6MjA5OTY4NDk5MX0.2uJw2obqIM2v3HILC5d7V5y5HXIEmPjagpS_moGURGQ";

function baseHeaders(accessToken) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: "Bearer " + (accessToken || SUPABASE_KEY),
    "Content-Type": "application/json"
  };
}

async function readJson(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch (e) {
    return {};
  }
}

export async function signUp(email, password) {
  const res = await fetch(SUPABASE_URL + "/auth/v1/signup", {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email: email, password: password })
  });
  const data = await readJson(res);
  if (!res.ok) {
    throw new Error(data.error_description || data.msg || data.error || "Could not create the account.");
  }
  return data;
}

export async function signIn(email, password) {
  const res = await fetch(SUPABASE_URL + "/auth/v1/token?grant_type=password", {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email: email, password: password })
  });
  const data = await readJson(res);
  if (!res.ok) {
    throw new Error(data.error_description || data.msg || "Wrong email or password.");
  }
  return data;
}

export async function refreshSession(refreshToken) {
  const res = await fetch(SUPABASE_URL + "/auth/v1/token?grant_type=refresh_token", {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken })
  });
  const data = await readJson(res);
  if (!res.ok) {
    const err = new Error("Session expired.");
    err.status = 401;
    throw err;
  }
  return data;
}

export async function signOutRemote(accessToken) {
  try {
    await fetch(SUPABASE_URL + "/auth/v1/logout", {
      method: "POST",
      headers: baseHeaders(accessToken)
    });
  } catch (e) {
    // ignore network errors on logout
  }
}

export async function getNotebook(accessToken, userId) {
  const res = await fetch(
    SUPABASE_URL + "/rest/v1/notebooks?user_id=eq." + encodeURIComponent(userId) + "&select=data",
    { headers: baseHeaders(accessToken) }
  );
  const data = await readJson(res);
  if (!res.ok) {
    const err = new Error("Could not load your notebook.");
    err.status = res.status;
    throw err;
  }
  if (Array.isArray(data) && data.length > 0) {
    return data[0].data;
  }
  return null;
}

export async function saveNotebook(accessToken, userId, notesObj) {
  const res = await fetch(SUPABASE_URL + "/rest/v1/notebooks", {
    method: "POST",
    headers: Object.assign({}, baseHeaders(accessToken), { Prefer: "resolution=merge-duplicates,return=minimal" }),
    body: JSON.stringify([{ user_id: userId, data: notesObj, updated_at: new Date().toISOString() }])
  });
  if (!res.ok) {
    const data = await readJson(res);
    const err = new Error(data.message || "Could not save your notebook.");
    err.status = res.status;
    throw err;
  }
}
