# CashTrackr Backend

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Sequelize-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white" alt="Sequelize" />
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT" />
  <img src="https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white" alt="Jest" />
  <img src="https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white" alt="pnpm" />
</p>

API REST para gestión de presupuestos y gastos personales. Construida con **Express 5**, **TypeScript** y **PostgreSQL** vía **Sequelize**.

## Stack

- **Runtime:** Node.js + TypeScript 6
- **Framework:** Express 5
- **Base de datos:** PostgreSQL 16
- **ORM:** Sequelize con `sequelize-typescript`
- **Autenticación:** JWT + bcrypt
- **Validación:** express-validator
- **Email:** Nodemailer
- **Rate limiting:** express-rate-limit

## Requisitos

- Node.js >= 18
- pnpm >= 11
- PostgreSQL 16

## Instalación

```bash
pnpm install
```

## Variables de entorno

Copia el archivo de ejemplo y completa los valores:

```bash
cp .envExample .env
```

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión a PostgreSQL |
| `JWT_SECRET` | Secreto para firmar tokens JWT |
| `NODEMAILER_HOST` | Servidor SMTP |
| `NODEMAILER_PORT` | Puerto SMTP |
| `NODEMAILER_USER` | Usuario SMTP |
| `NODEMAILER_PASS` | Contraseña SMTP |
| `FRONTEND_URL` | URL del frontend (para enlaces en emails) |
| `NODE_ENV` | `development`, `production` o `test` |

## Scripts

| Comando | Descripción |
|---|---|
| `pnpm dev` | Inicia servidor de desarrollo con hot-reload (puerto 4000) |
| `pnpm build` | Compila TypeScript a `dist/` |
| `pnpm start` | Ejecuta la compilación de producción |
| `pnpm test` | Ejecuta tests (limpia BD automáticamente) |
| `pnpm test:watch` | Tests en modo watch |
| `pnpm test:coverage` | Tests con reporte de cobertura |

## Endpoints

Todas las rutas están prefijadas con `/api`.

### Auth (`/api/auth`)

Límite: 5 peticiones por minuto.

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/auth/create-account` | No | Registrar usuario |
| POST | `/api/auth/confirm-account` | No | Confirmar cuenta con token de 6 dígitos |
| POST | `/api/auth/login` | No | Iniciar sesión (devuelve JWT) |
| POST | `/api/auth/forgot-password` | No | Solicitar reset de contraseña |
| POST | `/api/auth/validate-token` | No | Validar token de reset |
| POST | `/api/auth/reset-password/:token` | No | Restablecer contraseña |
| GET | `/api/auth/user` | Sí | Obtener perfil del usuario autenticado |
| PUT | `/api/auth/user` | Sí | Actualizar nombre y email |
| POST | `/api/auth/update-password` | Sí | Cambiar contraseña |
| POST | `/api/auth/check-password` | Sí | Verificar contraseña actual |

### Budgets (`/api/budgets`)

Todas requieren `Authorization: Bearer <token>`.

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/budgets` | Listar presupuestos del usuario |
| GET | `/api/budgets/:budgetId` | Obtener presupuesto con sus gastos |
| POST | `/api/budgets` | Crear presupuesto |
| PUT | `/api/budgets/:budgetId` | Actualizar presupuesto |
| DELETE | `/api/budgets/:budgetId` | Eliminar presupuesto |

### Expenses (`/api/budgets/:budgetId/expenses`)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/budgets/:budgetId/expenses` | Crear gasto |
| GET | `/api/budgets/:budgetId/expenses/:expenseId` | Obtener gasto |
| PUT | `/api/budgets/:budgetId/expenses/:expenseId` | Actualizar gasto |
| DELETE | `/api/budgets/:budgetId/expenses/:expenseId` | Eliminar gasto |

## Modelos

- **User** — id, name, email, password (hash), token (6 dígitos), confirmed
- **Budget** — id, name, amount, userId (FK)
- **Expense** — id, name, amount, budgetId (FK)

## Estructura del proyecto

```
src/
├── index.ts              # Punto de entrada
├── server.ts             # Configuración de Express
├── config/               # DB, Nodemailer, rate limiter
├── controllers/          # Lógica de rutas
├── emails/               # Plantillas de email
├── middleware/           # Auth, validación, ownership
├── models/               # Modelos de Sequelize
├── routes/               # Definición de rutas
├── utils/                # Helpers (JWT, bcrypt, tokens)
├── data/                 # Script de limpieza de BD
└── tests/                # Tests unitarios e integración
```

## CI/CD

GitHub Actions en push/PR a `main`:
1. **Test** — Levanta PostgreSQL, compila TypeScript y ejecuta tests.
2. **Deploy** — Dispara deploy automático en Render.
