/**
 * Injects build-time configuration into the Angular production environment file.
 *
 * Angular bakes `environment.production.ts` into the bundle at build time, so values
 * that differ per deploy have to be written before `ng build` runs. This lets Render
 * supply GOOGLE_MAPS_API_KEY / API_BASE_URL as environment variables instead of the
 * key being committed to the repo.
 *
 * Runs automatically via the "prebuild" npm script. If neither variable is set (local
 * dev, CI), the existing file is left untouched so nothing churns in git.
 */
const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'src', 'environments', 'environment.production.ts');

const apiBaseUrl = process.env.API_BASE_URL;
const mapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

if (!apiBaseUrl && !mapsApiKey) {
  console.log('[set-env] No build-time env vars set; leaving environment.production.ts as is.');
  process.exit(0);
}

const contents = `// GENERATED AT BUILD TIME by scripts/set-env.js — do not edit by hand.
//
// The Maps JavaScript key below renders map tiles only. Places, Place Details and
// geocoding go through the backend proxy (/api/v1/places/*). Restrict this key to
// HTTP referrers (this dashboard's domain) and the Maps JavaScript API only.
export const environment = {
  production: true,
  apiBaseUrl: '${apiBaseUrl ?? 'https://jumpasini-backend.onrender.com/api/v1'}',
  googleMapsApiKey: '${mapsApiKey ?? ''}',
};
`;

fs.writeFileSync(targetPath, contents, { encoding: 'utf8' });

console.log(
  `[set-env] Wrote environment.production.ts (apiBaseUrl=${apiBaseUrl ?? 'default'}, ` +
    `googleMapsApiKey=${mapsApiKey ? 'set' : 'EMPTY — map will not render'})`,
);
