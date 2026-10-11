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

## Рекомендация по версионированию БД:

Бинарный data.db в Git сохраняет данные, но в коммитах не даёт диффа изменений (не видно, какое поле или
коллекция добавились).
В Directus для этого есть штатный механизм снимков:

docker compose exec directus npx directus schema snapshot -y /directus/database/schema.yaml

Он создаёт человекочитаемый YAML с описанием всех коллекций, полей и связей для понятной истории в Git.