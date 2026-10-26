# 🐾 MercaK9

**Conecta · Aprende · Comparte** — Conecta, aprende y comparte con la comunidad canina.

El mercado del perro de trabajo: material **nuevo y de segunda mano** (mordida, detección, rastreo, arneses, transporte…), creadores y talleres, cursos y servicios, entre particulares y profesionales. Pensada para usarse desde el móvil.

Funciona 100 % en local, en tu ordenador, sin cuentas ni servicios externos.

## Qué puedes hacer

- **Sin cuenta:** ver todos los anuncios, buscar por palabras y filtrar por categoría, nuevo / segunda mano / gratis y zona.
- **Con cuenta (gratis, solo correo y contraseña):**
  - Publicar anuncios con varias fotos (desde el móvil puedes hacerlas en ese momento), precio o «Lo regalo», estado y zona.
  - Pulsar **«Me interesa»** (con un mensaje opcional). Al hacerlo, tú ves el nombre, correo y teléfono del anunciante, y él ve los tuyos, con botones para llamar, escribir por WhatsApp o mandar un correo.
  - En tus anuncios: ver a los interesados, marcarlos como **Disponible / Reservado / Vendido**, editarlos y borrarlos.
  - **Mis anuncios:** lo que has publicado y lo que te interesa.
  - **Perfil:** nombre, teléfono, zona y si eres particular o profesional.

## Cómo abrirla en tu ordenador (paso a paso)

1. Instala **Node.js** (versión 20 o superior) desde https://nodejs.org (botón "LTS"). Solo hay que hacerlo una vez.
2. Descarga el proyecto: en GitHub, elige la rama **claude/k9-club-material**, pulsa el botón verde **Code → Download ZIP** y descomprímelo.
3. Abre una terminal **dentro de la carpeta del proyecto**:
   - Windows: abre la carpeta, escribe `cmd` en la barra de la dirección y pulsa Enter.
   - Mac: clic derecho en la carpeta → *Nuevo terminal en la carpeta*.
4. Escribe estos comandos (uno cada vez, pulsando Enter y esperando a que termine):
   ```
   npm install
   npm run setup
   npm run dev
   ```
   El primero descarga las piezas de la app y el segundo crea la base de datos con los datos de ejemplo. Estos dos solo hacen falta la primera vez.
5. Abre el navegador en **http://localhost:3000**

Para cerrarla, pulsa `Ctrl + C` en la terminal. Las siguientes veces basta con `npm run dev`.

### Probarla desde tu móvil
Con el móvil en la **misma wifi** que el ordenador, abre en el móvil la dirección "Network" que aparece al ejecutar `npm run dev` (algo como `http://192.168.1.35:3000`).

### Socios de ejemplo (contraseña de todos: `demo1234`)
| Quién | Correo | Notas |
|---|---|---|
| Laura Martín (profesional, Valencia) | laura@demo.com | Tiene interesados en el arnés… y vende un traje y un seminario |
| Sergio Ortega (particular, Madrid) | sergio@demo.com | Su manga de yute tiene una interesada |
| Nerea Ibáñez (particular, Bilbao) | nerea@demo.com | Regala un arnés de rastreo |

- Volver a dejar los datos de ejemplo como al principio: `npm run db:seed` (¡borra todo lo demás!).
- Ver la base de datos como una hoja de cálculo: `npm run db:studio`.

## Cómo está hecha (para quien programe)

- **Next.js 15** (App Router, acciones de servidor) + **Tailwind CSS 4**.
- **Prisma** con **SQLite** (archivo `prisma/dev.db`). Para pasar a **PostgreSQL**, ver las instrucciones al principio de `prisma/schema.prisma`: cambiar el proveedor y `DATABASE_URL` y regenerar la migración. No se usa nada exclusivo de SQLite; la búsqueda sin tildes ni mayúsculas usa columnas normalizadas (`src/lib/search.ts`), así que funciona igual en los dos.
- **Fotos:** todas pasan por una única "puerta", `src/lib/storage.ts`. Ahora se guardan en la carpeta `uploads/`; para llevarlas a la nube (S3, R2…) basta con escribir otra implementación de `Storage`. Las fotos se reducen en el propio móvil antes de subirlas (`PhotoPicker.tsx`).
- **Cuentas:** contraseñas cifradas con bcrypt; la sesión es una cookie firmada (`src/lib/auth.ts`).
- **Preparada para crecer:** pagos (precios en céntimos), chat (cada «Me interesa» puede ser el inicio de una conversación), avisos y una zona para adiestradores y clientes. El código de la zona de adiestradores de la primera versión está en la rama `claude/dog-training-platform-vnggro`.

| Carpeta | Qué hay |
|---|---|
| `src/app` | Páginas: inicio, `anuncios` (buscar, ficha, editar), `publicar`, `mis-anuncios`, `perfil`, `entrar`, `registro` |
| `src/app/actions` | Lo que se ejecuta en el servidor al enviar formularios |
| `src/components` | Piezas de la interfaz (`market/` = anuncios) |
| `src/lib` | Base de datos, sesiones, almacenamiento, búsqueda, constantes (categorías, estados) |
| `prisma` | Esquema de la base de datos, migraciones y datos de ejemplo (`seed.ts`, `seed-assets/`) |
