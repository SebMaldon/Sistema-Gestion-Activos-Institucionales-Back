# Sistema de Gestión de Activos Institucionales — API GraphQL

Backend API GraphQL para el IMSS. Construida con **Node.js + TypeScript + Apollo Server 4 + TypeORM + SQL Server**.

## 🚀 Inicio Rápido

### Prerequisitos
- Node.js 18+
- SQL Server corriendo en Docker (`localhost:1433`)
- Base de datos `inventario` creada (ejecutar `MODELO_BD_NUEVO.sql`)

### Instalación

```bash
npm install
```

### Configuración
El archivo `.env` ya viene preconfigurado para el Docker local. Cámbialo si mueves el proyecto a otra máquina.

### Desarrollo
```bash
npm run dev
```

El servidor estará en: **http://localhost:4000/graphql**  
Apollo Sandbox (UI interactiva): se abre automáticamente en esa URL.

### Producción
```bash
npm run build
npm start
```

---

## 📋 Endpoints

| URL | Descripción |
|-----|-------------|
| `POST /graphql` | Endpoint principal GraphQL |
| `GET /graphql` | Apollo Sandbox (dev) |
| `GET /health` | Health check del servidor |

---

## 🔐 Autenticación

La API usa **JWT Bearer tokens**.

1. **Login:**
```graphql
mutation {
  login(matricula: "admin", password: "tu_password") {
    token
    expiresIn
    usuario { id_usuario nombre_completo }
  }
}
```

2. **Usar el token** en todas las demás requests:
```
Authorization: Bearer <token>
```

---

## 📦 Módulos GraphQL

### Catálogos
- `catInmuebles`, `marcas`, `tiposDispositivo`, `catModelos`
- `roles`, `catCategoriasActivo`, `catUnidadesMedida`

### Bienes (paginado)
```graphql
query {
  bienes(
    filter: { estatus_operativo: "ACTIVO", clave_inmueble: "INM-001" }
    pagination: { first: 20 }
  ) {
    edges { node { id_bien num_serie estatus_operativo } cursor }
    pageInfo { hasNextPage endCursor totalCount }
  }
}
```

### Dashboard
```graphql
query {
  dashboardStats {
    totalBienes bienesActivos incidenciasPendientes garantiasPorVencer
  }
}
```

---

## 🔑 Roles de Usuario

| Rol | ID | Permisos |
|-----|----|----------|
| Admin | 1 | Todo, incluyendo eliminar y gestionar usuarios |
| Supervisor | 2 | Crear/editar bienes, movimientos, gestionar incidencias |
| Usuario | 3 | Solo lectura + reportar incidencias |

---

## ⚡ Optimizaciones

- **DataLoaders**: Prevención del problema N+1 en todas las relaciones
- **Paginación cursor-based**: Eficiente para grandes volúmenes
- **Pool de conexiones**: Máximo 20 conexiones simultáneas a SQL Server
- **Rate limiting**: 100 requests/minuto por IP
- **Depth limiting**: Máximo 7 niveles de anidamiento
- **Retry de conexión**: 5 intentos automáticos al iniciar

---

## 📁 Estructura del Proyecto

```
src/
├── config/       # database.ts, environment.ts
├── entities/     # 13 entidades TypeORM
├── graphql/
│   ├── schema/   # TypeDefs GraphQL
│   ├── resolvers/# Resolvers por módulo
│   └── dataloaders/
├── middleware/   # JWT context, auth guards
└── utils/        # logger, errors, pagination
```
