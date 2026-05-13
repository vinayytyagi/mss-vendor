const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api/v1").replace(
  /\/$/,
  ""
);

export const STORAGE_KEYS = {
  token: "mss_vendor_token",
  user: "mss_vendor_user",
};

export function getSession() {
  if (typeof window === "undefined") return { token: null, user: null };
  const token = localStorage.getItem(STORAGE_KEYS.token);
  const raw = localStorage.getItem(STORAGE_KEYS.user);
  let user = null;
  try {
    user = raw ? JSON.parse(raw) : null;
  } catch {
    user = null;
  }
  return { token, user };
}

// Cached snapshot for useSyncExternalStore (must be referentially stable when unchanged)
let _lastToken = null;
let _lastUserRaw = null;
let _lastUser = null;
let _lastSnapshot = { token: null, user: null };

export function getSessionSnapshot() {
  if (typeof window === "undefined") return _lastSnapshot;
  const token = localStorage.getItem(STORAGE_KEYS.token);
  const userRaw = localStorage.getItem(STORAGE_KEYS.user);

  if (token === _lastToken && userRaw === _lastUserRaw) return _lastSnapshot;

  _lastToken = token;
  _lastUserRaw = userRaw;
  try {
    _lastUser = userRaw ? JSON.parse(userRaw) : null;
  } catch {
    _lastUser = null;
  }
  _lastSnapshot = { token, user: _lastUser };
  return _lastSnapshot;
}

export function saveSession(data) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.token, data.token);
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data.user || null));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.user);
}

async function asJson(res) {
  const data = await res.json().catch(() => ({}));
  if (res.ok) return data;

  const err = new Error(data.message || "Request failed");
  err.status = res.status;
  err.code = data.code;
  err.payload = data;
  throw err;
}

export function isAuthError(err) {
  return Number(err?.status) === 401;
}

export async function loginVendor(payload) {
  const res = await fetch(`${API_BASE}/auth/vendor/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return asJson(res);
}

export async function registerVendor(payload) {
  const res = await fetch(`${API_BASE}/auth/vendor/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  return asJson(res);
}

export async function uploadPublicFile(payload) {
  const res = await fetch(`${API_BASE}/oracle-upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Upload failed");
  return data;
}

export async function fetchVendorMe(token) {
  const res = await fetch(`${API_BASE}/vendor/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return asJson(res);
}

export async function updateVendorMe(token, payload) {
  const res = await fetch(`${API_BASE}/vendor/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload || {}),
  });
  return asJson(res);
}

export async function postVendorCommissionNegotiation(token, payload) {
  const res = await fetch(`${API_BASE}/vendor/me/commission`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload || {}),
  });
  return asJson(res);
}

export async function fetchVendorQuotations(token) {
  const res = await fetch(`${API_BASE}/vendor/quotation-requests`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return asJson(res);
}

export async function fetchVendorItems(token, params) {
  const qs = new URLSearchParams(params || {}).toString();
  const res = await fetch(`${API_BASE}/vendor/items${qs ? `?${qs}` : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return asJson(res);
}

export async function createVendorItem(token, payload) {
  const res = await fetch(`${API_BASE}/vendor/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload || {}),
  });
  return asJson(res);
}

export async function updateVendorItem(token, itemId, payload) {
  const res = await fetch(`${API_BASE}/vendor/items/${encodeURIComponent(itemId)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload || {}),
  });
  return asJson(res);
}

export async function deleteVendorItem(token, itemId) {
  const res = await fetch(`${API_BASE}/vendor/items/${encodeURIComponent(itemId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return asJson(res);
}

export async function fetchVendorOrders(token, params) {
  const qs = new URLSearchParams(params || {}).toString();
  const res = await fetch(`${API_BASE}/vendor/orders${qs ? `?${qs}` : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return asJson(res);
}

export async function fetchVendorQuotationById(token, quotationId) {
  const res = await fetch(`${API_BASE}/vendor/quotation-requests/${quotationId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return asJson(res);
}

export async function submitVendorAvailability(token, quotationId, lines) {
  const res = await fetch(`${API_BASE}/vendor/quotation-requests/${quotationId}/availability`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ lines }),
  });
  return asJson(res);
}

export async function uploadVendorKycDocument(token, payload) {
  const res = await fetch(`${API_BASE}/vendor/kyc-documents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload || {}),
  });
  return asJson(res);
}

export async function submitVendorOnboarding(token) {
  const res = await fetch(`${API_BASE}/vendor/onboarding/submit`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return asJson(res);
}
