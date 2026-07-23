# SocialMarka

Sosyal medya yönetim SaaS — tek Next.js kod tabanı, iki domain, 7 izole container.

## Domain routing (Traefik)

```
Internet → Traefik / Nginx
           ├─ social.domain.com / socialmarka.com     → (marketing) tanıtım
           └─ app.social.domain.com / app.socialmarka.com → (dashboard) panel
                                                      /posts /calendar /inbox …
```

| Host | Route group | Amaç |
|------|-------------|------|
| `socialmarka.com`, `social.socialmarka.com` | `(marketing)` | Tanıtım / landing |
| `app.socialmarka.com`, `app.social.socialmarka.com` | `(dashboard)` | SaaS panel |
| `api.socialmarka.com` | `/api` | API & webhook |

Local (Traefik): `*.socialmarka.localhost` — tek süreç: `localhost:3000` her iki group’u sunar.

## Docker (7 container)

1. `proxy` — Traefik  
2. `app` — Next.js runner  
3. `worker-publish` — zamanlanmış paylaşım  
4. `worker-general` — analitik, webhook, token refresh, inbox  
5. `worker-media` — FFmpeg / medya  
6. `postgres` — PostgreSQL 15  
7. `redis` — AOF aktif  

```bash
docker compose up --build
```

Yalnızca DB/Redis: `docker compose up -d postgres redis`

## Kurulum (local dev)

```bash
cp .env.example .env
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Postgres: **5433** · Redis: **6379** · App: http://localhost:3000

## Route yapısı (`apps/web/src/app`)

- `(marketing)/` — `/`, `/features`, `/pricing`, `/resources`, `/platforms`, `/contact`
- `(dashboard)/` — `/posts`, `/calendar`, `/accounts`, `/inbox`, `/analytics`, `/admin`
- `(auth)/` — `/login`, `/register` (app host)

## Worker'lar

```bash
npm run worker:publish
npm run worker:general
npm run worker:media
```
