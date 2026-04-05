# 🚀 DeliveryApp — Платформа доставки еды

> Fullstack-приложение для управления доставкой еды с реалтайм-трекингом, картами, чатом поддержки и системой рейтингов.

---

## 📋 О проекте

**DeliveryApp** — многоролевая платформа доставки еды, покрывающая полный цикл: от оформления заказа покупателем до доставки курьером, с инструментами для владельцев ресторанов и панелью администратора.

Четыре роли в одном приложении, каждая со своим интерфейсом и логикой:

| Роль | Описание |
|------|----------|
| 👤 **Покупатель** | Каталог ресторанов, корзина, отслеживание заказа в реальном времени, оценка курьера |
| 🍽️ **Владелец ресторана** | Управление меню, торговыми точками, зонами доставки, заказами |
| 🚴 **Курьер** | Смены, принятие заказов, навигация, личный рейтинг |
| 🛡️ **Администратор** | Аналитика, управление организациями и курьерами, чат поддержки |

---

## ✨ Ключевые возможности

### 🗺️ Интерактивные карты
- **MapLibre GL** + тайлы CartoDB Voyager
- Поиск адресов через **Photon / Komoot**
- Построение **реальных маршрутов по дорогам** через OSRM
- Отображение расстояния и времени в пути
- Визуализация зон доставки (круговые полигоны)
- Карта зоны смены курьера

### 📦 Полный цикл заказа
- 8 статусов: `CREATED → ACCEPTED → COOKING → READY → PICKED_UP → DELIVERING → DELIVERED`
- Реалтайм-обновления статуса через **WebSocket (Socket.IO)**
- Покупатель видит карту с маршрутом курьера на каждом этапе
- Прогресс-бар с процентом выполнения
- Отмена заказа покупателем на ранних стадиях

