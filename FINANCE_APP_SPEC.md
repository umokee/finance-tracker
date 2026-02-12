# Finance Tracker — Полное техническое задание

## Обзор проекта

Минималистичное веб-приложение для персонального учёта финансов. Один пользователь, авторизация через API-ключ (как в Task Manager). Приложение позволяет вести полный учёт доходов и расходов, планировать бюджет, ставить финансовые цели и анализировать свои финансы через наглядный дашборд.

---

## Стек технологий

- **Backend:** Python 3.11+, FastAPI, SQLAlchemy (async), SQLite (aiosqlite), Pydantic v2
- **Frontend:** React 18 (Vite), JSX (не TypeScript), React Router v6, Recharts (графики), Axios
- **Стилизация:** Один глобальный CSS файл (`App.css`) с CSS-переменными, никаких UI-библиотек, никаких CSS-модулей
- **Сборка:** Vite для фронта, Uvicorn для бэка
- **Структура:** монорепо — `/backend` и `/frontend` в корне. Фронтенд — feature-based архитектура как в Task Manager

---

## Дизайн-система

### Принципы

Терминальная / хакерская эстетика. Всё выглядит как интерфейс командной строки, но в браузере:

- Тёмная тема — единственная, без переключателя
- **border-radius: 0 !important** на ВСЁ — глобальное правило, без исключений
- Моноширинный шрифт везде
- Uppercase + letter-spacing на заголовках, лейблах, кнопках, навигации
- Зелёный акцент (#00ff88) — единственный яркий цвет. Используется для: активных элементов, заголовков виджетов, акцентных цифр, primary-кнопок
- Обозначения в квадратных скобках: `[DASHBOARD]`, `[+ NEW]`, `[ACTIVE]`
- Виджеты с характерным хедером (тёмный фон + зелёный заголовок uppercase)

### Цветовая палитра (CSS-переменные — копировать из Task Manager)

```css
:root {
  --bg-primary: #0a0a0a;       /* основной фон страницы */
  --bg-secondary: #141414;     /* фон виджетов, карточек */
  --bg-tertiary: #1e1e1e;      /* фон хедеров виджетов, инпутов, вложенных элементов */
  --text-primary: #e0e0e0;     /* основной текст */
  --text-secondary: #888888;   /* второстепенный текст, лейблы */
  --accent: #00ff88;           /* акцент — зелёный */
  --accent-dim: #00aa55;       /* приглушённый акцент (hover на primary) */
  --border: #2a2a2a;           /* границы */
  --danger: #ff4444;           /* расход / удаление / ошибки */
  --warning: #ffaa00;          /* предупреждения */
  --success: #00ff88;          /* доход / позитив (= accent) */
}
```

### Типографика

```css
font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Roboto Mono', monospace;
line-height: 1.5;
```

Размеры и стили текста (из Task Manager):
- 0.7rem — мелкие лейблы (widget-count, status-label, form-label). Всегда `text-transform: uppercase; letter-spacing: 1-2px; font-weight: 600`
- 0.75rem — мета-информация (task-meta). `text-transform: uppercase; letter-spacing: 0.5px`
- 0.8rem — кнопки, навигация, основной UI-текст. `font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px`
- 0.875rem — обычный текст в контенте
- 0.9-0.95rem — заголовки элементов списка (task-title)
- 1-1.25rem — крупные заголовки секций (widget-title, app-title). `font-weight: 700; letter-spacing: 2-3px; color: var(--accent)`
- 2-4rem — крупные акцентные цифры (общий баланс). `font-weight: 700; color: var(--accent); letter-spacing: 2-3px`

### Глобальные правила CSS

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* ОБЯЗАТЕЛЬНО — острые углы на всё */
* {
  border-radius: 0 !important;
}
```

### Компоненты (точное соответствие Task Manager)

**Command Bar (верхняя навигация):**
- Горизонтальная полоска вверху, `position: sticky; top: 0; z-index: 1000`
- Фон `var(--bg-secondary)`, нижняя граница `2px solid var(--border)`
- Слева: название приложения (`FINANCE_TRACKER`, зелёный, bold, letter-spacing: 2px), отделённое `border-right`
- Далее: табы навигации — кнопки с uppercase текстом, разделены `border-right: 1px solid var(--border)`
- Активный таб: `background: var(--bg-primary); color: var(--accent); border-bottom: 2px solid var(--accent)`
- Справа: статус-бар (баланс, доход за месяц и т.д.) — `font-size: 0.7rem` лейбл + `font-size: 1rem; font-weight: 700; color: var(--accent)` значение

**Виджеты (основной контейнер контента):**
```css
.widget {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  margin-bottom: 1.5rem;
}
.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border);
}
.widget-title {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--accent);  /* Зелёный заголовок! */
}
.widget-body {
  padding: 1.5rem;
}
```

**Кнопки:**
```css
.btn {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  color: var(--text-primary);
  padding: 0.75rem 1.5rem;
  font-family: inherit; /* моноширинный */
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  cursor: pointer;
  transition: all 0.15s;
}
.btn:hover:not(:disabled) {
  background: var(--bg-primary);
  border-color: var(--accent);
  color: var(--accent);
}
.btn-primary {
  background: var(--accent);      /* зелёный фон */
  color: var(--bg-primary);       /* тёмный текст */
  border-color: var(--accent);
}
.btn-danger {
  background: transparent;
  border-color: var(--danger);
  color: var(--danger);
}
.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.7rem;
}
```

**Формы / Инпуты:**
```css
.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-secondary);
  font-weight: 600;
}
.form-input, .form-select, .form-textarea {
  width: 100%;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  color: var(--text-primary);
  padding: 0.75rem;
  font-family: inherit;
  font-size: 0.9rem;
  transition: all 0.15s;
}
.form-input:focus {
  outline: none;
  border-color: var(--accent);
  background: var(--bg-primary);
}
```

**Список элементов (транзакций, целей и т.д.):**
```css
.task-item {  /* переиспользуем этот класс для transaction-item */
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-left-width: 3px;
  padding: 1rem;
  transition: all 0.15s;
}
.task-item:hover {
  border-left-color: var(--accent);
  background: var(--bg-primary);
}
.task-meta {
  display: flex;
  gap: 1.5rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
```

**Модалки:**
```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: var(--bg-secondary);
  border: 2px solid var(--border);
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}
.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border);
  /* h3 внутри: color: var(--accent); text-transform: uppercase; letter-spacing: 0.05em */
}
```

**Сообщения об ошибках:**
```css
.error-message {
  background: rgba(255, 68, 68, 0.1);
  border: 1px solid var(--danger);
  border-left-width: 4px;
  color: var(--danger);
  padding: 1rem;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
}
```

**Info Box:**
```css
.info-box {
  background: rgba(0, 255, 136, 0.05);
  border: 1px solid var(--accent-dim);
  border-left-width: 3px;
  padding: 0.75rem 1rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
}
```

**Пустое состояние:**
```css
.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
  letter-spacing: 1px;
}
```

**Grid виджетов:**
```css
.widget-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 1.5rem;
}
```

**Action Bar (панель действий над контентом):**
```css
.action-bar {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
}
```

---

## Структура базы данных (SQLite через SQLAlchemy)

### Таблица `categories`
```
id: INTEGER PRIMARY KEY AUTOINCREMENT
name: TEXT NOT NULL
type: TEXT NOT NULL CHECK(type IN ('income', 'expense'))
icon: TEXT (unicode символ — опционально)
is_archived: BOOLEAN DEFAULT FALSE
sort_order: INTEGER DEFAULT 0
created_at: DATETIME DEFAULT CURRENT_TIMESTAMP
```

### Таблица `transactions`
```
id: INTEGER PRIMARY KEY AUTOINCREMENT
type: TEXT NOT NULL CHECK(type IN ('income', 'expense'))
amount: REAL NOT NULL CHECK(amount > 0)
category_id: INTEGER REFERENCES categories(id)
description: TEXT
date: DATE NOT NULL
created_at: DATETIME DEFAULT CURRENT_TIMESTAMP
updated_at: DATETIME DEFAULT CURRENT_TIMESTAMP
```

### Таблица `goals`
```
id: INTEGER PRIMARY KEY AUTOINCREMENT
name: TEXT NOT NULL
target_amount: REAL NOT NULL CHECK(target_amount > 0)
current_amount: REAL DEFAULT 0 CHECK(current_amount >= 0)
deadline: DATE (может быть NULL — бессрочная цель)
is_completed: BOOLEAN DEFAULT FALSE
created_at: DATETIME DEFAULT CURRENT_TIMESTAMP
updated_at: DATETIME DEFAULT CURRENT_TIMESTAMP
```

### Таблица `goal_contributions`
```
id: INTEGER PRIMARY KEY AUTOINCREMENT
goal_id: INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE
amount: REAL NOT NULL CHECK(amount != 0)
note: TEXT
date: DATE NOT NULL
created_at: DATETIME DEFAULT CURRENT_TIMESTAMP
```

### Таблица `budgets`
```
id: INTEGER PRIMARY KEY AUTOINCREMENT
category_id: INTEGER NOT NULL REFERENCES categories(id)
amount: REAL NOT NULL CHECK(amount > 0)
period: TEXT NOT NULL CHECK(period IN ('monthly', 'weekly'))
created_at: DATETIME DEFAULT CURRENT_TIMESTAMP
```

### Таблица `recurring_transactions`
```
id: INTEGER PRIMARY KEY AUTOINCREMENT
type: TEXT NOT NULL CHECK(type IN ('income', 'expense'))
amount: REAL NOT NULL CHECK(amount > 0)
category_id: INTEGER REFERENCES categories(id)
description: TEXT
frequency: TEXT NOT NULL CHECK(frequency IN ('daily', 'weekly', 'monthly', 'yearly'))
next_date: DATE NOT NULL
is_active: BOOLEAN DEFAULT TRUE
created_at: DATETIME DEFAULT CURRENT_TIMESTAMP
```

**Предзаполнение при первом запуске:**
- Расходы: Еда, Транспорт, Жильё, Развлечения, Здоровье, Одежда, Подписки, Образование, Прочее
- Доходы: Зарплата, Фриланс, Инвестиции, Подарки, Прочее

---

## API Endpoints (FastAPI)

Авторизация: заголовок `X-API-Key` (как в Task Manager). API-ключ задаётся в конфиге бэкенда.

### Транзакции
```
GET    /api/transactions?page=1&limit=50&type=expense&category_id=1&date_from=2025-01-01&date_to=2025-01-31&search=кофе
POST   /api/transactions
PUT    /api/transactions/{id}
DELETE /api/transactions/{id}
GET    /api/transactions/summary?period=month&date=2025-01
```

### Категории
```
GET    /api/categories?type=expense
POST   /api/categories
PUT    /api/categories/{id}
DELETE /api/categories/{id}             — мягкое удаление (is_archived = true)
```

### Цели
```
GET    /api/goals?status=active         — active/completed/all
POST   /api/goals
PUT    /api/goals/{id}
DELETE /api/goals/{id}
POST   /api/goals/{id}/contribute       — внести / снять (amount может быть < 0)
GET    /api/goals/{id}/history          — история взносов
```

### Бюджеты
```
GET    /api/budgets                     — список с текущим % использования
POST   /api/budgets
DELETE /api/budgets/{id}
```

### Повторяющиеся транзакции
```
GET    /api/recurring
POST   /api/recurring
PUT    /api/recurring/{id}
DELETE /api/recurring/{id}
POST   /api/recurring/process           — обработать просроченные
```

### Аналитика
```
GET    /api/analytics/overview?period=month&date=2025-01
  → { total_income, total_expense, balance, savings_rate, transaction_count }

