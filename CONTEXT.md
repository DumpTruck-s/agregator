User (id, email, passwordHash, role: OWNER|COURIER|CUSTOMER|ADMIN, name, phone, createdAt)

Organization (id, ownerId → User, name, description, logo, isActive, isVerified)

TradePoint (id, orgId → Organization, address, lat, lng, deliveryRadiusKm)

MenuCategory (id, orgId → Organization, name, sortOrder)

MenuItem (id, categoryId → MenuCategory, name, description, price, image, isAvailable)

Order (id, customerId → User, orgId → Organization, tradePointId → TradePoint,
       courierId → User?, status: CREATED|ACCEPTED|COOKING|READY|PICKED_UP|DELIVERING|DELIVERED|CANCELLED,
       deliveryAddress, deliveryLat, deliveryLng, totalPrice, createdAt, updatedAt)

OrderItem (id, orderId → Order, menuItemId → MenuItem, quantity, price)

CourierShift (id, courierId → User, startedAt, endedAt?, isActive, deliveryZoneLat, deliveryZoneLng, deliveryRadiusKm)

---

## Ключевые решения для скорости

Одно приложение Next.js с middleware: middleware проверяет JWT и роль, редиректит. Не надо три деплоя.

Prisma вместо raw SQL: миграции, типобезопасность, быстрый старт. PostGIS не нужен — считайте расстояние по формуле Хаверсина в JS или простым WHERE lat BETWEEN ... AND lng BETWEEN ....

shadcn/ui: готовые компоненты (таблицы, формы, модалки, тосты) — не тратишь время на базовый UI.

Zod-схемы в shared-пакете: одна валидация на фронте и бэке.

Socket.IO комнаты: order:{id} — покупатель и курьер подписаны на свой заказ, courier:available:{zone} — новые заказы для курьеров в зоне.

---

## CI/CD (Vercel + Railway)

- Vercel: подключаешь репо, root directory = apps/web, автодеплой на push в main
- Railway: Dockerfile для apps/api, Postgres как сервис, переменные окружения через дашборд
- GitHub: main — продакшн, dev — работа, PR-ы для мержа, branch protection на main

---

## Что пропустить, если не хватает времени (приоритеты)

1. Отслеживание курьера на карте — просто статусы
2. Кабинет модератора — делать последним
3. Загрузка картинок — emoji или placeholder
4. Конструктор отчётов — не трогать
5. SignalR/Kafka — Socket.IO хватит

Сначала рабочий MVP всех трёх частей, потом красота и допы.

Хочешь, я сразу сгенерирую стартовый проект — Prisma-схему, структуру папок, базовый API-роутинг?


Сейчас покажу архитектуру в двух диаграммах: сначала общая система (бэк + фронт + инфра), затем детальная структура API.Теперь детальная структура API — как организованы модули внутри бэкенда:## Пояснения к архитектуре

**Почему модульный монолит, а не микросервисы:** за 48 часов разводить отдельные сервисы с межсервисной коммуникацией — самоубийство. Один процесс Express/Fastify, но внутри чёткое разделение на модули. Каждый модуль — это папка со своим `router`, `service`, `schema` (zod). Модули общаются только через сервисный слой, не лезут в роутеры друг друга.

**Структура папок бэка:**

```
apps/api/src/
  app.ts              ← точка входа, плагины, middleware
  modules/
    auth/
      auth.router.ts   ← маршруты /api/auth/*
      auth.service.ts  ← бизнес-логика
      auth.schema.ts   ← zod-схемы валидации
    org/
      org.router.ts
      org.service.ts
      menu.service.ts
      org.schema.ts
    order/
      order.router.ts
      order.service.ts
      order.state.ts   ← стейт-машина статусов
      order.schema.ts
    courier/
      courier.router.ts
      courier.service.ts
      shift.service.ts
      courier.schema.ts
  shared/
    prisma.ts          ← единый PrismaClient
    socket.ts          ← инстанс Socket.IO + хелперы emit
    geo.ts             ← расчёт расстояний (Haversine)
    errors.ts          ← кастомные ошибки + handler
    middleware/
      auth.guard.ts
      role.guard.ts
      validate.ts
  prisma/
    schema.prisma
    migrations/
```

**Структура папок фронта:**

```
apps/web/src/
  app/
    (auth)/login/page.tsx
    (auth)/register/page.tsx
    owner/
      dashboard/page.tsx
      menu/page.tsx
      orders/page.tsx
    courier/
      dashboard/page.tsx
      orders/page.tsx
      history/page.tsx
    customer/
      catalog/page.tsx
      org/[id]/page.tsx
      cart/page.tsx
      orders/page.tsx
    admin/
      orgs/page.tsx
      couriers/page.tsx
  components/
    ui/              ← shadcn компоненты
    layout/          ← Header, Sidebar, MobileNav
    maps/            ← MapView, ZoneSelector
    orders/          ← OrderCard, StatusBadge, OrderTimeline
  lib/
    api.ts           ← fetch-обёртка с JWT
    socket.ts        ← Socket.IO клиент
    store/           ← Zustand-сторы (auth, cart, orders)
  shared/            ← симлинк или импорт из packages/shared
```

**Ключевой момент — стейт-машина заказа (`order.state.ts`):** это самая критичная часть бэка. Статусы идут строго по цепочке: `CREATED → ACCEPTED → COOKING → READY → PICKED_UP → DELIVERING → DELIVERED`, с возможностью `CANCELLED` из первых трёх состояний. Каждый переход проверяет роль (покупатель может отменить, курьер может принять, владелец подтверждает готовность) и эмитит WebSocket-событие.

Хочешь, чтобы я сгенерировал стартовый код — Prisma-схему, базовую конфигурацию проекта или конкретный модуль?