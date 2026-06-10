# 🚀 Інструкція з розгортання проекту

Цей документ описує повний процес розгортання проекту для нових розробників.  
Монорепозиторій містить **фронтенд** (Astro, на Vercel) та **бекенд** (Go, на Railway).

---

## Зміст

1. [Вимоги](#1-вимоги)
2. [Зовнішні сервіси — що треба завести заздалегідь](#2-зовнішні-сервіси)
3. [Розгортання бекенду (Railway)](#3-розгортання-бекенду-railway)
4. [Розгортання фронтенду (Vercel)](#4-розгортання-фронтенду-vercel)
5. [Налаштування Google OAuth](#5-налаштування-google-oauth)
6. [Перевірка роботи](#6-перевірка-роботи)
7. [Локальний запуск для розробки](#7-локальний-запуск-для-розробки)

---

## 1. Вимоги

Перед початком переконайся, що маєш акаунти на цих платформах:

| Платформа | Призначення | Посилання |
|---|---|---|
| **GitHub** | Зберігання коду | github.com |
| **Railway** | Хостинг бекенду (Go-сервер) | railway.app |
| **Vercel** | Хостинг фронтенду (Astro-сайт) | vercel.com |
| **Qdrant Cloud** | Векторна база знань чат-бота | cloud.qdrant.io |
| **OpenRouter** | LLM API для відповідей чат-бота | openrouter.ai |
| **Google Cloud Console** | OAuth авторизація в адмінку | console.cloud.google.com |
| **Upstash** (опціонально) | Redis-кеш для прискорення відповідей | console.upstash.com |

---

## 2. Зовнішні сервіси

### 2.1. Qdrant Cloud (векторна БД)

1. Зайди на [cloud.qdrant.io](https://cloud.qdrant.io) → створи акаунт.
2. Натисни **"Create Cluster"** → вибери безкоштовний тариф → регіон на свій вибір.
3. Після створення кластеру скопіюй:
   - **Cluster Endpoint** (вигляд: `https://xxxxxxxx.eu-central-1-0.aws.cloud.qdrant.io`)
   - Перейди у вкладку **"API Keys"** → натисни **"Create"** → скопіюй ключ.
4. Збережи ці два значення — вони підуть у змінні `QDRANT_URL` та `QDRANT_API_KEY`.

### 2.2. OpenRouter (LLM API)

1. Зайди на [openrouter.ai](https://openrouter.ai) → створи акаунт.
2. Перейди у **"Keys"** → натисни **"Create Key"**.
3. Скопіюй ключ (він виглядає як `sk-or-v1-...`).
4. Це значення піде у змінну `OPENROUTER_API_KEY`.

### 2.3. Google Cloud — OAuth (для входу в адмінку)

1. Зайди на [console.cloud.google.com](https://console.cloud.google.com).
2. Вибери або створи проект.
3. Перейди: **"APIs & Services"** → **"Credentials"** → **"+ Create Credentials"** → **"OAuth 2.0 Client ID"**.
4. Тип застосунку: **"Web application"**.
5. Заповни поля (замість `{ВАШ_ДОМЕН_RAILWAY}` і `{ВАШ_ДОМЕН_VERCEL}` встав реальні адреси, які отримаєш після деплою):

   **Authorized JavaScript origins:**
   ```
   https://{ВАШ_ДОМЕН_RAILWAY}
   https://{ВАШ_ДОМЕН_VERCEL}
   http://localhost:8080
   http://localhost:4321
   ```

   **Authorized redirect URIs:**
   ```
   https://{ВАШ_ДОМЕН_RAILWAY}/admin-{ADMIN_PATH_HASH}/auth/callback
   http://localhost:8080/admin-{ADMIN_PATH_HASH}/auth/callback
   ```

   > ⚠️ **Важливо:** `ADMIN_PATH_HASH` — це хеш, який генерується автоматично з твого `ADMIN_TOKEN`.  
   > Щоб дізнатись свій хеш, запусти бекенд локально і подивись у логах рядок:  
   > `Admin panel mounted path=/admin-{ТУТ БУДЕ ХЕШ}`

6. Збережи → скопіюй **Client ID** та **Client Secret**.

---

## 3. Розгортання бекенду (Railway)

### Крок 1 — Підключи репозиторій

1. Зайди на [railway.app](https://railway.app) → **"New Project"** → **"Deploy from GitHub repo"**.
2. Вибери репозиторій `website_ao`.
3. Коли Railway запитає, яку гілку деплоїти — вибери **`main`**.

### Крок 2 — Вкажи кореневу директорію бекенду

> **Важливо!** Без цього Railway буде намагатись задеплоїти весь монорепозиторій і зазнає помилки.

1. В налаштуваннях сервісу перейди у вкладку **Settings**.
2. Знайди поле **"Root Directory"**.
3. Впиши: `/apps/backend`
4. Збережи.

### Крок 3 — Додай постійний диск (Volume)

Щоб база даних SQLite (`analytics.db`) не стиралась при кожному деплої:

1. На головній сторінці проекту в Railway натисни **"+ Add New Service"** → вибери **"Volume"**.
2. У полі **"Mount Path"** впиши: `/app/data`
3. Збережи.

### Крок 4 — Встав усі змінні середовища

Перейди на свій сервіс → вкладка **Variables** → натисни **"Raw Editor"** і встав наступний блок, замінивши значення у кутових дужках `<...>` на свої реальні:

```env
# ─── Сервер ──────────────────────────────────────────────────────────────
PORT=8080
DB_PATH=/app/data/analytics.db

# ─── CORS — обов'язково вкажи реальну адресу твого Vercel-сайту ──────────
ALLOWED_ORIGINS=https://<ВАШ_ДОМЕН_VERCEL>,http://localhost:4321

# ─── Qdrant (векторна база знань) ────────────────────────────────────────
QDRANT_URL=<CLUSTER_ENDPOINT_З_QDRANT_CLOUD>
QDRANT_API_KEY=<API_KEY_З_QDRANT_CLOUD>

# ─── LLM (відповіді чат-бота) ────────────────────────────────────────────
OPENROUTER_API_KEY=<КЛЮЧ_З_OPENROUTER>

# ─── Безпека адмінки ─────────────────────────────────────────────────────
# Генерується командою: openssl rand -hex 32
ADMIN_TOKEN=<32_СИМВОЛЬНИЙ_ТОКЕН>
ADMIN_ALLOWED_EMAILS=<email1@example.com,email2@example.com>

# ─── JWT ─────────────────────────────────────────────────────────────────
# Генерується командою: openssl rand -hex 32
JWT_SECRET=<32_СИМВОЛЬНИЙ_РЯДОК>

# ─── Google OAuth (для входу в адмінку) ──────────────────────────────────
GOOGLE_CLIENT_ID=<CLIENT_ID_З_GOOGLE_CLOUD>
GOOGLE_CLIENT_SECRET=<CLIENT_SECRET_З_GOOGLE_CLOUD>
OAUTH_REDIRECT_URL=https://<ВАШ_ДОМЕН_RAILWAY>/admin-<ADMIN_PATH_HASH>/auth/callback

# FRONTEND_URL — адреса сторінки адмінки на Vercel (куди повертається після логіну)
FRONTEND_URL=https://<ВАШ_ДОМЕН_VERCEL>/admin-<ADMIN_PATH_HASH>

# ─── Upstash Redis (опціонально, для кешування) ──────────────────────────
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

### Крок 5 — Згенеруй публічний домен

1. Перейди у вкладку **Settings** → секція **Networking**.
2. Натисни **"Generate Domain"**.
3. Скопіюй отриманий домен (вигляд: `your-app.up.railway.app`) — він знадобиться для Vercel і Google Cloud.

---

## 4. Розгортання фронтенду (Vercel)

### Крок 1 — Підключи репозиторій

1. Зайди на [vercel.com](https://vercel.com) → **"Add New Project"** → імпортуй репозиторій `website_ao`.
2. Vercel автоматично визначить, що це Astro-проект.

### Крок 2 — Встав усі змінні середовища

В налаштуваннях проекту на Vercel: **Settings → Environment Variables**.  
Додай наступні змінні (одну за одною або через "Raw Editor"):

| Назва змінної | Значення | Опис |
|---|---|---|
| `PUBLIC_API_URL` | `https://<ВАШ_ДОМЕН_RAILWAY>` | Адреса твого бекенду на Railway |
| `PUBLIC_ADMIN_PATH` | `<ADMIN_PATH_HASH>` | Хеш-частина секретної URL адмінки |

> ⚠️ **Чому `PUBLIC_`?** Ці змінні Astro вбудовує прямо в JavaScript-код браузера при збірці. Це абсолютно нормально і задумано — саме так фронтенд знає, куди відправляти запити.

### Крок 3 — Зроби деплой

Натисни **"Deploy"** (або якщо вже задеплоїв — **Deployments → три крапки → Redeploy**).  
Дочекайся зеленого статусу **"Ready"**.

---

## 5. Налаштування Google OAuth

Після того, як ти отримав реальні домени Railway та Vercel, поверніться у **Google Cloud Console → Credentials → твій OAuth Client** і додай реальні адреси (якщо ще не додав на кроці 2.3):

**Authorized JavaScript origins** — додай:
```
https://<ВАШ_ДОМЕН_RAILWAY>
https://<ВАШ_ДОМЕН_VERCEL>
```

**Authorized redirect URIs** — додай:
```
https://<ВАШ_ДОМЕН_RAILWAY>/admin-<ADMIN_PATH_HASH>/auth/callback
```

Натисни **Save** і зачекай до 5 хвилин (Google Cloud застосовує зміни з затримкою).

---

## 6. Перевірка роботи

### Перевірка бекенду
Відкрий в браузері:
```
https://<ВАШ_ДОМЕН_RAILWAY>/health
```
Відповідь має бути:
```json
{"status":"ok","checks":{"sqlite":"ok","qdrant":"ok","redis":"ok"}}
```

### Перевірка чат-бота
Зайди на сайт Vercel і відправ будь-яке повідомлення в чат-бот.

### Перевірка адмінки
Зайди за адресою:
```
https://<ВАШ_ДОМЕН_VERCEL>/admin-<ADMIN_PATH_HASH>
```
Натисни **"Увійти з Google"** і увійди з акаунта, email якого є в `ADMIN_ALLOWED_EMAILS`.

---

## 7. Локальний запуск для розробки

### Бекенд
```bash
cd apps/backend
cp .env.example .env
# Заповни .env своїми ключами
go run ./cmd/api
```
Бекенд запуститься на `http://localhost:8080`.

### Фронтенд
```bash
# У корені репозиторію
npm install
npm run dev
```
Сайт відкриється на `http://localhost:4321`.

> **Порада:** Для локальної роботи в `.env` бекенду вкажи:
> ```
> ALLOWED_ORIGINS=http://localhost:4321
> OAUTH_REDIRECT_URL=http://localhost:8080/admin-{ХЕШ}/auth/callback
> FRONTEND_URL=http://localhost:4321/admin-{ХЕШ}
> ```

---

## Часті помилки

| Помилка | Причина | Рішення |
|---|---|---|
| `404` на `/admin-panel/...` | Vercel не перезібрався після додавання `PUBLIC_ADMIN_PATH` | Зроби Redeploy на Vercel і онови сторінку через `Ctrl+Shift+R` |
| `CORS policy` помилка | `ALLOWED_ORIGINS` на Railway містить `*` або не містить домен Vercel | Встав точну адресу Vercel у `ALLOWED_ORIGINS` на Railway |
| `OAuth недоступний` в адмінці | Домен Railway не доданий у Google Cloud Console | Додай домен у "Authorized JavaScript origins" і "Authorized redirect URIs" |
| Бекенд онлайн, але не відповідає | `QDRANT_URL` або `OPENROUTER_API_KEY` неправильні | Перевір змінні на Railway і зроби Redeploy |
| Дані зникають після деплою | Не підключено Volume (диск) | Додай Volume з Mount Path `/app/data` на Railway |