GET    /api/analytics/by-category?type=expense&period=month&date=2025-01
  → [{ category_id, category_name, total, percentage, transaction_count }]

GET    /api/analytics/trend?months=6
  → [{ month: "2025-01", income, expense, balance }]

GET    /api/analytics/daily-spending?month=2025-01
  → [{ date: "2025-01-15", amount: 1500 }]
```

### Настройки
```
GET    /api/settings
PUT    /api/settings
```

---

## Страницы и интерфейс

### Навигация — Command Bar (горизонтальная, sticky top)

Точно как в Task Manager — горизонтальная полоса сверху:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ FINANCE_TRACKER │ [₽] DASHBOARD │ [↕] TRANSACTIONS │ [▤] BUDGETS │ ...    │ BAL ₽45,200 │ INC ₽120K │
└─────────────────────────────────────────────────────────────────────────────┘
```

Табы навигации:
1. `[₽] DASHBOARD`
2. `[↕] TRANS` (Transactions)
3. `[▤] BUDGETS`
4. `[◎] GOALS`
5. `[◩] ANALYTICS`
6. `[~] CONFIG` (Настройки)

Статус-бар справа показывает:
- `BAL` — баланс текущего месяца (зелёный если +, красный если −)
- `INC` — доход текущего месяца
- `EXP` — расход текущего месяца

