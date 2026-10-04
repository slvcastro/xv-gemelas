# XV Años · Kelly & Kyara

Invitación digital para los XV años de Kelly y Kyara (sábado 28 de noviembre de 2026, Ticul, Yucatán).
Next.js 16 (App Router) + Tailwind v4 + Drizzle ORM sobre Neon Postgres, con fotos en Vercel Blob.

## Rutas

| Ruta | Para quién | Qué hace |
| --- | --- | --- |
| `/` | Público | Invitación general; el invitado escribe su código para abrir su pase. |
| `/i/CODIGO` | Cada invitado | Invitación completa personalizada + confirmación (RSVP) + pase QR. |
| `/admin` | Familia | Panel: invitados, fotografías y recepción. |
| `/admin/check-in?token=CODIGO` | Personal de la entrada | Pantalla verde / amarilla / roja al escanear el QR. |

## Variables de entorno (Vercel → Settings → Environment Variables)

| Variable | Obligatoria | Uso |
| --- | --- | --- |
| `DATABASE_URL` | Sí | Cadena de conexión de Neon (la crea la integración de Neon). |
| `BLOB_READ_WRITE_TOKEN` | Sí, para subir fotos | La crea Vercel al conectar un Blob store al proyecto. |
| `ADMIN_PASSWORD` | Muy recomendada | Contraseña del panel. Si falta se usa una por defecto y el panel muestra un aviso. |

El build **no** necesita ninguna variable: todas las páginas que leen la base de datos se renderizan por petición.
Los enlaces que se comparten (WhatsApp, QR) usan el dominio de producción que Vercel expone en
`VERCEL_PROJECT_PRODUCTION_URL` (automático).

## Base de datos

El esquema está en `src/db/schema.ts`. Para crear o actualizar las tablas en Neon:

```bash
DATABASE_URL="postgresql://…" npx drizzle-kit push
```

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:3000 (necesita DATABASE_URL en .env.local)
npm run lint
npm run build
```

## Datos que se editan en el código

- Bancos para transferencias: `BANK_INFO` en `src/components/GiftsSection.tsx` (el botón se oculta mientras esté vacío).
- Lugares, horarios, padres y padrinos: `src/components/EventDetailsSection.tsx` y `src/components/FamilySection.tsx`.
- Mensaje de WhatsApp: `src/lib/whatsapp.ts`.
