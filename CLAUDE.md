# JumpaSini Frontend Dashboard — Angular

This is the Angular web dashboard for JumpaSini.

## Responsibilities

- Session creation and management UI
- Shareable link landing pages for collaborative sessions
- Admin / seeding panel
- Google Maps JS SDK rendering (map display only — data comes from backend)

## Critical Rule

**All API calls go to the Laravel backend.** Never call Google APIs, Google Places, or any external API directly from this app. The backend proxies everything.

## Coding Standards

- Follow the **Angular style guide** strictly (file naming, folder structure, single responsibility)
- Use **standalone components** (Angular 17+) — no NgModules unless absolutely necessary
- Use **OnPush change detection** strategy on all components
- Use Angular **HttpClient** with typed responses for all backend calls
- Keep components dumb where possible — push logic into services
- Use Angular Signals or RxJS for state — no plain mutable class properties for derived state

## Project Structure

```
src/
  app/
    core/           — singleton services, interceptors, guards
    features/       — feature folders (session/, admin/, landing/)
      session/
      admin/
      landing/
    shared/         — reusable standalone components, pipes, directives
  environments/
```

## Environment

- Angular 17+
- Node.js / npm
- TypeScript strict mode enabled
