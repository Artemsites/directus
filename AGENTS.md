`./context/flows.xml` - как писать flows в directus 

# Правила работы с структурами данных
* Новые кастомные поля заводятся с большой буквы `Color` не `color`

## Чтобы обезопасить систему при работе с AI-агентом над базой и Flows, используется подход Defense in Depth
(эшелонированная защита) на 4 уровнях:
──────
### 1. PoLP (Principle of Least Privilege — принцип наименьших привилегий)

• Проблема: Токен администратора даёт агенту право случайно удалить таблицу, системные настройки или
пользователей.
• Решение: Создать в Directus отдельную роль (например, AI-Assistant) и выдать токен ей:
    • Разрешить CRUD только в прикладных коллекциях (Tasks и т.д.).
    • Запретить операцию delete (или включить Soft Delete).
    • Запретить доступ к системным коллекциям пользователей и ключей (directus_users, directus_roles).
• Цена отката: 0 (роль меняется в UI за пару кликов или токен отзывается).
──────
### 2. Снимки схемы и SQLite-бэкап (Data Layer Protection)

• Перед изменением структуры:
  # 1. Текстовый снимок схемы в Git (для диффа и отката)
  docker compose exec directus npx directus schema snapshot -y /directus/database/schema.yaml
  # 2. Мгновенная копия бинарника SQLite
  cp database/data.db database/data.db.bak

• Как откатить, если агент наломал дров:
  • Структуру: 
    docker compose exec directus npx directus schema apply -y /directus/database/schema.yaml или git restore.
  • Данные целиком: восстановить data.db из .bak.

──────
### 3. Human-in-the-Loop (Согласование перед мутациями)

• Dry-run / Draft first:
  • Новые Flows создаём в статусе inactive (выключены) или с ручным триггером (manual), тестируем изолированно через trigger-flow на фиктивных данных, и только потом переводим на боевые события (items.update).
  • Любые delete и масштабные мутации в базе агент сначала описывает в виде JSON-плана и ждёт твоего подтверждения.

──────
### 4. Git SSoT (Single Source of Truth)

• Все изменения фиксируются атомарными коммитами: сделали Flow или поле → git commit. Если что-то пошло не так — git diff сразу покажет, что именно изменилось.