---

### 1. Dashboard (`/`)

**Верхний Action Bar:**
```
┌─────────────────────────────────────────────────────────────────────┐
│ [ + NEW_TRANSACTION ]                    ← Январь 2025 →          │
└─────────────────────────────────────────────────────────────────────┘
```

**Акцентный виджет (как current-task-widget) — Баланс месяца:**
```
┌─────────────────────────────────────────────────────────────────────┐
│ [BALANCE]                                          JANUARY 2025    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                          ₽ 45,200                                   │  ← 4rem, accent, bold
│                                                                     │
│  INCOME: ₽120,000    EXPENSE: ₽74,800    SAVINGS: 37.7%           │  ← мета, uppercase
│  ↑ 12% vs prev month                                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```
- Этот виджет имеет `border: 2px solid var(--accent); border-left-width: 5px` — как `current-task-widget`
- Хедер с зелёным фоном: `background: rgba(0, 255, 136, 0.05)`

**Widget Grid (два виджета в ряд):**

Левый — `[EXPENSES_BY_CATEGORY]`:
- Горизонтальный bar chart (Recharts)
- Бары: `var(--text-secondary)`, hover → `var(--accent)`
- Справа от бара — сумма
- Максимум 7 категорий + "OTHER"

Правый — `[TREND_6M]`:
- Line chart: линия дохода — `var(--accent)`, расхода — `var(--text-secondary)`
- Без заливки, чистые линии
- Tooltip при hover — фон `var(--bg-secondary)`, border `var(--border)`

