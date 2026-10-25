// Datos de ejemplo (ficticios) para probar la app: 3 socios y 8 anuncios.
// Se cargan con: npm run db:seed   (¡borra los datos que haya y vuelve a crearlos!)

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { copyFile, mkdir } from "fs/promises";
import path from "path";
import { searchFields } from "../src/lib/search";

const db = new PrismaClient();
const PASSWORD = "demo1234";

const daysAgo = (n: number, hour = 19) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
};

// Copia una foto de ejemplo a la carpeta de archivos y devuelve su clave.
async function samplePhoto(name: string) {
  const root = process.env.STORAGE_LOCAL_DIR ?? "./uploads";
  const key = `ejemplos/${name}.jpg`;
  await mkdir(path.join(root, "ejemplos"), { recursive: true });
  await copyFile(path.join(__dirname, "seed-assets", `${name}.jpg`), path.join(root, key));
  return key;
}

type Sample = {
  seller: string;
  photos: string[];
  title: string;
  description: string;
  category: string;
  condition: "NEW" | "USED";
  price: number | null; // en euros; null = «Lo regalo»
  location: string;
  status?: "ACTIVE" | "RESERVED" | "SOLD";
  days: number; // hace cuántos días se publicó
  interests?: { from: string; message?: string; days: number }[];
};

