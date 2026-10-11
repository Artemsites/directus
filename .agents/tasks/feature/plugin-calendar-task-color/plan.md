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

- [x] Шаг 4: Расширение подключено в Directus и проверено в интерфейсе
  - model: lite, effort: medium
  - diag: Скомпилированное расширение в extensions → перезапуск Directus и проверка загрузки плагина
  - more:
    - 4.1 Перезапущен контейнер Directus для подхвата расширения из смонтированной папки extensions
    - 4.2 Проверены логи контейнера на успешную загрузку расширения calendar-colored без ошибок
    - 4.3 Зафиксированы изменения в Git репозитория _directus (схема и исходники extension)
  - git_hash: 03ee647

- [x] Шаг 5: Миграция поля color → Color по правилам именования
  - model: mid, effort: medium
  - diag: Требование именования кастомных полей с большой буквы → переименование color в Color в Tasks
  - more:
    - 5.1 Поле переименовано в схеме Directus на Color с сохранением существующих данных
    - 5.2 Обновлен компонент layout.vue и срез schema.yaml
  - tests:
    - curl -s --noproxy '*' http://127.0.0.1:8055/items/Tasks/89?fields=id,Color
    - grep -q "Color" database/schema.yaml
  - git_hash: e9ccf0b

- [x] Шаг 6: Оформление Issue & PR предложения для Directus
  - model: lite, effort: low
  - diag: Запрос на выгрузку предложения для maintainers Directus → оформление PR.md
  - more:
    - 6.1 Оформлен текст Feature Request Issue с проблемой и решением
    - 6.2 Оформлен текст Pull Request с описанием изменений и чеклистом
  - tests:
    - test -f .agents/tasks/feature/plugin-calendar-task-color/PR.md
  - git_hash: 12a5cca

- [x] Шаг 7: Устранение замечаний Security и Ponytail Review
  - model: mid, effort: high
  - diag: Замечания ревью (limit: -1, date in-place mutation, 3-char hex contrast, timezone drift) → исправление в layout.vue и package.json
  - more:
    - 7.1 Добавлен лимит выборки 500 записей
    - 7.2 Исправлен расчет диапазона недели без in-place мутации Date
    - 7.3 Добавлена фиксация 1-го числа при смене месяца
    - 7.4 Поддержаны 3-значные hex-цвета (#RGB) в расчете контрастности
    - 7.5 Парсинг дат переведен на локальный часовой пояс
    - 7.6 Исправлена версия typescript в package.json
  - tests:
    - npm --prefix extensions/calendar-colored run build
    - docker compose restart directus
  - git_hash: d26d1b0

- [ ] Шаг 8: Итоговая верификация и приёмка работы субагентом
  - model: lite, effort: medium
  - agent: qa-verifier
  - diag: Все шаги реализованы → сквозная проверка контейнера, API, сборки и git-состояния
  - more:
    - 8.1 Проверка статуса контейнера Directus и логов загрузки расширения
    - 8.2 Проверка REST API коллекции Tasks на чтение поля Color
    - 8.3 Проверка чистоты git-статуса и истории ветки feature/plugin-calendar-task-color
  - tests:
    - docker compose logs directus --tail 20 | grep -i "calendar-colored"
    - curl -s --noproxy '*' http://127.0.0.1:8055/items/Tasks/89
  - git_commit: pending