**Ещё два виджета:**

Левый (60%) — `[RECENT_TRANSACTIONS]`:
- Список последних 10 транзакций в формате task-list:
```
┌────────────────────────────────────────────────────────────────┐
│ Продукты в Ашане                                    −₽ 3,200  │
│ FOOD · 15 JAN · EXPENSE                                       │  ← task-meta стиль
├────────────────────────────────────────────────────────────────┤
│ Фриланс проект                                    +₽ 25,000  │
│ FREELANCE · 15 JAN · INCOME                                   │
└────────────────────────────────────────────────────────────────┘
```
- Суммы доходов: `color: var(--success)` (зелёный)
- Суммы расходов: `color: var(--danger)` (красный)
- Каждая строка — `.task-item` с `border-left-width: 3px`
- Hover: `border-left-color: var(--accent)`
- Внизу кнопка: `[ ALL TRANSACTIONS → ]`

Правый (40%) — `[GOALS_PROGRESS]`:
- Список целей с progress bar:
```
MacBook Pro
₽ 34,000 / ₽ 250,000 · 13.6%
████░░░░░░░░░░░░░░░░░░░░░░
```
- Progress bar: `height: 8px; background: var(--bg-primary); border: 1px solid var(--border)`. Заливка: `var(--accent)`
- Макс 4 цели + `[ ALL GOALS → ]`

