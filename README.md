# ESG status-dashboard

Denne repository indeholder en enkel Next.js-applikation, der viser et statisk ESG-statusoverblik. Al tidligere backend-, wizard- og modul-kode er fjernet for at holde projektet fokuseret på den brugerrettede oplevelse.

## Hurtig start

1. Installer afhængigheder:
   ```bash
   pnpm install
   ```
2. Start udviklingsserveren:
   ```bash
   pnpm dev
   ```
3. Byg produktion eller kør kvalitetsscripts efter behov:
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm build
   ```

## Struktur

- `apps/web/app` – Next.js App Router med landing page (`page.tsx`), global styling (`globals.css`) og standard layout.
- `apps/web/package.json` – scripts og afhængigheder for webappen.
- Rodkonfiguration (`package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `prettier.config.cjs`).

## Videre udvikling

- Tilføj nye sektioner eller data direkte i `apps/web/app/page.tsx`.
- Hvis der introduceres tests eller ekstra tooling, så opdater scripts i `apps/web/package.json` og dokumentationen her.
- Hold `AGENTS.md` ajour, så kommende ændringer er lette at forstå.
