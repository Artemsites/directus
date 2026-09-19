# 1. Локальная установка (macOS + SQLite)

Требования: Node.js (v18+).

Открой терминал и выполни:

```bash
mkdir directus && cd directus
npx directus init
```

**Ответы в мастере установки:**
1. Choose database client: `SQLite`
2. Database file path: `data.db`
3. Email/Password: *укажи данные для входа админа*

**Запуск:**
```bash
npx directus start
```
*Интерфейс доступен по адресу: `http://localhost:8055`*

---

# 2. Развертывание на Shared Web Hosting (MySQL)

Требования: доступ по SSH, поддержка Node.js (cPanel/Plesk), MySQL.

**Шаги в панели управления хостингом (cPanel/ISPManager):**
1. Создай базу данных MySQL и пользователя.
2. В разделе "Setup Node.js App" создай приложение (версия Node.js 18+). Запомни путь к папке.

**Шаги в терминале (SSH):**
```bash
# Перейди в папку приложения (например, app)
cd /path/to/your/node/app

# Инициализация
npx directus init
```

**Ответы в мастере установки:**
1. Choose database client: `MySQL`
2. Host / Port: `127.0.0.1` / `3306` (или данные хостинга)
3. Database Name / User / Password: *введи данные из шага 1*
4. Email/Password: *данные для входа админа*

**Настройка запуска (для cPanel/Passenger):**
1. В настройках Node.js приложения на хостинге укажи **Startup File** (Application startup file): 
   `node_modules/directus/cli.js start`
2. Нажми **Restart** в панели управления.
*Приложение доступно по домену, привязанному к Node.js.*

---

# 3. Настройка Scrum, Kanban и Календаря (в UI Directus)

После входа в админку (Settings -> Data Model), создай структуру:

### Коллекция 1: Sprints
1. Нажми **Create Collection**, назови `Sprints`.
2. Создай поля (Create Field):
   - `name` (Type: String / Input)
   - `start_date` (Type: Datetime)
   - `end_date` (Type: Datetime)
   - `status` (Type: String / Dropdown: *Active, Planning, Done*)

### Коллекция 2: Tasks
1. Создай коллекцию `Tasks`.
2. Создай поля:
   - `title` (Type: String / Input)
   - `status` (Type: String / Dropdown: *To Do, In Progress, Review, Done*)
   - `story_points` (Type: Integer / Input)
   - `sprint` (Type: Relational / Many-to-One -> Связать с коллекцией `Sprints`)
   - `assignee` (Type: Relational / Many-to-One -> Связать с системной коллекцией `Directus Users`)

### Включение Kanban и Календаря
1. Перейди в модуль **Content** (иконка папки слева), открой коллекцию `Tasks`.
2. В правом меню (Sidebar) в разделе **Layout** нажми переключатель и выбери **Kanban**.
   - В настройках Kanban выбери "Group By: `status`".
3. Чтобы включить календарь, добавь еще один Layout — **Calendar**.
   - В настройках выбери Date Field: `date_created` (или добавь кастомное поле дедлайна).