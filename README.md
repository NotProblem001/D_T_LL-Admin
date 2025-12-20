# D_T_LL-Admin
Donde Te Llevo - Panel Administrativo
Este es el centro de comando para la gerencia y administración logística. Permite gestionar empresas, cargar nóminas de pasajeros vía Excel y visualizar el estado de la flota en tiempo real.

⚡ Características Principales
Gestión de Rutas: Creación y edición de rutas usando mapas interactivos.

Importador Excel: Procesamiento de archivos .xlsx para nóminas de trabajadores.

Monitoreo: Vista en tiempo real de conductores activos.

Auditoría: Historial de viajes y valoraciones.

🛠️ Stack Tecnológico
Core: React + Vite (TypeScript)

Estado Server-Side: TanStack Query (React Query)

Mapas: React Leaflet / MapLibre GL

Estilos: Tailwind CSS + ShadcnUI (Componentes de UI)

Manejo de Excel: SheetJS (xlsx)

🔧 Configuración Local
Variables de Entorno: Crea un archivo .env.local en la raíz:env VITE_API_URL=http://localhost:8080/api/v1 VITE_MAP_STYLE_KEY=tu_clave_de_mapas


Ejecutar:

```Bash

npm install
npm run dev
🔐 Seguridad
El acceso a este panel está restringido por Roles (Admin/Gerencia). Requiere un Token JWT válido obtenido del Backend.
```

---

### 3. Repositorio: `D_T_LL Backend`
**Enfoque:** Lógica de Negocio, API REST, Algoritmos y Base de Datos.

*   **Descripción para GitHub:** API REST y núcleo lógico del sistema. Implementado en Spring Boot (Java 21). Maneja seguridad, optimización de rutas (Jsprit/OSRM) y persistencia de datos en PostgreSQL.

*   **Contenido del archivo `README.md`:**

# Donde Te Llevo - Backend API

El cerebro de la plataforma "Donde Te Llevo". Este monolito modular gestiona la lógica de negocio, la seguridad de los datos y los algoritmos de optimización de rutas.

## 🏗️ Arquitectura

- **Framework:** Spring Boot 3.2+ (Java 21)
- **Base de Datos:** PostgreSQL con extensión PostGIS (Geospatial).
- **Seguridad:** Spring Security + JWT (JSON Web Tokens).
- **Optimización de Rutas:**
    - **Jsprit:** Motor de solución VRP (Vehicle Routing Problem).
    - **OSRM:** Motor de enrutamiento y matrices de distancia (Dockerizado).

## 🚀 Requisitos Previos

- Java JDK 21
- Docker & Docker Compose
- PostgreSQL 16

## ⚙️ Ejecución con Docker (Recomendado)

Para levantar la infraestructura completa (Base de datos + OSRM + Backend):

1.  **Configurar variables:**
    Crea un archivo `.env` basado en `.env.example`.

2.  **Levantar servicios:**
    ```bash
    docker-compose up -d --build
    ```

## 🛣️ Motor de Mapas (OSRM)

Este proyecto utiliza una instancia local de OSRM para evitar costos de APIs externas.
- Los datos del mapa de Chile (`chile-latest.osm.pbf`) deben colocarse en la carpeta `/docker/osrm-data` antes de iniciar.

## 🛡️ Seguridad de Datos

- **PII (Información Personal):** Los datos sensibles (RUT, Teléfono) se cifran en reposo usando AES-256.
- **Auth:** Todo endpoint requiere cabecera `Authorization: Bearer <token>`.
