# Агрегатор для службы доставки — Context Plan

## Суть проекта

Платформа-агрегатор: владельцы регистрируют организации и меню, покупатели заказывают, курьеры принимают и доставляют. Модератор (ADMIN) контролирует всё. Всё — единый веб-сайт с 4 ролями.

---

## Стек (не меняем)

- **Monorepo**: pnpm workspaces + Turborepo
- **Backend**: `apps/api` — Express + TypeScript + Prisma (PostgreSQL) + Socket.IO + JWT + bcrypt
- **Frontend**: `apps/web` — Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui + Zustand
- **Shared**: `packages/shared` — Zod схемы + TypeScript типы
- **Карты**: Leaflet + react-leaflet (OpenStreetMap, без API-ключа)
- **Хранилище изображений**: Cloudinary (бесплатный tier, загрузка с устройства)
- **Графики**: Recharts

---

## Инфраструктура (Render.com)

- **API**: https://delivery-api-dz8s.onrender.com
- **Web**: https://delivery-web-ub18.onrender.com
- **DB**: Render PostgreSQL `delivery-db`
- Deploy через `render.yaml` (native Node runtime, не Docker)

---

## База данных (Prisma, всё готово)

```
User            — id, email, passwordHash, role, name, phone, createdAt
Organization    — id, ownerId, name, description, logo, isActive, isVerified
TradePoint      — id, orgId, address, lat, lng, deliveryRadiusKm
MenuCategory    — id, orgId, name, sortOrder
MenuItem        — id, categoryId, name, description, price, image, isAvailable
Order           — id, customerId, orgId, tradePointId, courierId?, status, deliveryAddress, deliveryLat, deliveryLng, totalPrice, createdAt, updatedAt
OrderItem       — id, orderId, menuItemId, quantity, price
CourierShift    — id, courierId, startedAt, endedAt?, isActive, deliveryZoneLat, deliveryZoneLng, deliveryRadiusKm

Role:        OWNER | COURIER | CUSTOMER | ADMIN
OrderStatus: CREATED → ACCEPTED → COOKING → READY → PICKED_UP → DELIVERING → DELIVERED | CANCELLED
```

Стейт-машина заказа в `apps/api/src/modules/order/order.state.ts`.

---

## Что уже сделано

### Backend (все эндпоинты рабочие)

| Модуль | Эндпоинты |
|--------|-----------|
| **auth** | POST /register, POST /login, GET /me |
| **org** | GET / (публичный), GET /:id, GET /:id/menu, GET /my, POST /, POST /:id/trade-points, POST /:id/categories, POST /:id/items, PATCH /items/:id/toggle |
| **order** | POST / (создать), GET /my, GET /org, PATCH /:id/status |
| **courier** | POST /shift/start, POST /shift/end, GET /shift, GET /orders/active, GET /orders/available, GET /orders/history |
| **admin** | GET /orgs, PATCH /orgs/:id/verify, PATCH /orgs/:id/activate, PATCH /orgs/:id/deactivate, GET /couriers |

### Frontend (страницы с реальным UI)

**Auth**: `/login`, `/register` (выбор роли)

**OWNER**: dashboard (статистика + создание орг), menu (торговые точки + категории + позиции меню), orders (список с фильтрами + смена статуса ACCEPTED→COOKING→READY)

**COURIER**: dashboard (начало/конец смены + текущий заказ), orders (доступные заказы + принятие), history (история доставок + статистика)

**CUSTOMER**: catalog (каталог организаций + поиск), org/[id] (меню + корзина), cart (оформление заказа), orders (мои заказы + статус через WebSocket)

**ADMIN**: orgs (верификация/блокировка организаций), couriers (список курьеров)

---

## Что нужно реализовать (TODO)

### 1. Загрузка изображений (Cloudinary)

**Backend:**
- [ ] Установить `multer` + `cloudinary` SDK
- [ ] `POST /upload` — универсальный эндпоинт загрузки файла, возвращает URL
- [ ] Добавить middleware проверки роли (кто что может загружать)

**Frontend:**
- [ ] Компонент `ImageUpload` — кнопка выбора файла с устройства + превью
- [ ] Подключить в форму создания/редактирования организации (поле `logo`)
- [ ] Подключить в форму создания/редактирования позиций меню (поле `image`)

---

### 2. Карты (Leaflet + react-leaflet)