### ⭐ Система рейтингов
- После доставки покупатель ставит **звёзды курьеру (1–5)**
- Интерактивный пикер со звёздами и hover-эффектами
- Рейтинг = среднее арифметическое оценок (показывается от 3+ оценок)
- Курьер видит свой рейтинг, место в таблице лидеров и статистику
- Администратор видит рейтинг каждого курьера с медалями (#1 🥇 #2 🥈 #3 🥉)

### 💬 Чат поддержки
- Плавающая кнопка чата у всех пользователей (покупатель / курьер / владелец)
- Реалтайм через WebSocket — сообщения приходят мгновенно
- У администратора — полноценный **мессенджер** со списком всех обращений
- Каждый чат показывает роль пользователя (Клиент / Курьер / Ресторан), имя, телефон
- Бейдж с количеством непрочитанных на вкладке навигации

### 📧 Верификация Email
- При регистрации отправляется **6-значный код** на почту
- Отправка через **Resend API** (100 писем/день бесплатно)
- OTP-интерфейс: 6 отдельных ячеек, автофокус, поддержка вставки
- Кнопка «Отправить снова» с кулдауном 60 секунд
- Существующие пользователи при входе без верификации получают код автоматически

### 🏪 Инструменты владельца ресторана
- Создание и управление категориями меню и блюдами
- Загрузка фото блюд через **Cloudinary**
- Включение/выключение позиций в реалтайм (оптимистичный UI)
- Торговые точки с настройкой радиуса доставки на карте
- Визуализация зоны доставки с полигоном

### 📊 Аналитика (Администратор)
- График заказов за 30 дней (Area Chart)
- График выручки за 30 дней
- Топ-5 ресторанов по количеству заказов (Bar Chart)
- Топ-5 курьеров по доставкам
- Общая статистика: пользователи, организации, заказы, курьеры

### 📍 Геолокация покупателя
- Кнопка «Рядом со мной» — сортировка ресторанов по расстоянию
- Расчёт расстояния по формуле Haversine
- Оценка времени доставки

---

## 🛠️ Технический стек

### Backend
| Технология | Назначение |
|-----------|------------|
| **Node.js + Express** | HTTP-сервер, REST API |
| **TypeScript** | Типизация |
| **Prisma ORM** | Работа с БД, миграции |
| **PostgreSQL** | Основная база данных |
| **Socket.IO** | WebSocket для реалтайма |
| **JWT** | Аутентификация |
| **bcryptjs** | Хеширование паролей |
| **Cloudinary** | Хранение изображений |
| **Resend API** | Отправка email |
| **Zod** | Валидация данных |

### Frontend
| Технология | Назначение |
|-----------|------------|
| **Next.js 14** | React-фреймворк, App Router |
| **TypeScript** | Типизация |
| **Tailwind CSS** | Стилизация |
| **Zustand** | Стейт-менеджмент |
| **MapLibre GL** | Интерактивные карты |
| **react-map-gl** | React-обёртка для MapLibre |
| **Recharts** | Графики аналитики |
| **Socket.IO Client** | WebSocket |
| **Lucide React** | Иконки |

### Инфраструктура
| Сервис | Назначение |
|--------|------------|
| **pnpm Workspaces** | Монорепо |
| **Turborepo** | Оркестрация сборки |
| **Render.com** | Деплой API + Web + PostgreSQL |
| **CartoDB Voyager** | Тайлы карт |
| **OSRM** | Построение маршрутов |
| **Photon (Komoot)** | Геокодирование адресов |

### Структура монорепо
```
apps/
├── api/          # Express + Prisma backend
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/       # Регистрация, логин, верификация email
│   │   │   ├── order/      # Создание, статусы, оценка заказов
│   │   │   ├── org/        # Рестораны, меню, торговые точки
│   │   │   ├── courier/    # Смены, заказы, статистика курьера
│   │   │   ├── admin/      # Управление, аналитика
│   │   │   └── support/    # Чат поддержки
│   │   └── shared/
│   │       ├── socket.ts   # Socket.IO события
│   │       ├── mailer.ts   # Отправка email
│   │       └── prisma.ts   # Prisma клиент
│   └── prisma/
│       ├── schema.prisma
│       └── migrations/
└── web/          # Next.js 14 frontend
    └── src/
        ├── app/
        │   ├── (auth)/     # Логин, регистрация, верификация
        │   ├── customer/   # Каталог, корзина, заказы
        │   ├── owner/      # Дашборд, меню, точки, заказы
        │   ├── courier/    # Дашборд, заказы, история
        │   └── admin/      # Организации, курьеры, аналитика, поддержка
        ├── components/
        │   ├── maps/       # MapPicker, MapZoneView, OrderTrackingMap
        │   ├── support/    # SupportChatWidget
        │   ├── ui/         # RatingStars, StarPicker, ImageUpload
        │   └── layout/     # TopNav, BottomNav, AdminNav, OwnerNav
        └── lib/
            ├── store/      # Zustand stores (auth, orders, org, shift)
            ├── api.ts      # HTTP-клиент
            └── socket.ts   # Socket.IO хелперы
```

---

## 🗄️ Схема базы данных

```
User ──────────────── Organization
 │                         │
 │                    TradePoint
 │                         │
 └── Order ────────────────┘
      │
      ├── OrderItem ── MenuItem ── MenuCategory
      │
      └── CourierShift

User ── SupportMessage
```

**Модели:** `User`, `Organization`, `TradePoint`, `MenuCategory`, `MenuItem`, `Order`, `OrderItem`, `CourierShift`, `SupportMessage`

**Статусы заказа:** `CREATED → ACCEPTED → COOKING → READY → PICKED_UP → DELIVERING → DELIVERED / CANCELLED`

---

## 🎨 Дизайн

- **Тема:** Неоновый киберпанк (тёмная) / Чистый светлый
- **Акцентный цвет:** Cyan `#00D1FF` / `#00E0FF`
- **Шрифт:** Space Grotesk
- **Эффекты:** Neon glow на hover, неоновые индикаторы активных вкладок
- **Анимации:** Плавные переходы, scale-in, slide-up
- **Адаптивность:** Полная поддержка мобайла (Bottom Navigation) и десктопа

---

## 🚀 Запуск локально

### Требования
- Node.js 18+
- pnpm 9+
- PostgreSQL (или Docker)

### Установка

```bash
# Клонировать репозиторий
git clone <repo-url>
cd delivery-app

# Установить зависимости
pnpm install
```

### Переменные окружения

**`apps/api/.env`:**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/delivery_db"
JWT_SECRET="your-secret-min-32-chars"
PORT=4000
FRONTEND_URL="http://localhost:3000"
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
RESEND_API_KEY=re_xxxxxxxxxxxx
MAIL_FROM="Доставка <noreply@resend.dev>"
```

**`apps/web/.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=http://localhost:4000
```

### Запуск

```bash
# Применить миграции БД
cd apps/api && npx prisma migrate deploy

# Создать администратора
node -e "
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
bcrypt.hash('your-password', 10).then(hash =>
  prisma.user.create({ data: { email: 'admin@example.com', passwordHash: hash, name: 'Admin', role: 'ADMIN', emailVerified: true } })
).then(() => prisma.\$disconnect());
"

# Запустить всё
cd ../.. && pnpm dev
```

Приложение доступно на `http://localhost:3000`

---

## ☁️ Деплой на Render.com

### 1. PostgreSQL
Render → **New → PostgreSQL** → скопировать Internal Database URL

### 2. API (Web Service)
| Поле | Значение |
|------|----------|
| Root Directory | `apps/api` |
| Build Command | `npm install -g pnpm && pnpm install --frozen-lockfile && pnpm prisma migrate deploy && pnpm build` |
| Start Command | `node dist/app.js` |

**Environment Variables:** `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `CLOUDINARY_*`, `RESEND_API_KEY`, `MAIL_FROM`, `NODE_ENV=production`

### 3. Web (Web Service)
| Поле | Значение |
|------|----------|
| Root Directory | `apps/web` |
| Build Command | `npm install -g pnpm && pnpm install --frozen-lockfile && pnpm build` |
| Start Command | `pnpm start` |

**Environment Variables:** `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`

---

## 🔌 API Endpoints

### Auth
```
POST /api/auth/register       # Регистрация
POST /api/auth/login          # Вход
POST /api/auth/verify-email   # Подтверждение email кодом
POST /api/auth/resend-code    # Повторная отправка кода
GET  /api/auth/me             # Текущий пользователь
```

### Orders
```
POST   /api/orders            # Создать заказ
GET    /api/orders/my         # Мои заказы (покупатель)
GET    /api/orders/org        # Заказы ресторана
PATCH  /api/orders/:id/status # Обновить статус
POST   /api/orders/:id/rate   # Оценить курьера (1-5)
```

### Courier
```
POST /api/courier/shift/start         # Начать смену
POST /api/courier/shift/end           # Завершить смену
GET  /api/courier/orders/available    # Доступные заказы
GET  /api/courier/orders/active       # Активные заказы
GET  /api/courier/orders/history      # История
GET  /api/courier/stats               # Статистика и рейтинг
```

### Support
```
GET  /api/support/messages              # Мои сообщения (пользователь)
POST /api/support/messages              # Написать в поддержку
GET  /api/support/admin/chats           # Все чаты (админ)
GET  /api/support/admin/chats/:userId   # Чат с пользователем (админ)
POST /api/support/admin/chats/:userId   # Ответить пользователю (админ)
```

---

## ⚡ WebSocket события

| Событие | Направление | Описание |
|---------|------------|----------|
| `order:updated` | Сервер → Клиент | Изменился статус заказа |
| `order:new` | Сервер → Курьер | Новый заказ в зоне |
| `support:message` | Сервер → Клиент | Новое сообщение в чате |
| `support:notify` | Сервер → Админ | Уведомление о новом обращении |

---
