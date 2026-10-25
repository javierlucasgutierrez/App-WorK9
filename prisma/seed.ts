// Datos de ejemplo (ficticios) para probar la app.
// Se cargan con: npm run db:seed   (borra los datos que haya y vuelve a crearlos)

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { copyFile, mkdir } from "fs/promises";
import path from "path";

const db = new PrismaClient();
const PASSWORD = "demo1234";

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(18, 0, 0, 0);
  return d;
};

// Copia el vídeo de ejemplo a la carpeta de vídeos y devuelve su clave.
async function sampleVideo(name: string) {
  const root = process.env.STORAGE_LOCAL_DIR ?? "./uploads";
  const key = `ejemplos/${name}.mp4`;
  await mkdir(path.join(root, "ejemplos"), { recursive: true });
  await copyFile(path.join(__dirname, "seed-assets", "ejemplo.mp4"), path.join(root, key));
  return key;
}

// Copia una foto de ejemplo a la carpeta de archivos y devuelve su clave.
async function samplePhoto(name: string) {
  const root = process.env.STORAGE_LOCAL_DIR ?? "./uploads";
  const key = `ejemplos/${name}.jpg`;
  await mkdir(path.join(root, "ejemplos"), { recursive: true });
  await copyFile(path.join(__dirname, "seed-assets", `${name}.jpg`), path.join(root, key));
  return key;
}

