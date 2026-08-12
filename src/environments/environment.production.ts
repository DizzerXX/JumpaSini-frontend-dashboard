// Overwritten at build time by scripts/set-env.js when GOOGLE_MAPS_API_KEY /
// API_BASE_URL are present in the build environment (see the "prebuild" npm script).
//
// The Maps JavaScript key renders map tiles ONLY. Places, Place Details and geocoding
// go through the backend proxy (/api/v1/places/*), so no Places-capable key ships in
// this bundle. Restrict the key in the Google Cloud console to:
//   • Application restriction: HTTP referrers → this dashboard's domain(s)
//   • API restriction: "Maps JavaScript API" only
// Do NOT reuse the backend's server key or the Android app's key here — one Google
// key supports a single application-restriction type, so a shared key cannot be
// locked down for browser, Android and server at the same time.
export const environment = {
  production: true,
  apiBaseUrl: 'https://jumpasini-backend.onrender.com/api/v1',
  googleMapsApiKey: '',
};