---

### 2. Transactions (`/transactions`)

**Action Bar:**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [ + NEW_TRANSACTION ]  │ [ALL] [INCOME] [EXPENSE] │ [Category ▾] │ 🔍 search │  ← Янв 2025 → │
└──────────────────────────────────────────────────────────────────────────────┘
```

- Toggle `[ALL] [INCOME] [EXPENSE]` — кнопки в ряд, активная = accent
- Category dropdown = `.form-select` стиль
- Поиск = `.form-input`
- Переключатель месяцев — кнопки `←` / `→`

**Виджет `[TRANSACTIONS]` с widget-count = количество:**

Список в формате task-list. Каждый item:
```
┌──────────────────────────────────────────────────────────────────────┐
│ ▌ Продукты в Ашане                                [E] [x]  −₽3,200 │
│   FOOD · 15 JAN 2025                                                │
└──────────────────────────────────────────────────────────────────────┘
```
- `border-left: 3px solid var(--border)` → при hover `var(--accent)`
- Для доходов border-left можно `var(--success)`, для расходов — `var(--danger)` 
- Кнопки `[E]` (edit) и `[x]` (delete) — `.btn-small`
- Внизу: `[INCOME: ₽120,000 · EXPENSE: ₽74,800 · BALANCE: ₽45,200 · ENTRIES: 87]`

**Пагинация** — кнопки `[ ← PREV ]` `[ NEXT → ]` + `PAGE 1/5`

**Модалка добавления/редактирования:**
- `.modal-overlay` + `.modal-content`
- Хедер: `[NEW_TRANSACTION]` или `[EDIT_TRANSACTION]` зелёным
- Тип: toggle `[INCOME]` / `[EXPENSE]` — две кнопки, активная = `.btn-primary`
- Сумма: `.form-input` type=number
- Категория: `.form-select` (фильтр по типу)
- Описание: `.form-input` (необязательно)
- Дата: `.form-input` type=date
- Кнопки: `[ SAVE ]` (primary) + `[ CANCEL ]`
- Checkbox: `[ ] Close after save` (как в Task Manager — `.checkbox-group`)

---

### 3. Budgets (`/budgets`)

**Action Bar:** `[ + NEW_BUDGET ]`

**Widget Grid (2-3 колонки):**

Каждый бюджет — отдельный `.widget`:
```
┌─────────────────────────────────────┐
│ [FOOD]                         62%  │  ← widget-header
├─────────────────────────────────────┤
│                                     │
│  ₽ 12,400 / ₽ 20,000              │  ← крупным шрифтом
│  ████████████░░░░░░  62%           │  ← progress bar
│                                     │
│  REMAINING: ₽ 7,600               │
│  ≈ ₽ 487 / DAY                    │  ← text-secondary, uppercase
│                                     │
└─────────────────────────────────────┘
```

Progress bar стиль (из goal-progress в Task Manager):
```css
.goal-progress {
  height: 8px;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  overflow: hidden;
}
.goal-progress-bar {
  height: 100%;
  background: var(--accent);
}
```
- > 90%: заливка `var(--warning)`
- > 100%: заливка `var(--danger)`

**Виджет `[UNBUDGETED_CATEGORIES]`** внизу — список категорий без бюджета с кнопкой `[ SET ]` у каждой.

---

### 4. Goals (`/goals`)

Полностью копируем паттерн из `PointsGoals` в Task Manager.

**Хедер (goals-header стиль):**
```
┌──────────────────────────────────────────────────────────────┐
│ GOALS                          [Show Achieved] [+ New Goal] │
└──────────────────────────────────────────────────────────────┘
```

**Форма создания** (goal-form стиль) — раскрывается под хедером:
- Название
- Целевая сумма
- Дедлайн (необязательно)
- Начальный взнос (необязательно)
- Кнопка `[ CREATE_GOAL ]` — full width primary

**Список целей** (goal-item стиль):
```
┌──────────────────────────────────────────────────────────────┐
│ ▌ ₽ 250,000                                      [x]       │
│   MacBook Pro                                               │
│                                                              │
│   ████████░░░░░░░░░░░░░░░░░  13.6%                         │
│   ₽ 34,000 / ₽ 250,000 · 214 DAYS LEFT                    │
│   NEED ≈ ₽ 1,009 / DAY                                     │
│                                                              │
│   [ CONTRIBUTE ]  [ HISTORY ]                               │
└──────────────────────────────────────────────────────────────┘
```

- `.goal-item` с `border-left-width: 3px`, hover → `border-left-color: var(--accent)`
- Достигнутые: `.goal-item.achieved` → `border-left-color: var(--accent); background: rgba(0, 255, 136, 0.03)`
- `.goal-badge` — зелёный бейдж `ACHIEVED!`
- Кнопка `[ CONTRIBUTE ]` — открывает мини-модалку (сумма + заметка)
- Кнопка `[ HISTORY ]` — раскрывает список взносов внутри карточки

---

### 5. Analytics (`/analytics`)

**Action Bar:** Переключатель `[MONTH] [QUARTER] [YEAR]` (toggle кнопки) + `← Январь 2025 →`

**Виджет `[OVERVIEW]`:**
- Три `stat-card` в ряд (grid 1fr 1fr 1fr):
```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   INCOME    │ │   EXPENSE   │ │   BALANCE   │
│  ₽ 120,000  │ │  ₽ 74,800   │ │  ₽ 45,200   │
│  ↑ 12%      │ │  ↓ 5%       │ │  ↑ 24%      │
└─────────────┘ └─────────────┘ └─────────────┘
```
- stat-card: `background: var(--bg-tertiary); border: 1px solid var(--border); padding: 1.5rem; text-align: center`
- stat-label: `0.7rem; uppercase; letter-spacing: 1.5px; color: var(--text-secondary)`
- stat-value: `2rem; font-weight: 700; color: var(--accent)`

**Виджет `[EXPENSES_BY_CATEGORY]`:**
- Donut chart (монохром — оттенки серого: #888, #666, #555, #444, #333...)
- Легенда справа: название + сумма + процент
- При клике на сегмент — раскрывается список транзакций под графиком

**Виджет `[INCOME_EXPENSE_TREND]`:**
- Area chart — доход (заливка rgba(0,255,136,0.1), линия `var(--accent)`) и расход (заливка rgba(255,68,68,0.1), линия `var(--danger)`)

**Виджет `[DAILY_SPENDING]`:**
- Bar chart: столбики `var(--text-secondary)`, hover → `var(--accent)`
- Горизонтальная пунктирная линия среднего значения
- Tooltip: сумма + топ-3 категории

**Виджет `[TOP_EXPENSES]`:**
- Таблица топ-10 — task-list формат

---

### 6. Settings (`/settings`)

Точная копия layout из `Settings.jsx` в Task Manager:

```
┌──────────────────────────────────────────────────────────────┐
│ SETTINGS                                                      │  ← settings-header
├──────────────────────────────────────────────────────────────┤
│ [Categories] [Recurring] [Currency] [Data]                   │  ← settings-tabs
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─ EXPENSE CATEGORIES ─────────────────────────────────┐   │  ← settings-section
│  │ Еда                                        [E] [↑↓]  │   │
│  │ Транспорт                                   [E] [↑↓]  │   │
│  │ ...                                                    │   │
│  │ [ + ADD_CATEGORY ]                                    │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─ INCOME CATEGORIES ──────────────────────────────────┐   │
│  │ ...                                                    │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ [ SAVE_SETTINGS ]                                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Таб "Categories":**
- Две settings-section: EXPENSE CATEGORIES и INCOME CATEGORIES
- Каждая категория — строка с названием + кнопки `[E]` (edit) и `[A]` (archive)
- Кнопка `[ + ADD_CATEGORY ]`