async function main() {
  // Vaciar (en orden para respetar las relaciones)
  await db.listingInterest.deleteMany();
  await db.listingPhoto.deleteMany();
  await db.listing.deleteMany();
  await db.user.deleteMany();

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const users = {
    laura: await db.user.create({
      data: {
        email: "laura@demo.com",
        name: "Laura Martín",
        phone: "611 234 567",
        location: "Valencia",
        accountType: "PROFESSIONAL",
        passwordHash,
        createdAt: daysAgo(210),
      },
    }),
    sergio: await db.user.create({
      data: {
        email: "sergio@demo.com",
        name: "Sergio Ortega",
        phone: "622 345 678",
        location: "Madrid",
        accountType: "INDIVIDUAL",
        passwordHash,
        createdAt: daysAgo(95),
      },
    }),
    nerea: await db.user.create({
      data: {
        email: "nerea@demo.com",
        name: "Nerea Ibáñez",
        phone: "633 456 789",
        location: "Bilbao",
        accountType: "INDIVIDUAL",
        passwordHash,
        createdAt: daysAgo(40),
      },
    }),
  };
  type Who = keyof typeof users;

  const samples: Sample[] = [
    {
      seller: "sergio",
      photos: ["manga-1", "manga-2"],
      title: "Manga de mordida de yute para cachorro y perro joven",
      description:
        "Manga blanda de yute con asa interior, ideal para iniciar la presa en cachorros y perros jóvenes.\n" +
        "La he usado unos meses con mi malinois y ya hemos pasado a manga dura. Costuras perfectas, sin roturas.",
      category: "Mordida",
      condition: "USED",
      price: 45,
      location: "Madrid",
      days: 1,
      interests: [{ from: "nerea", message: "¡Hola! ¿Sigue disponible? Me vendría genial para mi cachorra. ¿La envías?", days: 0 }],
    },
    {
      seller: "laura",
      photos: ["traje-1", "traje-2"],
      title: "Traje de protección completo talla L (chaqueta + pantalón)",
      description:
        "Traje de figurante completo, talla L. Chaqueta y pantalón con refuerzos en brazos y piernas.\n" +
        "Lo usamos en el club para entrenamientos; está en buen estado, con el desgaste normal en las zonas de mordida.",
      category: "Mordida",
      condition: "USED",
      price: 380,
      location: "Valencia",
      status: "RESERVED",
      days: 4,
      interests: [{ from: "sergio", message: "Me interesa mucho. ¿Podría probármelo el sábado?", days: 3 }],
    },
    {
      seller: "nerea",
      photos: ["kit-1", "kit-2"],
      title: "Kit de olores de iniciación a la detección (6 latas + tubos)",
      description:
        "Kit nuevo, sin estrenar: 6 latas perforadas numeradas y tubos de cristal para impregnar.\n" +
        "Perfecto para empezar con la detección deportiva o en casa. Lo compré repetido.",
      category: "Detección",
      condition: "NEW",
      price: 60,
      location: "Bilbao",
      days: 2,
    },
    {
      seller: "sergio",
      photos: ["linea-1"],
      title: "Línea larga de rastreo de biotano, 15 m",
      description:
        "Línea de biotano de 15 metros, no absorbe agua ni se ensucia. Mosquetón de latón.\nUn año de uso, sin cortes.",
      category: "Rastreo",
      condition: "USED",
      price: 18,
      location: "Alcalá de Henares (Madrid)",
      days: 6,
    },
    {
      seller: "nerea",
      photos: ["arnes-1"],
      title: "Arnés de rastreo acolchado, talla M",
      description:
        "Arnés en Y acolchado para rastreo, talla M (pecho 60-75 cm). A mi perra se le ha quedado pequeño.\n" +
        "Lo regalo a quien lo vaya a usar de verdad 🙂",
      category: "Arneses",
      condition: "USED",
      price: null,
      location: "Bilbao",
      days: 3,
      interests: [{ from: "laura", message: "Para una perra joven del club que empieza en rastreo. ¡Gracias!", days: 2 }],
    },
    {
      seller: "laura",
      photos: ["rulos-1", "rulos-2"],
      title: "Lote de rulos de yute y pelotas con cuerda",
      description:
        "Lote nuevo: 2 rulos de yute (uno con asa) y 2 pelotas macizas con cuerda.\nSe pueden vender por separado, pregúntame.",
      category: "Motivadores",
      condition: "NEW",
      price: 25,
      location: "Valencia",
      days: 8,
    },
    {
      seller: "sergio",
      photos: ["jaula-1", "jaula-2"],
      title: "Jaula de aluminio para coche, 2 puertas (91 cm)",
      description:
        "Jaula de aluminio doble para maletero, 91 cm de ancho, con bandeja de goma y ventilación.\n" +
        "Cambio de coche y ya no me cabe. Recogida en mano en Madrid.",
      category: "Transporte",
      condition: "USED",
      price: 290,
      location: "Madrid",
      days: 12,
    },
    {
      seller: "laura",
      photos: ["curso-1"],
      title: "Seminario de figurante: iniciación a la mordida (2 días)",
      description:
        "Seminario práctico para quien quiere empezar como figurante: teoría, presentación de la manga, " +
        "seguridad y trabajo con perros reales.\nPlazas limitadas (8). Incluye material de protección durante el curso.",
      category: "Cursos y servicios",
      condition: "NEW",
      price: 120,
      location: "Valencia",
      days: 5,
      interests: [{ from: "sergio", days: 4 }],
    },
  ];

  for (const s of samples) {
    const data = {
      title: s.title,
      description: s.description,
      category: s.category,
      condition: s.condition,
      isFree: s.price == null,
      priceCents: s.price == null ? null : s.price * 100,
      location: s.location,
    };
    const listing = await db.listing.create({
      data: {
        ...data,
        ...searchFields(data),
        status: s.status ?? "ACTIVE",
        createdAt: daysAgo(s.days),
        sellerId: users[s.seller as Who].id,
      },
    });
    for (const [position, name] of s.photos.entries()) {
      await db.listingPhoto.create({ data: { listingId: listing.id, key: await samplePhoto(name), position } });
    }
    for (const i of s.interests ?? []) {
      await db.listingInterest.create({
        data: { listingId: listing.id, userId: users[i.from as Who].id, message: i.message, createdAt: daysAgo(i.days, 21) },
      });
    }
  }

  console.log(`✔ Datos de ejemplo creados. Socios: laura@demo.com, sergio@demo.com, nerea@demo.com (contraseña: ${PASSWORD})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
