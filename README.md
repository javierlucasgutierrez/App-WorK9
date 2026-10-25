# 🐾 Ako

**Enseñar y aprender, juntos.**

*Ako* es una palabra maorí (Nueva Zelanda) que significa a la vez «enseñar» y «aprender»: quien enseña también aprende. Así trabajamos adiestrador, familia y perro.

Web (pensada para el móvil) para adiestradores caninos y sus clientes.

- **Adiestrador/a:** clientes y fichas de perros, biblioteca de ejercicios con vídeo, deberes, sesiones de entrenamiento y evolución de cada perro.
- **Cliente / familia:** deberes, vídeos y explicaciones, registro de prácticas en casa y contenido formativo.

Funciona 100 % en local, sin cuentas ni servicios externos.

## Cómo abrirla en tu ordenador (paso a paso)

1. Instala **Node.js** (versión 20 o superior) desde https://nodejs.org (botón "LTS"). Solo hay que hacerlo una vez.
2. Descarga este proyecto (en GitHub: botón verde **Code → Download ZIP**, y descomprímelo).
3. Abre una terminal **dentro de la carpeta del proyecto**:
   - Windows: abre la carpeta, escribe `cmd` en la barra de la dirección y pulsa Enter.
   - Mac: clic derecho en la carpeta → *Nuevo terminal en la carpeta*.
4. Escribe estos comandos (uno cada vez, pulsando Enter):
   ```
   npm install
   npm run setup
   npm run dev
   ```
   El primero descarga las piezas de la app y el segundo crea la base de datos con los datos de ejemplo. Los dos solo hacen falta la primera vez.
5. Abre el navegador en **http://localhost:3000**

Para cerrarla, pulsa `Ctrl + C` en la terminal. Las siguientes veces basta con `npm run dev`.

### Probarla desde tu móvil
Con el móvil en la **misma wifi** que el ordenador, abre en el móvil la dirección "Network" que aparece al ejecutar `npm run dev` (algo como `http://192.168.1.35:3000`).

### Usuarios de ejemplo (contraseña de todos: `demo1234`)
| Quién | Correo | Notas |
|---|---|---|
| Adiestradora | adiestrador@demo.com | Código de invitación: **MARTA-1234** |
| Cliente | ana@demo.com | Perros: Luna y Toby |
| Cliente | pedro@demo.com | Perro: Rocky |

Para volver a dejar los datos de ejemplo como al principio: `npm run db:seed` (¡borra todo lo demás!).
Para ver la base de datos como una hoja de cálculo: `npm run db:studio`.

## Qué puedes probar

**Como adiestradora (adiestrador@demo.com)**
- *Inicio:* resumen, tu código de invitación y las últimas prácticas que han apuntado las familias.
- *Clientes:* da de alta clientes y perros. Desde la ficha de un perro puedes mandar deberes, registrar una sesión (**+ Sesión**) y ver su **evolución** en gráficas.
- *Ejercicios:* tu biblioteca, con explicación y vídeo (subido desde el móvil u ordenador, o con un enlace).
- *Formación:* artículos y vídeos para los clientes. Puedes marcarlos "de pago" (de momento solo se muestran bloqueados).

**Como cliente (ana@demo.com)**
- *Deberes:* lo que te ha mandado tu adiestrador. Al abrir uno ves el vídeo y la explicación, puedes marcarlo como hecho y apuntar las prácticas en casa.
- *Mis perros:* la ficha, la evolución y las sesiones de cada perro.
- *Prácticas:* el historial de todo lo que habéis practicado en casa.
- *Formación:* el contenido formativo.

## Notas técnicas (para el futuro)

- **Tecnología:** Next.js 15 + Prisma + SQLite + Tailwind.
- **Pasar a PostgreSQL:** en `prisma/schema.prisma` cambia `provider = "sqlite"` por `"postgresql"`, pon la nueva `DATABASE_URL` en `.env`, borra `prisma/migrations` y ejecuta `npx prisma migrate dev --name inicio`. El esquema no usa nada exclusivo de SQLite.
- **Vídeos:** se guardan en `uploads/` a través de `src/lib/storage.ts`. Para usar la nube (S3, R2…) hay que añadir otra implementación de `Storage` allí y elegirla con `STORAGE_DRIVER`. La base de datos solo guarda la "clave" de cada archivo.
- **Contenido de pago:** `Content` ya tiene `isPremium` y `priceCents`, preparado para añadir pagos.
- **Sesiones:** cookie firmada (`AUTH_SECRET` en `.env`), contraseñas cifradas con bcrypt.
