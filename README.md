https://directus.com/docs/getting-started/create-a-project#docker-compose

create `docker-compose.yml` with:
```
environment:
   KEY
   SECRET
   ADMIN_EMAIL
   ADMIN_PASSWORD
```

docker-compose up -d

## Снимки схемы и SQLite-бэкап (Data Layer Protection)

• Перед изменением структуры:
  # 1. Текстовый снимок схемы в Git (для диффа и отката)
  docker compose exec directus npx directus schema snapshot -y /directus/database/schema.yaml
  # 2. Мгновенная копия бинарника SQLite
  cp database/data.db database/data.db.bak

• Как откатить, если агент наломал дров:
  • Структуру: 
    docker compose exec directus npx directus schema apply -y /directus/database/schema.yaml или git restore.
  • Данные целиком: восстановить data.db из .bak.