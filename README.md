# Portal Digital del GAD Municipal de Antonio Ante

Plataforma web institucional del Gobierno Autónomo Descentralizado Municipal del Cantón Antonio Ante, provincia de Imbabura, Ecuador.

| | |
|---|---|
| **Stack** | Astro 6 + TypeScript 6 + Tailwind CSS 4 + Sanity.io |
| **Hosting** | Netlify (SSR + Edge Functions) |
| **Dominio** | antonio-ante.gob.ec |

---

## Tabla de contenidos

1. [Arquitectura del sistema](#arquitectura-del-sistema)
2. [Estructura de carpetas](#estructura-de-carpetas)
3. [Requisitos previos](#requisitos-previos)
4. [Instalación](#instalación)
5. [Comandos](#comandos)
6. [Variables de entorno](#variables-de-entorno)
7. [Flujo de CI/CD](#flujo-de-cicd)
8. [Performance Budget](#performance-budget)
9. [Seguridad](#seguridad)
10. [Guía de rotación de secretos](#guía-de-rotación-de-secretos)
11. [Manual de soberanía digital](#manual-de-soberanía-digital)

---

## Arquitectura del sistema

```
                        ┌─────────────────┐
                        │   Ciudadano /   │
                        │   Navegador     │
                        └────────┬────────┘
                                 │ HTTPS
                        ┌────────▼────────┐
                        │   Netlify CDN   │
                        │  (Edge + SSR)   │
                        └────────┬────────┘
                                 │
                   ┌─────────────┼─────────────┐
                   │             │             │
          ┌────────▼───┐  ┌─────▼─────┐  ┌───▼────────┐
          │   Astro    │  │ Middleware │  │  Security  │
          │   Pages    │  │  (noindex, │  │  Headers   │
          │   (SSR)    │  │  hardening)│  │  (netlify  │
          └────────┬───┘  └───────────┘  │   .toml)   │
                   │                      └────────────┘
          ┌────────▼────────┐
          │  Data Fetcher   │
          │  (Zod Schemas)  │
          │  Fail-Fast      │
          └────────┬────────┘
                   │ GROQ over HTTPS
          ┌────────▼────────┐
          │   Sanity.io     │
          │   Content Lake  │
          │   + CDN (imgs)  │
          └─────────────────┘
```

### Principios arquitectónicos

- **Feature-Sliced Design**: el código se organiza por dominio, no por tipo de archivo.
- **Schema-First**: Zod es la fuente única de verdad. Los tipos TypeScript se infieren con `z.infer`. No hay interfaces manuales duplicadas.
- **Fail-Fast**: si Sanity devuelve datos que no cumplen el schema Zod, el build falla. Nunca se sirven datos corruptos.
- **Zero-JS por defecto**: Astro envía 0 KB de JS al cliente a menos que un componente interactivo lo requiera (islands architecture).

### Capas del sistema

| Capa | Directorio | Responsabilidad |
|---|---|---|
| **UI pura** | `src/shared/ui/` | Componentes reutilizables sin lógica de negocio (Button, Card, Input, SanityImage) |
| **Validación** | `src/lib/validations/` | Schemas Zod para Noticia, Parroquia, DocumentoOficial, Contact |
| **Fetcher** | `src/lib/fetcher.ts` | Cliente genérico Sanity + validación; lanza `SchemaValidationError` |
| **Endpoints** | `src/api/endpoints/` | Funciones de datos tipadas (getNoticias, getParroquias, etc.) |
| **Páginas** | `src/pages/` | Rutas de Astro (SSR/SSG) |
| **API** | `src/pages/api/` | Endpoints REST (contact form) |
| **Middleware** | `src/middleware.ts` | Protección de indexación, eliminación de headers sensibles |
| **Módulos** | `src/modules/` | Lógica de dominio específica (noticias, parroquias) |

---

## Estructura de carpetas

```
antonio-ante/
├── public/                    # Assets estáticos (favicon, robots.txt)
├── scripts/
│   ├── validate-seo.ts        # Validación post-build de meta tags
│   └── validate-bundle-size.ts # Enforcement de performance budget
├── src/
│   ├── api/
│   │   ├── clients/
│   │   │   └── sanity.ts      # Cliente Sanity configurado
│   │   └── endpoints/
│   │       ├── noticias.ts    # Queries GROQ tipadas
│   │       ├── parroquias.ts
│   │       └── documentos.ts
│   ├── lib/
│   │   ├── fetcher.ts         # fetchSanity<T> genérico
│   │   └── validations/
│   │       ├── shared.ts      # SanityImage, Slug, PortableText
│   │       ├── noticia.ts
│   │       ├── parroquia.ts
│   │       ├── documento-oficial.ts
│   │       ├── contact.ts
│   │       └── index.ts       # Barrel export
│   ├── modules/
│   │   ├── news/
│   │   └── parishes/
│   ├── pages/
│   │   ├── api/
│   │   │   └── contact.ts     # POST /api/contact
│   │   └── index.astro
│   ├── shared/
│   │   ├── ui/
│   │   │   ├── Button.astro   # WCAG 2.1 AA
│   │   │   ├── Card.astro
│   │   │   ├── Input.astro
│   │   │   └── SanityImage.astro
│   │   ├── constants/
│   │   └── utils/
│   │       └── sanitize.ts    # XSS prevention
│   ├── styles/
│   │   └── global.css         # Tailwind v4 @theme + tipografía fluida
│   ├── middleware.ts
│   └── env.d.ts
├── astro.config.mjs
├── eslint.config.mjs          # ESLint 10 flat config
├── netlify.toml               # Security headers + cache policy
├── tailwind.config.mjs
├── tsconfig.json              # TypeScript 6 Strict + path aliases
└── package.json
```

---

## Requisitos previos

| Herramienta | Versión mínima |
|---|---|
| Node.js | 22.12.0 |
| npm | 10.x |
| Git | 2.x |

---

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/digital-antonio-ante/antonio-ante.git
cd antonio-ante

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con el PROJECT_ID de Sanity

# 4. Iniciar servidor de desarrollo
npm run dev
```

---

## Comandos

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor local en `localhost:4321` |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Preview del build local |
| `npm run lint` | Ejecuta ESLint sobre `src/` |
| `npm run lint:fix` | Corrige errores de lint automáticamente |
| `npm run typecheck` | Ejecuta `tsc --noEmit` |
| `npm run validate:seo` | Valida meta tags y títulos post-build |
| `npm run validate:bundle` | Verifica que el bundle no exceda el budget |
| `npm run validate` | SEO + Bundle validation combinados |
| `npm run ci` | Pipeline completo: typecheck + lint + build + validate |

---

## Variables de entorno

| Variable | Requerida | Pública | Descripción |
|---|---|---|---|
| `PUBLIC_SANITY_PROJECT_ID` | Si | Si | ID del proyecto en Sanity.io |
| `PUBLIC_SANITY_DATASET` | No | Si | Dataset de Sanity (default: `production`) |
| `SANITY_API_TOKEN` | No | No | Token para datasets privados o draft preview |
| `APP_ENV` | Si | No | `production` habilita indexación. Cualquier otro valor inyecta `noindex` |

Las variables `PUBLIC_*` se exponen al cliente. Las demás son solo servidor.

Configurar en Netlify: Site settings > Environment variables.

---

## Flujo de CI/CD

```
  Developer            GitHub              Netlify
     │                   │                   │
     │  git push         │                   │
     ├──────────────────►│                   │
     │                   │  webhook trigger  │
     │                   ├──────────────────►│
     │                   │                   │
     │                   │   ┌───────────────┤
     │                   │   │ 1. npm ci      │
     │                   │   │ 2. tsc --noEmit│
     │                   │   │ 3. eslint src  │
     │                   │   │ 4. astro build │
     │                   │   │ 5. validate:seo│
     │                   │   │ 6. validate:   │
     │                   │   │    bundle      │
     │                   │   └───────────────┤
     │                   │                   │
     │                   │   Deploy to CDN   │
     │                   │◄──────────────────┤
     │  Deploy preview   │                   │
     │◄──────────────────┤                   │
     │                   │                   │
```

### Configuración de Netlify build command

El `netlify.toml` ya incluye `command = "npm run build"`. Para activar validación completa en CI:

```toml
[build]
  command = "npm run ci"
```

### Ramas

| Rama | Propósito | Indexación |
|---|---|---|
| `main` | Producción (antonio-ante.gob.ec) | Activa (`APP_ENV=production`) |
| `staging` | Preview interno | Bloqueada (`noindex`) |
| `feature/*` | Desarrollo | Bloqueada (`noindex`) |

### Pre-commit hooks

Cada commit ejecuta automáticamente (vía Husky + lint-staged):
1. `eslint --fix` sobre archivos staged
2. `prettier --write` sobre archivos staged
3. `tsc --noEmit` sobre el proyecto completo

---

## Performance Budget

| Recurso | Presupuesto | Métrica |
|---|---|---|
| JS total (carga inicial) | 50 KB | gzip |
| CSS total (carga inicial) | 30 KB | gzip |
| HTML por página | 100 KB | raw |
| Tamaño total de `dist/` | 5 MB | raw |

### Checklist de Performance Budget

- [ ] **JS Bundle <= 50 KB gzip**: Astro envía 0 JS por defecto. Solo se incrementa con islands (`client:*`). Cada island debe justificarse.
- [ ] **Sin dependencias de runtime pesadas**: no incluir React/Vue/Svelte a menos que una feature específica lo exija. Preferir vanilla JS o Astro components.
- [ ] **Imágenes via Sanity CDN**: AVIF/WebP con srcset. Nunca servir originales sin comprimir.
- [ ] **Fonts subseteadas**: usar `font-display: swap` y subsets Latin-Extended para español.
- [ ] **CSS via Tailwind v4**: purge automático. No CSS custom > 5 KB sin justificación.
- [ ] **Core Web Vitals target**: LCP < 2.5s, FID < 100ms, CLS < 0.1.
- [ ] **Lighthouse >= 90** en Performance, Accessibility, Best Practices, SEO.
- [ ] **No third-party JS sin aprobación**: cada script externo (analytics, chat, etc.) debe pasar por revisión de impacto en performance.
- [ ] **Lazy load todo debajo del fold**: imágenes con `loading="lazy"`, componentes con `client:visible`.
- [ ] **Cache policy**: assets inmutables con `max-age=31536000`, HTML con revalidación.

El script `npm run validate:bundle` fuerza estos presupuestos en cada build.

---

## Seguridad

### Headers configurados (netlify.toml)

| Header | Valor | Propósito |
|---|---|---|
| `Content-Security-Policy` | `default-src 'none'; script-src 'self' ...` | Bloquea recursos no autorizados |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Fuerza HTTPS por 2 años |
| `X-Frame-Options` | `DENY` | Previene clickjacking |
| `X-Content-Type-Options` | `nosniff` | Previene MIME sniffing |
| `Permissions-Policy` | Camera, mic, geo, etc. deshabilitados | Bloquea acceso a sensores |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limita envío de referrer |

### Seguridad en la aplicación

- **Formulario de contacto**: Rate limiting (5/min por IP), validación Zod, sanitización XSS, honeypot anti-bot.
- **Sanity Client**: `useCdn: true` en producción (read-only), token solo si se requiere draft preview.
- **Middleware**: elimina `X-Powered-By` y `Server` headers. Inyecta `noindex` en entornos no productivos.

---

## Guía de rotación de secretos

### Inventario de secretos

| Secreto | Ubicación | Propietario | Cadencia de rotación |
|---|---|---|---|
| `PUBLIC_SANITY_PROJECT_ID` | Netlify env + `.env.local` | Dirección de TI del GAD | No es sensible (público) |
| `PUBLIC_SANITY_DATASET` | Netlify env + `.env.local` | Dirección de TI del GAD | No es sensible (público) |
| `SANITY_API_TOKEN` | Netlify env (solo server) | Dirección de TI del GAD | Cada 90 días |
| `APP_ENV` | Netlify env | DevOps | No requiere rotación |
| Netlify deploy key | Netlify dashboard | DevOps | Cada 180 días |
| GitHub deploy key | GitHub repo settings | DevOps | Cada 180 días |

### Procedimiento de rotación

#### 1. SANITY_API_TOKEN (cada 90 días)

```
Paso 1. Iniciar sesión en https://www.sanity.io/manage
Paso 2. Proyecto > API > Tokens
Paso 3. Crear un nuevo token con los mismos permisos (read-only o editor)
Paso 4. Copiar el token nuevo
Paso 5. En Netlify: Site settings > Environment variables
         - Actualizar SANITY_API_TOKEN con el valor nuevo
Paso 6. Disparar un nuevo deploy (Deploys > Trigger deploy)
Paso 7. Verificar que el sitio funciona correctamente
Paso 8. Volver a Sanity y REVOCAR el token anterior
Paso 9. Registrar la rotación en el log de seguridad
```

**Importante**: Crear el token nuevo ANTES de revocar el anterior. Esto evita downtime.

#### 2. Netlify deploy key (cada 180 días)

```
Paso 1. Netlify dashboard > Site settings > Build & deploy > Deploy key
Paso 2. Generar nueva deploy key
Paso 3. Actualizar la deploy key en GitHub repo settings
Paso 4. Verificar que un nuevo deploy se ejecuta correctamente
Paso 5. Registrar la rotación en el log de seguridad
```

#### 3. Respuesta ante compromiso

Si un secreto se expone (commit accidental, log filtrado, etc.):

```
1. INMEDIATO: Revocar el secreto comprometido en la plataforma origen
2. Generar un nuevo secreto
3. Actualizar en Netlify env vars
4. Trigger redeploy
5. Si el secreto estaba en un commit: limpiar el historial de Git
   (git filter-branch o BFG Repo Cleaner)
6. Notificar al responsable de seguridad del GAD
7. Documentar el incidente en el log de seguridad
```

### Calendario de rotación

| Mes | Acción |
|---|---|
| Enero | Rotar SANITY_API_TOKEN |
| Abril | Rotar SANITY_API_TOKEN |
| Julio | Rotar SANITY_API_TOKEN + deploy keys |
| Octubre | Rotar SANITY_API_TOKEN |

---

## Manual de soberanía digital

### Declaración de soberanía

Este sistema está diseñado para que el Gobierno Autónomo Descentralizado Municipal del Cantón Antonio Ante mantenga el control total sobre su infraestructura digital. Ningún proveedor externo es propietario de los datos, el código fuente o la identidad digital del GAD.

### Propiedad de activos

| Activo | Propietario legal | Ubicación | Control de acceso |
|---|---|---|---|
| Código fuente | GAD Antonio Ante | GitHub (`digital-antonio-ante/antonio-ante`) | Admin: Dirección de TI |
| Contenido (CMS) | GAD Antonio Ante | Sanity.io Content Lake | Admin: Comunicación Social + TI |
| Dominio `antonio-ante.gob.ec` | GAD Antonio Ante | NIC.ec / registrador autorizado | Admin: Dirección de TI |
| Certificado SSL | Automático (Let's Encrypt via Netlify) | Netlify | Renovación automática |
| Datos de formulario | GAD Antonio Ante | Procesados en Netlify Functions | No se almacenan en terceros |
| Analytics | GAD Antonio Ante | Google Analytics (si se activa) | Admin: Comunicación Social |

### Guía de transferencia

Si el GAD necesita migrar a otro proveedor de hosting, otro CMS o entregar la gestión a un nuevo equipo técnico, seguir este protocolo:

#### 1. Transferencia de código

```
Paso 1. Descargar el repositorio completo:
        git clone --mirror https://github.com/digital-antonio-ante/antonio-ante.git

Paso 2. El código es 100% portable. Solo requiere Node.js >= 22 para ejecutarse.
        No hay dependencia en servicios propietarios de Netlify para el build.

Paso 3. Para migrar a otro hosting (Vercel, AWS, servidor propio):
        - Cambiar el adapter en astro.config.mjs
        - Replicar los security headers del netlify.toml en el nuevo hosting
        - Configurar las variables de entorno
```

#### 2. Transferencia de contenido (Sanity.io)

```
Paso 1. Exportar todo el contenido:
        npx sanity dataset export production ./backup.tar.gz

Paso 2. El export incluye todos los documentos y assets en formato NDJSON.
        Es un formato abierto, legible y portable.

Paso 3. Para migrar a otro CMS:
        - Descomprimir el export
        - Los documentos son JSON estándar
        - Las imágenes se incluyen como archivos binarios
        - Los schemas Zod en src/lib/validations/ documentan la estructura exacta
```

#### 3. Transferencia de dominio

```
Paso 1. El dominio .gob.ec está registrado a nombre del GAD.
        Verificar que los contactos administrativo y técnico están actualizados.

Paso 2. Para apuntar a nuevo hosting:
        - Obtener los nameservers o IP del nuevo hosting
        - Actualizar registros DNS en el panel del registrador
        - Esperar propagación (24-48 horas)
```

#### 4. Checklist de transferencia completa

- [ ] Acceso admin al repositorio de GitHub transferido
- [ ] Acceso admin al proyecto de Sanity.io transferido
- [ ] Backup completo de Sanity descargado y verificado
- [ ] Credenciales de Netlify transferidas o hosting migrado
- [ ] Dominio con contactos actualizados
- [ ] Variables de entorno documentadas y entregadas (sobre sellado)
- [ ] Este README entregado como documentación técnica
- [ ] Sesión de transferencia de conocimiento realizada (mínimo 4 horas)
- [ ] Acta de entrega-recepción firmada por ambas partes

### Dependencia de servicios externos

| Servicio | Criticidad | Alternativa si deja de existir |
|---|---|---|
| **Netlify** | Alta (hosting) | Vercel, AWS Amplify, Cloudflare Pages, o servidor propio con Node.js |
| **Sanity.io** | Alta (CMS) | Strapi (self-hosted), Directus, o Astro Content Collections con Markdown |
| **GitHub** | Media (código) | GitLab, Bitbucket, o servidor Git propio. El código es un repo Git estándar |
| **Google Fonts** | Baja (tipografía) | Descargar los archivos .woff2 y servirlos desde `public/fonts/` |
| **Google Analytics** | Baja (analytics) | Plausible (self-hosted), Matomo, o servidor Umami |

### Garantía de independencia

1. **Sin vendor lock-in**: Astro genera HTML estático. El output de `npm run build` es un directorio `dist/` que se puede servir desde cualquier servidor web (nginx, Apache, CDN).
2. **Datos exportables**: Sanity permite exportar todo el contenido en formato NDJSON en cualquier momento.
3. **Código abierto**: todas las dependencias son open-source con licencias permisivas (MIT, Apache 2.0).
4. **Documentación autocontenida**: este README y los schemas Zod documentan completamente la arquitectura sin necesidad de conocimiento tribal.

---

## Licencia

Propiedad del Gobierno Autónomo Descentralizado Municipal del Cantón Antonio Ante.
Todos los derechos reservados.
