// Prepara la app la primera vez: crea .env, la base de datos y los datos de ejemplo.
import { execSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

if (!existsSync(".env")) {
  copyFileSync(".env.example", ".env");
  const env = readFileSync(".env", "utf8").replace(
    "cambia-esta-clave-por-una-larga-y-secreta",
    randomBytes(32).toString("hex"),
  );
  writeFileSync(".env", env);
  console.log("✔ Archivo .env creado");
}

const run = (cmd) => execSync(cmd, { stdio: "inherit" });
run("npx prisma migrate deploy");
run("npx prisma db seed");
console.log("\n✔ Todo listo. Arranca la app con: npm run dev  y abre http://localhost:3000");
