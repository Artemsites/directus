# План: локальная установка Directus (SQLite, ./)

Scope: только `<todo>` из `spec.md` — установить Directus локально в текущей папке, SQLite. Коллекции Kanban/Scrum/Calendar, автоматизации, внешние API, MySQL/деплой — вне scope, отдельная задача.

- [ ] Шаг 1: Node 22 активен для проекта (Directus 12.3.1 требует Node >=22; на Node 24 нативная сборка `isolated-vm` падает — проверено)
  - model: mid, effort: medium
  - more:
    - 1.1 `nvm install 22` если нет; `.nvmrc` с `22` в корне проекта
      - no_comment
    - 1.2 `nvm use` внутри проекта даёт `node --version` == v22.x
      - no_comment
  - tests:
    - `cd /Users/artem/git_craft/_directus && nvm use && node --version` - grep `^v22`
  - no_commit

- [ ] Шаг 2: Directus 12.3.1 установлен как зависимость проекта, нативные модули (`isolated-vm`) собираются без ошибок под Node 22
  - model: mid, effort: high
  - more:
    - 2.1 `npm init -y` (если `package.json` нет), `npm install directus@12.3.1 --save-exact`
      - no_comment
    - 2.2 сборка прошла без ошибок node-gyp (см. Шаг 1 — известная причина падения)
      - no_comment
  - tests:
    - `npm ls directus` - success_all
    - `test -x node_modules/.bin/directus` - success_all
  - no_commit

- [ ] Шаг 3: `.env` с конфигом SQLite и секретами; секреты не в git и не в чате/памяти
  - model: mid, effort: medium
  - more:
    - 3.1 `npx directus security key:generate` / `secret:generate` → `KEY`/`SECRET` в `.env`
      - no_comment
    - 3.2 `ADMIN_EMAIL`/`ADMIN_PASSWORD` — случайные, только в `.env`; пароль не печатать в чат, `report.md`, `memory.md` — только факт «создан»
      - no_comment
    - 3.3 `DB_CLIENT=sqlite3`, `DB_FILENAME=./data.db`, `PORT=8055`
      - no_comment
    - 3.4 `.gitignore`: `.env`, `data.db`, `node_modules/`, `uploads/`, `extensions/`
      - no_comment
  - tests:
    - `test -f .env && grep -qE '^(KEY|SECRET|ADMIN_EMAIL|ADMIN_PASSWORD|DB_CLIENT|DB_FILENAME)=' .env` - success_all
    - `git check-ignore -q .env data.db node_modules` - success_all
  - no_commit

- [ ] Шаг 4: база инициализирована, admin-пользователь создан без интерактивного мастера
  - model: mid, effort: medium
  - more:
    - 4.1 контракт: `npx directus bootstrap`
      - no_comment
  - tests:
    - `test -f data.db` - success_all
    - `npx directus count directus_users` - ожидание >=1
  - no_commit

- [ ] Шаг 5: сервер поднимается локально и отвечает на health-check
  - model: mid, effort: medium
  - more:
    - 5.1 контракт: `npx directus start`
      - no_comment
    - 5.2 ручная проверка хозяином (вне тестов шага): `http://localhost:8055`, вход `ADMIN_EMAIL`/`ADMIN_PASSWORD` из `.env`
      - no_comment
  - tests:
    - `npx directus start & sleep 5 && curl -sf http://localhost:8055/server/health; kill %1` - success_all
  - no_commit