**Таб "Recurring":**
- Таблица повторяющихся платежей в task-list формате
- Каждый: описание, сумма, категория, частота, next_date, toggle вкл/выкл
- Кнопка `[ + NEW_RECURRING ]`

**Таб "Currency":**
- `.form-select` с выбором символа (₽, $, €, £, ₸)
- Сохраняется в settings

**Таб "Data":**
- `[ EXPORT_CSV ]` — скачивает все транзакции
- `[ IMPORT_CSV ]` — загрузка + preview + confirm
- `[ RESET_ALL ]` — `.btn-danger`, confirm-диалог

---

## Функциональные требования

### Быстрый ввод транзакции
- Кнопка `[ + NEW_TRANSACTION ]` на Dashboard и на странице Transactions
- Модалка с формой
- После сохранения: поля очищаются, модалка остаётся открытой (для серийного ввода)
- Checkbox `[ ] Close after save`

### Повторяющиеся транзакции
- При загрузке приложения фронтенд вызывает `POST /api/recurring/process`
- Бэкенд создаёт пропущенные транзакции, обновляет next_date

### Экспорт/Импорт
- Экспорт: CSV с колонками date, type, amount, category, description
- Импорт: загрузка CSV → preview первых 5 строк → маппинг колонок → confirm

### Клавиатурные сокращения
- `N` — быстрое добавление транзакции (открывает модалку)
- `Esc` — закрытие модалки
- `1-6` — навигация по табам command bar

