# Кралската чаша · King's Cup BG

Мобилна игра с карти на български. Няма профили, сървър или външни услуги. Състоянието на играта се пази локално в браузъра; приложението може да се инсталира като PWA и да работи офлайн след първото зареждане.

## Стартиране локално

Изисква Node.js 20.19+ или 22.12+.

```bash
npm ci
npm run dev
```

За проверка и production build:

```bash
npm run typecheck
npm test
npm run build
npm run preview
```

## GitHub Pages deployment

Проектът се публикува единствено чрез GitHub Pages и GitHub Actions. Workflow-ът в `.github/workflows/deploy.yml` се стартира при всеки push към `main` (и може да се стартира ръчно от Actions). Vite извлича името на repository от `GITHUB_REPOSITORY` и задава автоматично поддиректорията като base path. За repository `owner/KingsCup` адресите ще започват с `/KingsCup/`; за `owner/owner.github.io` се използва `/`.

### Настройки в GitHub

1. Push-нете проекта към GitHub repository и се уверете, че основният branch се казва `main`.
2. Отворете **Settings → Pages**.
3. В **Build and deployment → Source** изберете **GitHub Actions**.
4. Отворете **Settings → Actions → General → Workflow permissions**. Ако организацията изисква изрично разрешаване, позволете GitHub Actions да стартират и запишете промените. Pages deployment-ът използва permissions, декларирани във workflow (`pages: write`, `id-token: write`, `contents: read`).
5. Push-нете commit към `main`. В **Actions → Deploy to GitHub Pages** изчакайте workflow-ът да мине успешно. Публикуваният URL се показва в deployment-а и в **Settings → Pages**.

Не е необходим `gh-pages` branch, custom build command в настройките или секретен token.

### Проверка на build-а с repository base path

GitHub Actions подава автоматично owner/repository. За локална емулация в PowerShell:

```powershell
$env:GITHUB_REPOSITORY = "owner/KingsCup"
npm run build
Remove-Item Env:GITHUB_REPOSITORY
```

Проверете, че `dist/index.html` сочи към `/KingsCup/assets/...`, а `dist/manifest.webmanifest`, service worker-ът и иконите са в `dist`. PWA manifest-ът и service worker-ът са с обхват на repository поддиректорията; service worker-ът кешира production файловете за следващо офлайн отваряне.

## Как се играе

- Добавете 2–15 имена и изберете класически или парти режим.
- Играчите теглят по часовниковата стрелка; всяка карта се появява само веднъж.
- Използвайте историята, звука и отмяната от екрана на играта. Напредъкът се запазва автоматично на устройството.
- При четвъртия поп играта приключва без обща чаша или задължителна напитка.

Само за пълнолетни. Всички правила са по желание; безалкохолна напитка или пропускане са позволени по всяко време.
