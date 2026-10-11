# План: Directus Colored Calendar Extension и поле Color для Tasks

## Сессии
- Шаг 1: mid/medium
- Шаг 2: mid/medium
- Шаг 3: mid/high
- Шаг 4: lite/medium

- [x] Шаг 1: Добавлено поле выбора цвета Color в коллекцию Tasks
  - model: mid, effort: medium
  - diag: В Tasks отсутствуют данные цвета → добавление поля color в схему Tasks через Directus API/схему
  - more:
    - 1.1 В коллекции Tasks создано строковое поле color с интерфейсом select-color (палитра + свободный выбор hex)
    - 1.2 Создан обновлённый снимок схемы database/schema.yaml через штатную команду directus schema snapshot
    - 1.3 Поле проверено на доступность для чтения и записи
  - tests:
    - docker compose -f /Users/artem/git_craft/_directus/docker-compose.yml exec directus npx directus schema snapshot -y /directus/database/schema.yaml
    - grep -q "color" /Users/artem/git_craft/_directus/database/schema.yaml
  - git_hash: 3f78eed

- [x] Шаг 2: Инициализирован каркас Layout Extension в папке extensions
  - model: mid, effort: medium
  - diag: Папка extensions пуста → создание структуры пакета layout extension
  - more:
    - 2.1 В extensions/calendar-colored создан package.json с типом расширения directus:extension (type: layout)
    - 2.2 Настроен сборочный скрипт на базе @directus/extensions-sdk
    - 2.3 Создана точка входа src/index.ts с регистрацией раскладки контракт: defineLayout
  - tests:
    - test -f /Users/artem/git_craft/_directus/extensions/calendar-colored/package.json
    - npm --prefix /Users/artem/git_craft/_directus/extensions/calendar-colored run build
  - git_hash: cc32f5e

- [x] Шаг 3: Реализован компонент календаря с цветными карточками задач и контрастом текста
  - model: mid, effort: high
  - diag: Базовый календарь не красит события → реализация отрисовки карточек с динамическим цветом и расчетом контраста
  - more:
    - 3.1 Реализован Vue-компонент сетки календаря (месяц/неделя) с получением полей Start, End, Title, color
    - 3.2 Добавлена функция расчета WCAG-контрастности текста (белый на темном фоне, черный на светлом)
    - 3.3 Добавлен fallback: при отсутствии цвета у задачи используется брендовый цвет #2ECDA7
    - 3.4 Реализован клик по карточке для перехода к редактированию задачи
  - tests:
    - npm --prefix /Users/artem/git_craft/_directus/extensions/calendar-colored run build
    - test -f /Users/artem/git_craft/_directus/extensions/calendar-colored/dist/index.js
  - git_hash: b2d30ad

- [ ] Шаг 4: Расширение подключено в Directus и проверено в интерфейсе
  - model: lite, effort: medium
  - diag: Скомпилированное расширение в extensions → перезапуск Directus и проверка загрузки плагина
  - more:
    - 4.1 Перезапущен контейнер Directus для подхвата расширения из смонтированной папки extensions
    - 4.2 Проверены логи контейнера на успешную загрузку расширения calendar-colored без ошибок
    - 4.3 Зафиксированы изменения в Git репозитория _directus (схема и исходники extension)
  - tests:
    - docker compose -f /Users/artem/git_craft/_directus/docker-compose.yml restart directus
    - docker compose -f /Users/artem/git_craft/_directus/docker-compose.yml logs directus --tail 50 | grep -i "calendar-colored"
  - git_commit: pending
