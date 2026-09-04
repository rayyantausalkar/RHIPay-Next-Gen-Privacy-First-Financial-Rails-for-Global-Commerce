export function getApiBaseUrl(): string {
  let url =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:8000/api/v1";

  url = url.trim().replace(/\/+$/, "");

  // Automatically ensure /api/v1 is present even if the environment variable
  // was set without the /api/v1 subpath (e.g. https://service.onrender.com)
  if (!url.endsWith("/api/v1")) {
    url = `${url}/api/v1`;
  }

  return url;
}

export const API_BASE = getApiBaseUrl();