**Frontend (новые компоненты):**
- [ ] `MapPicker` — кликабельная карта для выбора точки, возвращает {lat, lng, address}
- [ ] `MapZoneView` — карта с окружностью (зона доставки торговой точки / смена курьера)
- [ ] `OrderTrackingMap` — карта с маркером торговой точки и адреса доставки

**Где использовать:**
- [ ] OWNER / menu — при создании торговой точки: карта вместо ввода координат вручную
- [ ] COURIER / dashboard — при старте смены: выбор зоны на карте + отображение активной зоны
- [ ] CUSTOMER / cart — выбор адреса доставки кликом на карте (+ геокодинг через Nominatim)
- [ ] CUSTOMER / orders — карта с маркерами точки отправки и доставки для активного заказа

---

### 3. Admin — расширение функционала

**Backend:**
- [ ] `PATCH /admin/couriers/:id/block` — заблокировать курьера (поле `isBlocked` в User или через isActive)
- [ ] `PATCH /admin/couriers/:id/unblock` — разблокировать
- [ ] `GET /admin/orders` — все заказы системы с фильтрами
- [ ] `GET /admin/analytics` — агрегированные данные:
  - Заказы по дням за 30 дней
  - Топ-5 организаций по количеству заказов
  - Топ-5 курьеров по доставкам
  - Общие счётчики (пользователи, орги, заказы)

**Frontend:**
- [ ] admin/couriers — кнопки "Заблокировать / Разблокировать"
- [ ] admin/orders — новая страница, таблица всех заказов
- [ ] admin/analytics — новая страница с графиками Recharts (линейный + столбчатый)

**БД:**
- [ ] Добавить поле `isBlocked Boolean @default(false)` в модель `User`
- [ ] Новая миграция Prisma

---

### 4. Редактирование данных (Owner)

Сейчас создание работает, но нет редактирования/удаления:

**Backend:**
- [ ] `PATCH /org/:id` — обновить название, описание, лого организации
- [ ] `PATCH /org/:id/trade-points/:tpId` — обновить торговую точку
- [ ] `DELETE /org/:id/trade-points/:tpId` — удалить торговую точку
- [ ] `PATCH /org/items/:itemId` — редактировать позицию меню (название, цена, описание, картинка)
- [ ] `DELETE /org/items/:itemId` — удалить позицию меню
- [ ] `DELETE /org/:id/categories/:catId` — удалить категорию

**Frontend:**
- [ ] owner/menu — кнопки редактирования и удаления для торговых точек, категорий, позиций меню

---

### 5. Курьер — отображение деталей до принятия

По ТЗ: до принятия заказа курьер видит только цену, расстояние до точки отправки и саму точку (без адреса доставки).

**Backend:**
- [ ] В `GET /courier/orders/available` — убедиться что `deliveryAddress` и `deliveryLat/Lng` не возвращаются, только `totalPrice`, `tradePoint.address`, расчётное расстояние (Haversine от зоны курьера до торговой точки)

**Frontend:**
- [ ] courier/orders — карточка доступного заказа: показывать цену, расстояние, точку отправки; скрывать адрес доставки до принятия

---

### 6. Отмена заказа (Customer)

- [ ] `PATCH /orders/:id/status` (status: CANCELLED) — уже есть эндпоинт, нужна кнопка "Отменить" на фронте (доступна в статусах CREATED, ACCEPTED, COOKING)

---

## Порядок реализации (приоритет)

1. **БД + backend**: поле `isBlocked`, миграция, эндпоинты редактирования/удаления для owner, блокировка курьеров, аналитика
2. **Cloudinary**: upload эндпоинт + компонент ImageUpload + интеграция в формы owner
3. **Карты**: установить react-leaflet, сделать MapPicker, встроить в cart, owner/menu, courier/dashboard
4. **Admin analytics**: страница с Recharts
5. **Мелкие доработки**: кнопка отмены заказа, скрытие адреса у курьера до принятия, карта в orders

---

## Архитектурные решения

- **Auth**: JWT в localStorage, отдаётся при login/register, заголовок `Authorization: Bearer ...`
- **WebSocket**: Socket.IO комнаты — `order:{id}` для покупателя, `courier:available:{zone}` для курьеров
- **Геозона**: Haversine в `apps/api/src/shared/geo.ts`, без PostGIS
- **Изоляция организаций**: каждый owner видит только свою org, middleware проверяет `orgId === user.orgId`
- **Картинки**: хранятся как URL в БД, физически на Cloudinary
- **Карты**: Leaflet + OpenStreetMap (бесплатно, без API-ключей), обратный геокодинг через Nominatim API
.