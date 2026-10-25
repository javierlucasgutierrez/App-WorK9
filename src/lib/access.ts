import "server-only";
import { db } from "./db";

// Comprobaciones de permisos: cada adiestrador solo puede tocar a SUS clientes y perros.

export function getTrainerClient(trainerId: string, clientId: string) {
  return db.user.findFirst({ where: { id: clientId, trainerId, role: "CLIENT" } });
}

export function getTrainerDog(trainerId: string, dogId: string) {
  return db.dog.findFirst({ where: { id: dogId, owner: { trainerId } }, include: { owner: true } });
}

export function getTrainerExercise(trainerId: string, exerciseId: string) {
  return db.exercise.findFirst({ where: { id: exerciseId, trainerId } });
}

export function getClientDog(clientId: string, dogId: string) {
  return db.dog.findFirst({ where: { id: dogId, ownerId: clientId } });
}