async function main() {
  // Vaciar (en orden para respetar las relaciones)
  await db.recommendation.deleteMany();
  await db.listingInterest.deleteMany();
  await db.listing.deleteMany();
  await db.homePractice.deleteMany();
  await db.sessionExercise.deleteMany();
  await db.trainingSession.deleteMany();
  await db.assignment.deleteMany();
  await db.exercise.deleteMany();
  await db.content.deleteMany();
  await db.dog.deleteMany();
  await db.user.deleteMany();

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const trainer = await db.user.create({
    data: {
      email: "adiestrador@demo.com",
      name: "Marta Ruiz",
      phone: "600 000 001",
      role: "TRAINER",
      inviteCode: "MARTA-1234",
      passwordHash,
    },
  });

  const ana = await db.user.create({
    data: {
      email: "ana@demo.com",
      name: "Ana García",
      phone: "600 000 002",
      role: "CLIENT",
      trainerId: trainer.id,
      passwordHash,
    },
  });
  const pedro = await db.user.create({
    data: {
      email: "pedro@demo.com",
      name: "Pedro López",
      phone: "600 000 003",
      role: "CLIENT",
      trainerId: trainer.id,
      passwordHash,
    },
  });

  const luna = await db.dog.create({
    data: {
      name: "Luna",
      breed: "Border Collie",
      sex: "FEMALE",
      birthDate: new Date("2024-03-10"),
      weightKg: 16,
      notes: "Muy enérgica. Se distrae con otros perros. Objetivo: llamada fiable en el parque.",
      ownerId: ana.id,
    },
  });
  const toby = await db.dog.create({
    data: {
      name: "Toby",
      breed: "Mestizo",
      sex: "MALE",
      birthDate: new Date("2019-06-01"),
      weightKg: 9,
      notes: "Tranquilo, algo miedoso con ruidos fuertes.",
      ownerId: ana.id,
    },
  });
  const rocky = await db.dog.create({
    data: {
      name: "Rocky",
      breed: "Pastor Alemán",
      sex: "MALE",
      birthDate: new Date("2025-01-20"),
      weightKg: 28,
      notes: "Cachorro grande. Tira mucho de la correa. Objetivo: paseo relajado.",
      ownerId: pedro.id,
    },
  });

  const video = await sampleVideo("ejercicio");
  const ex = async (title: string, description: string, withVideo = true) =>
    db.exercise.create({
      data: { title, description, trainerId: trainer.id, videoKey: withVideo ? video : null },
    });

  const sentado = await ex(
    "Sentado",
    "1. Con un premio en la mano, llévalo por encima de su cabeza.\n2. Cuando apoye el culete, di «¡Bien!» y premia.\n3. Cuando lo haga fácil, añade la palabra «Sienta» justo antes del gesto.",
  );
  const llamada = await ex(
    "Llamada (Ven)",
    "1. Empieza en casa, sin distracciones.\n2. Di su nombre + «Ven» con voz alegre y agáchate.\n3. Premia mucho cuando llegue. Nunca le llames para algo que no le guste.",
  );
  const correa = await ex(
    "Paseo sin tirar",
    "1. Si la correa se tensa, para y espera.\n2. Cuando la correa se afloje, di «Sí» y avanza.\n3. Premia a la altura de tu pierna cuando camine a tu lado.",
  );
  const quieto = await ex(
    "Quieto",
    "1. Pídele sentado.\n2. Muestra la palma, di «Quieto» y espera 2 segundos.\n3. Vuelve, premia y libera con «Libre». Aumenta el tiempo poco a poco.",
    false,
  );

  // Deberes
  const deberLlamada = await db.assignment.create({
    data: {
      dogId: luna.id,
      exerciseId: llamada.id,
      trainerId: trainer.id,
      instructions: "3 veces al día en casa. Esta semana, nada de practicar en el parque todavía.",
      targetReps: 10,
      dueDate: daysAgo(-5),
    },
  });
  await db.assignment.create({
    data: {
      dogId: luna.id,
      exerciseId: sentado.id,
      trainerId: trainer.id,
      instructions: "Ya lo hace bien: practícalo antes de ponerle el comedero.",
      targetReps: 5,
      status: "DONE",
      completedAt: daysAgo(2),
    },
  });
  await db.assignment.create({
    data: {
      dogId: toby.id,
      exerciseId: quieto.id,
      trainerId: trainer.id,
      instructions: "Sesiones cortas de 2 minutos, en un sitio tranquilo.",
      targetReps: 5,
      dueDate: daysAgo(-7),
    },
  });
  const deberCorrea = await db.assignment.create({
    data: {
      dogId: rocky.id,
      exerciseId: correa.id,
      trainerId: trainer.id,
      instructions: "Paseos de 10 minutos por una calle tranquila antes del paseo largo.",
      targetReps: 15,
      dueDate: daysAgo(-3),
    },
  });

  // Sesiones con el adiestrador (con mejora progresiva)
  const session = (dogId: string, date: Date, notes: string, items: [string, number, number][]) =>
    db.trainingSession.create({
      data: {
        dogId,
        trainerId: trainer.id,
        date,
        notes,
        exercises: {
          create: items.map(([exerciseId, successes, failures]) => ({ exerciseId, successes, failures })),
        },
      },
    });

  await session(luna.id, daysAgo(21), "Primera sesión. Mucha energía, cuesta que se centre.", [
    [sentado.id, 5, 5],
    [llamada.id, 3, 7],
  ]);
  await session(luna.id, daysAgo(14), "Mejor atención. La llamada con distracciones aún falla.", [
    [sentado.id, 8, 2],
    [llamada.id, 5, 5],
  ]);
  await session(luna.id, daysAgo(7), "Gran avance en la llamada en interior.", [
    [sentado.id, 9, 1],
    [llamada.id, 7, 3],
  ]);
  await session(toby.id, daysAgo(10), "Trabajamos confianza. Se asustó con una moto.", [[quieto.id, 4, 6]]);
  await session(rocky.id, daysAgo(12), "Tira mucho al principio, luego se calma.", [[correa.id, 4, 8]]);
  await session(rocky.id, daysAgo(5), "Mejora clara en los primeros 5 minutos.", [[correa.id, 8, 4]]);

  // Prácticas en casa
  for (const [n, reps, ok] of [
    [6, 10, 6],
    [4, 10, 7],
    [2, 12, 10],
    [1, 10, 9],
  ]) {
    await db.homePractice.create({
      data: {
        dogId: luna.id,
        clientId: ana.id,
        exerciseId: llamada.id,
        assignmentId: deberLlamada.id,
        date: daysAgo(n),
        repetitions: reps,
        successes: ok,
      },
    });
  }
  await db.homePractice.create({
    data: {
      dogId: rocky.id,
      clientId: pedro.id,
      exerciseId: correa.id,
      assignmentId: deberCorrea.id,
      date: daysAgo(2),
      repetitions: 15,
      successes: 9,
      notes: "Se cruzó un gato y ahí se perdió todo, ¡pero el resto genial!",
    },
  });

  // Contenido formativo
  await db.content.create({
    data: {
      authorId: trainer.id,
      title: "Cómo usar los premios correctamente",
      summary: "Cuándo, cuánto y cómo premiar para que tu perro aprenda más rápido.",
      body: "El premio tiene que llegar justo después de la conducta (en 1-2 segundos).\n\nUsa premios pequeños y muy apetecibles para ejercicios difíciles, y pienso para los fáciles.\n\nPoco a poco, alterna premios de comida con caricias, juego y libertad.",
      videoKey: video,
    },
  });
  await db.content.create({
    data: {
      authorId: trainer.id,
      title: "Señales de estrés en el perro",
      summary: "Aprende a reconocer cuándo tu perro lo está pasando mal.",
      body: "Bostezos fuera de contexto, lamerse el hocico, girar la cabeza, cola baja, orejas hacia atrás...\n\nSi ves varias a la vez, aleja al perro de lo que le preocupa y dale espacio.",
    },
  });
  await db.content.create({
    data: {
      authorId: trainer.id,
      title: "Curso: cachorro feliz (de 2 a 6 meses)",
      summary: "Socialización, mordisqueo, pis en casa y primeras órdenes.",
      body: "Contenido completo del curso (próximamente de pago).",
      isPremium: true,
      priceCents: 999,
    },
  });

  // Material (anuncios entre socios)
  const arnes = await db.listing.create({
    data: {
      sellerId: trainer.id,
      title: "Arnés antitirones talla M",
      description: "Arnés con enganche delantero, ideal para aprender a pasear sin tirar. Lo uso en mis clases y lo recomiendo.",
      category: "Arneses",
      condition: "NEW",
      priceCents: 2490,
      location: "Madrid",
      photoKey: await samplePhoto("arnes"),
    },
  });
  await db.listing.create({
    data: {
      sellerId: trainer.id,
      title: "Pack de 3 clickers",
      description: "Clickers con muñequera. Perfectos para empezar a trabajar con refuerzo positivo.",
      category: "Material de adiestramiento",
      condition: "NEW",
      priceCents: 900,
      location: "Madrid",
      photoKey: await samplePhoto("clicker"),
    },
  });
  const transportin = await db.listing.create({
    data: {
      sellerId: ana.id,
      title: "Transportín para perro mediano",
      description: "Usado pero en muy buen estado. Toby ya no cabe. 60 × 40 × 40 cm.",
      category: "Transportines y camas",
      condition: "USED",
      priceCents: 1500,
      location: "Alcobendas",
      photoKey: await samplePhoto("transportin"),
    },
  });
  await db.listing.create({
    data: {
      sellerId: pedro.id,
      title: "Correa larga de 10 metros",
      description: "La usamos para practicar la llamada en el campo. Algo gastada, pero funciona perfecta. ¡Os la regalo!",
      category: "Collares y correas",
      condition: "USED",
      isFree: true,
      location: "Getafe",
      photoKey: await samplePhoto("correa"),
    },
  });
  await db.listingInterest.create({
    data: { listingId: transportin.id, userId: pedro.id, message: "¡Hola! ¿Sigue disponible? Me vendría genial." },
  });
  await db.recommendation.create({
    data: { trainerId: trainer.id, dogId: rocky.id, listingId: arnes.id, note: "Para el paseo sin tirar: con este irá mucho más rápido." },
  });

  console.log("✔ Datos de ejemplo creados. Contraseña de todos los usuarios:", PASSWORD);
  console.log("  Adiestradora: adiestrador@demo.com  (código de invitación MARTA-1234)");
  console.log("  Clientes:     ana@demo.com (Luna y Toby) · pedro@demo.com (Rocky)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
