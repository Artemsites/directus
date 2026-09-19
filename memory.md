# memory.md

* **Node 24 (системный дефолт, `nvm`) не собирает `isolated-vm`** (зависимость Directus 12.3.1) — C++20 `concept`/`requires` не парсится под заголовки V8 Node 24. Причина: `isolated-vm@5.0.3` не рассчитан на ABI Node 24. Проверено сборкой в `/private/tmp/.../scratchpad`. Использовать Node 22 (`.nvmrc`).
* **`npx directus init` — интерактивный мастер**, просит admin email/пароль в TTY — не годится для агента (секреты в стдин/логах). Вместо него: `.env` (`DB_CLIENT`, `DB_FILENAME`, `KEY`, `SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`) + `npx directus bootstrap` — официальный non-interactive путь, читает те же переменные (`utils/create-admin.js` пакета `@directus/api@39.1.0`).
* **Репозиторий уже подключён к хостингу**: remotes `beget` (`artemkm9@artemkm9.beget.tech:git_craft/directus`, shared hosting — цель README.md раздела 2), `github` (`artemsites/directus`), `gitverse`. Текущая ветка `master`, трекает `beget/master` (не `main`) — учитывай при `git push`/PR.
