export const SUPABASE_URL = "https://mzqjivtidadjaawmlslz.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16cWppdnRpZGFkamFhd21sc2x6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5OTYxMDUsImV4cCI6MjA4NjU3MjEwNX0.o9WeG3HCDvPQ6SIv_EuzxR44VTZiMPfbUG3r7Ar8WD4";

export function getToken() {
  const stored = localStorage.getItem("sb-mzqjivtidadjaawmlslz-auth-token");
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    return parsed?.access_token || parsed;
  } catch {
    return stored;
  }
}

export function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    apikey: SUPABASE_ANON_KEY,
    "Content-Type": "application/json",
  };
}

export async function supabaseGet(path, token) {
  const res = await fetch(SUPABASE_URL + "/rest/v1/" + path, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("GET " + path + ": " + res.status);
  return res.json();
}

export async function supabasePost(path, body, token) {
  const res = await fetch(SUPABASE_URL + "/rest/v1/" + path, {
    method: "POST",
    headers: { ...authHeaders(token), Prefer: "return=representation" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("POST " + path + ": " + res.status);
  return res.json();
}

export async function supabasePatch(path, body, token) {
  const res = await fetch(SUPABASE_URL + "/rest/v1/" + path, {
    method: "PATCH",
    headers: { ...authHeaders(token), Prefer: "return=representation" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("PATCH " + path + ": " + res.status);
  return res.json();
}

export async function supabaseDelete(path, token) {
  const res = await fetch(SUPABASE_URL + "/rest/v1/" + path, {
    method: "DELETE",
    headers: { ...authHeaders(token), Prefer: "return=minimal" },
  });
  if (!res.ok) throw new Error("DELETE " + path + ": " + res.status);
}

export async function supabaseRpc(fnName, params, token) {
  const res = await fetch(SUPABASE_URL + "/rest/v1/rpc/" + fnName, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("RPC " + fnName + ": " + res.status);
  return res.json();
}