---

## Архитектура фронтенда (feature-based, как в Task Manager)

```
frontend/
├── src/
│   ├── main.jsx                          # ReactDOM.createRoot
│   ├── App.css                           # ОДИН глобальный CSS файл (все стили тут)
│   ├── config.js                         # API_URL
│   ├── app/
│   │   ├── App.jsx                       # Основной компонент, роутинг, command bar
│   │   ├── AppProviders.jsx              # AuthProvider + SettingsProvider
│   │   └── index.js
│   ├── contexts/
│   │   ├── AuthContext.jsx               # API key auth (как в Task Manager)
│   │   ├── SettingsContext.jsx            # Валюта, настройки
│   │   └── index.js
│   ├── features/
│   │   ├── transactions/
│   │   │   ├── components/
│   │   │   │   ├── TransactionList.jsx
│   │   │   │   ├── TransactionItem.jsx
│   │   │   │   └── TransactionForm.jsx   # Модалка создания/редактирования
│   │   │   ├── hooks/
│   │   │   │   └── useTransactions.js
│   │   │   └── index.js
│   │   ├── budgets/
│   │   │   ├── components/
│   │   │   │   ├── BudgetList.jsx
│   │   │   │   └── BudgetCard.jsx
│   │   │   ├── hooks/
│   │   │   │   └── useBudgets.js
│   │   │   └── index.js
│   │   ├── goals/
│   │   │   ├── components/
│   │   │   │   ├── GoalsList.jsx
│   │   │   │   └── GoalItem.jsx
│   │   │   ├── hooks/
│   │   │   │   └── useGoals.js
│   │   │   └── index.js
│   │   ├── analytics/
│   │   │   ├── components/
│   │   │   │   ├── AnalyticsDashboard.jsx
│   │   │   │   ├── CategoryChart.jsx
│   │   │   │   ├── TrendChart.jsx
│   │   │   │   ├── DailySpendingChart.jsx
│   │   │   │   └── TopExpenses.jsx
│   │   │   ├── hooks/
│   │   │   │   └── useAnalytics.js
│   │   │   └── index.js
│   │   ├── dashboard/
│   │   │   ├── components/
│   │   │   │   └── Dashboard.jsx
│   │   │   └── index.js
│   │   ├── settings/
│   │   │   ├── components/
│   │   │   │   ├── Settings.jsx
│   │   │   │   ├── CategoryManager.jsx
│   │   │   │   └── RecurringManager.jsx
│   │   │   ├── hooks/
│   │   │   │   └── useCategories.js
│   │   │   └── index.js
│   │   └── recurring/
│   │       ├── hooks/
│   │       │   └── useRecurring.js
│   │       └── index.js
│   └── shared/
│       ├── api/
│       │   ├── client.js                 # Axios + interceptors + X-API-Key
│       │   ├── endpoints.js              # transactionApi, categoryApi, goalApi...
│       │   └── index.js
│       ├── hooks/
│       │   ├── useLocalStorage.js
│       │   ├── useApi.js
│       │   └── index.js
│       ├── utils/
│       │   ├── format.js                 # formatCurrency, formatDate
│       │   ├── errorHandler.js
│       │   └── index.js
│       ├── constants.js
│       └── index.js
├── index.html
├── package.json                          # react, react-dom, axios, recharts
└── vite.config.js                        # proxy /api → localhost:8000
```

