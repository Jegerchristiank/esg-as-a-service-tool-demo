# Publish runbook

Denne runbook beskriver hvordan vi udgiver pakker til GitHub Packages uden at lække tokens i lokale opsætninger.

## Oversigt

- GitHub Actions workflowet [`Publish`](../../.github/workflows/publish.yml) kører lint, test og build før udgivelse.
- Workflowet opretter en midlertidig `~/.npmrc`, så adgangstoken kun lever i CI.
- Lokale udviklere behøver ingen GitHub token for almindeligt arbejde og bør kun konfigurere en personlig `~/.npmrc`, når de skal udgive.

## Forudsætninger

- GitHub personal access token med scope `write:packages`.
- `corepack` aktiveret (kræves for pnpm) og pnpm versionen i `packageManager`.

## Publicering fra lokal maskine

1. Log ind i GitHub og opret et PAT med mindst `write:packages`.
2. Eksporter tokenet midlertidigt:
   ```bash
   export NODE_AUTH_TOKEN=ghp_xxx
   ```
3. Skriv en midlertidig `~/.npmrc`:
   ```bash
   cat <<'RC' > ~/.npmrc
   @org:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
   always-auth=true
   RC
   ```
4. Kør kvalitetskontrollerne: `pnpm -w run lint && pnpm -w run typecheck && pnpm -w run test && pnpm -w run build`.
5. Udgiv: `pnpm -r publish --access restricted`.
6. Fjern tokenet fra miljøet og slet `~/.npmrc`, hvis det kun var til midlertidigt brug.

## CI workflow

- Workflowet opretter den samme `~/.npmrc` på farten med `${{ secrets.GITHUB_TOKEN }}`.
- Tokenet gives til `pnpm -r publish` via `NODE_AUTH_TOKEN` og findes ikke i repoet.
- Hvis publiceringen fejler, rotation af tokenet er kun påkrævet i GitHub secrets.

## Fejlfinding

- **`Failed to replace env in config: ${NODE_AUTH_TOKEN}`:** Tokenet er ikke sat. Eksporter det eller kør via workflowet.
- **`403 Forbidden` under publish:** Kontroller at PAT har `write:packages` og at pakken hedder `@org/*`.
- **`pnpm` beder om login under install:** Sørg for at `~/.npmrc` er fjernet; lokale installs skal ikke bruge auth.

## Rapporterings- og godkendelsesflow

- Review-siden giver nu adgang til fire eksportkanaler: PDF, CSRD JSON, XBRL og API-indsendelse. Alle bruger den samme datastruktur og inkluderer audit trail.
- Brug `Download CSRD-pakke` for at validere data i support; filen indeholder sektioner med narrativer, ansvar og noter.
- XBRL-filen følger nu ESRS/EFRAG-taksonomien med `link:schemaRef`, kontekster og enheder. Hvert modulresultat mapper til et `esrs:*`-begreb, og instansen valideres via `buildXbrlInstance.test.ts`.
- `Send til myndighed` poster payloaden til `NEXT_PUBLIC_REPORT_API_ENDPOINT`. Sørg for at sætte miljøvariablen i hostingmiljøet, hvis rapporter skal videresendes automatisk.
- Udfyld `reportingPeriod` og `entityIdentifier`, når rapporter downloades eller indsendes, så XBRL-filen indeholder korrekt periode og identifikation.
- Socialmodulerne (S1-S4) og G1 udsender nu ekstra ESRS-fakta for arbejdstid, kontraktstatus, værdikædedialog, lokalsamfunds- og forbruger-narrativer samt governance-politikker.
- Audit trail og ansvarssporing gemmes per felt i wizard. Brug JSON-outputtet i "Se rå data" eller CSRD-pakken, når compliance-teamet efterspørger historik.
