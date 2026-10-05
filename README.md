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
| `DATABASE_URL` | Sí | Cadena de conexión de Neon (proyecto `xv-kelly-kyara`, rama `production`). Guardada como variable *sensible*. |
| `BLOB_READ_WRITE_TOKEN` | Sí, para subir fotos | La crea Vercel al conectar el Blob store `xv-kelly-kyara-fotos` al proyecto. |
| `ADMIN_PASSWORD` | Sí | Contraseña del panel. Si faltara se usaría una por defecto y el panel mostraría un aviso. |

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

- Lugares, horarios, mapas e itinerario: `src/lib/event.ts` (una sola fuente; la usan las tarjetas, el calendario y el mensaje de WhatsApp).
- Bancos para transferencias: `BANK_INFO` en `src/components/GiftsSection.tsx` (el botón se oculta mientras esté vacío).
- Padres y padrinos: `src/components/FamilySection.tsx`.
- Mensaje de WhatsApp: `src/lib/whatsapp.ts`.

## Costos y límites (todo en planes gratuitos)

| Servicio | Plan | Cómo se evita cualquier cobro |
| --- | --- | --- |
| Vercel | Hobby | No tiene forma de pago: si se llegara a un límite, Vercel pausa el servicio, no cobra. No hay integraciones de pago instaladas. La optimización de imágenes guarda las copias 31 días y usa pocos tamaños (`next.config.ts`) para quedar muy por debajo de la cuota. |
| Vercel Blob | Incluido en Hobby | Un solo almacén (`xv-kelly-kyara-fotos`). Subir solo JPG/PNG/WebP de hasta 25 MB. |
| Neon | Free | Cómputo fijo en 0.25 CU (lo mínimo) con suspensión automática a los 5 min sin uso: las horas gratis del mes rinden ~400 h de base activa. El plan Free no admite cobros. |
| Hostinger | Dominio pagado hasta el 4 oct 2027 | Renovación automática **desactivada** (no habrá cargo en 2027). Para conservar el dominio después, renovarlo a mano desde hPanel. |
| GitHub | Gratis | El repositorio no usa GitHub Actions ni servicios de pago. |

Nunca se debe aceptar "Upgrade", "Pro" ni compras en ninguno de los paneles.