---

## Backend структура

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                           # FastAPI app, CORS, lifespan, seed
│   ├── auth.py                           # X-API-Key dependency
│   ├── database.py                       # SQLAlchemy async engine, session, Base
│   ├── models.py                         # ORM models
│   ├── schemas.py                        # Pydantic v2 schemas
│   ├── seed.py                           # Default categories
│   └── routers/
│       ├── __init__.py
│       ├── transactions.py
│       ├── categories.py
│       ├── goals.py
│       ├── budgets.py
│       ├── recurring.py
│       ├── analytics.py
│       └── settings.py
├── data/                                 # SQLite DB file (finance.db)
├── requirements.txt
└── run.py
```

---

## Запуск

```bash
# Backend
cd backend
pip install -r requirements.txt
python run.py
# → http://localhost:8000

# Frontend
cd frontend
npm install
npm run dev
# → http://localhost:5173 (proxy /api → 8000)
```

### requirements.txt
```
fastapi
uvicorn[standard]
sqlalchemy[asyncio]
aiosqlite
pydantic>=2.0
```

### package.json dependencies
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "axios": "^1.6.5",
    "recharts": "^2.12.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.11"
  }
}
```

---

## Важные детали реализации

1. **Auth:** Заголовок `X-API-Key` — точно как в Task Manager. При 401 — dispatch event `auth:unauthorized`, AuthContext сбрасывает состояние
2. **Login Screen:** Точная копия из Task Manager — `login-screen`, `login-box`, `login-header` с логотипом `FINANCE_TRACKER` зелёным + version `v1.0`
3. **CORS:** `allow_origins=["http://localhost:5173"]`
4. **Lifespan:** При старте — create_all + seed категорий если БД пуста
5. **CSS:** Один файл `App.css`. Копировать базовые стили из Task Manager + добавить специфичные для финансов
6. **Recharts графики:** Все монохромные. Цвета: `var(--accent)` для основных линий/баров, `var(--text-secondary)` для второстепенных. Tooltip: `background: var(--bg-secondary); border: 1px solid var(--border)`. Никаких градиентов
7. **Анимации:** Только `transition: all 0.15s` на hover — никаких других анимаций кроме loading pulse
8. **Responsive:** Копировать все медиа-запросы из Task Manager. Command bar складывается на мобильных, widget-grid → одна колонка
9. **Числа:** Форматировать через `Intl.NumberFormat` с символом валюты из настроек. Разделители тысяч (пробел для ₽, запятая для $)
10. **Пустые состояния:** Стиль `.empty-state` — по центру, text-secondary, uppercase
11. **Все заголовки виджетов** — в квадратных скобках и зелёные: `[TRANSACTIONS]`, `[GOALS]`, `[BUDGET: FOOD]`
12. **Axios client:** Точная копия структуры из Task Manager — interceptors, auth header, error handling, event dispatch
