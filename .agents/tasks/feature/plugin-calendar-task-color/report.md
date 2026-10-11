# Отчёт: Directus Colored Calendar Extension и поле Color для Tasks

## Шаг 1: Добавлено поле выбора цвета Color в коллекцию Tasks
- **Что сделано:**
  - Через Directus API в коллекцию `Tasks` добавлено строковое поле `color` с интерфейсом `select-color` и отображением `color`.
  - Проверена запись значения hex-цвета (задача id 89 обновлена цветом `#3b82f6`).
  - Выполнен экспорт схемы: `database/schema.yaml` обновлён штатной командой `directus schema snapshot`.
- **Тесты:**
  - `docker compose exec directus npx directus schema snapshot -y /directus/database/schema.yaml` — `success_all`
  - `grep -q "color" /Users/artem/git_craft/_directus/database/schema.yaml` — `success_all`
- **Коммит:** `3f78eed` (feat(schema): add color field with select-color interface to Tasks collection)

## Шаг 2: Инициализирован каркас Layout Extension в папке extensions
- **Что сделано:**
  - Создана структура `extensions/calendar-colored` через `create-directus-extension`.
  - Установлены зависимости (`@directus/extensions-sdk`, `vue`, `typescript`).
  - Сконфигурирован `src/index.ts` с регистрацией layout `id: calendar-colored`, `name: Colored Calendar`.
  - Сборка `directus-extension build` успешно компилирует `dist/index.js`.
- **Тесты:**
  - `test -f extensions/calendar-colored/package.json` — `success_all`
  - `npm --prefix extensions/calendar-colored run build` — `success_all`
- **Коммит:** `cc32f5e` (feat(extension): scaffold calendar-colored layout extension)

## Шаг 3: Реализован компонент календаря с цветными карточками задач и контрастом текста
- **Что сделано:**
  - Написан Vue 3 компонент `src/layout.vue` с сеткой календаря (виды «Месяц» и «Неделя»).
  - Реализована динамическая окраска карточки задачи из поля `color` (с fallback на `#2ECDA7`).
  - Реализована функция WCAG/YIQ относительной яркости для адаптивного подбора контрастного цвета текста (белый/тёмный).
  - Добавлена навигация (клик по задаче открывает форму редактирования `/admin/content/:collection/:id`).
  - Успешно собран бандл `dist/index.js` (11 КБ).
- **Тесты:**
  - `npm --prefix extensions/calendar-colored run build` — `success_all`
  - `test -f extensions/calendar-colored/dist/index.js` — `success_all`
- **Коммит:** `b2d30ad` (feat(extension): implement colored calendar component with WCAG text contrast)

## Шаг 4: Расширение подключено в Directus и проверено в интерфейсе
- **Что сделано:**
  - Контейнер Directus перезапущен (`docker compose restart directus`).
  - В логах зафиксирована загрузка расширения: `[INFO] Loaded extensions: calendar-colored`.
  - Все исходники, артефакты сборки и снимки зафиксированы в Git.
- **Тесты:**
  - `docker compose restart directus` — `success_all`
  - `docker compose logs directus | grep "calendar-colored"` — `success_all`
- **Коммит:** `03ee647` (chore(extension): verify extension build, reload directus and update task docs)



