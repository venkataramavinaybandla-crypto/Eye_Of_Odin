// API client for the Eye of Odin backend
const API_BASE = "http://127.0.0.1:8000";

export async function fetchReports(typeFilter) {
  let url = `${API_BASE}/reports`;
  if (typeFilter && typeFilter !== "all") {
    url += `?type=${typeFilter}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET /reports failed: ${res.status}`);
  return res.json();
}

export async function fetchReport(id) {
  const res = await fetch(`${API_BASE}/reports/${id}`);
  if (!res.ok) throw new Error(`GET /reports/${id} failed: ${res.status}`);
  return res.json();
}

export async function createReport(data) {
  const res = await fetch(`${API_BASE}/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `POST /reports failed: ${res.status}`);
  }
  return res.json();
}

export async function uploadImage(reportId, file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/reports/${reportId}/image`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `POST /reports/${reportId}/image failed: ${res.status}`);
  }
  return res.json();
}

export async function fetchMatches(reportId) {
  const res = await fetch(`${API_BASE}/reports/${reportId}/matches`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `GET /reports/${reportId}/matches failed: ${res.status}`);
  }
  return res.json();
}

export async function resolveMatchPair(reportIdA, reportIdB) {
  const res = await fetch(`${API_BASE}/reports/resolve-pair`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ report_id_a: reportIdA, report_id_b: reportIdB }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `POST /reports/resolve-pair failed: ${res.status}`);
  }
  return res.json();
}

export function imageUrl(imagePath) {
  if (!imagePath) return null;
  // imagePath is like "uploads/1_black_backpack.jpg"
  return `${API_BASE}/${imagePath}`;
}

