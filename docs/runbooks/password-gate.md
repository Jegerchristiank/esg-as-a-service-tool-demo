# Password gate for web-appen

Den offentlige webapp er nu beskyttet af en simpel adgangskode, før brugeren kan tilgå landing-siden og wizard-flowet.

## Adgangskode og cookie

- Adgangssiden findes på `/access` og accepterer adgangskoden `esg-as-a-service`.
- Ved succes sættes en `httpOnly`-cookie (`eaas-password-access`) med værdien `granted` og `SameSite=Lax`.
- Adgangen udløber efter 30 dage og kræver derefter ny login.

## Redirects

- Login-siden accepterer en `redirect`-query der peger på en sti i appen (fx `/wizard`).
- Middleware omskriver HTML-forespørgsler uden cookie til `/access?redirect=<sti>`, så brugeren sendes tilbage til den oprindelige destination efter login.

## Tests og automatisering

- Playwright-helperen `performPasswordLogin` bruges i `wizard.spec.ts` til at gennemføre login-flows i E2E-tests.
- Ved lokal udvikling skal du logge ind én gang i browseren; cookie deles på tværs af faner, så wizard kan åbnes direkte efterfølgende.

Kontakt platform-teamet hvis adgangskoden skal rulles eller hvis der opstår problemer med middleware-redirects.
