import Link from "next/link";
import { Empty, PageHeader } from "@/components/ui";
import { requireClient } from "@/lib/auth";
import { DOG_SEX } from "@/lib/constants";
import { db } from "@/lib/db";
import { age } from "@/lib/format";

export default async function MyDogsPage() {
  const client = await requireClient();
  const dogs = await db.dog.findMany({ where: { ownerId: client.id }, orderBy: { name: "asc" } });

  return (
    <>
      <PageHeader
        title="Mis perros"
        action={
          <Link href="/cliente/perros/nuevo" className="btn shrink-0">
            + Añadir
          </Link>
        }
      />
      {dogs.length === 0 ? (
        <Empty>Añade a tu perro para empezar.</Empty>
      ) : (
        <ul className="space-y-3">
          {dogs.map((dog) => (
            <li key={dog.id}>
              <Link href={`/cliente/perros/${dog.id}`} className="card block hover:border-brand-500">
                <p className="font-semibold">🐕 {dog.name}</p>
                <p className="muted">
                  {[dog.breed, dog.sex && DOG_SEX[dog.sex], age(dog.birthDate)].filter(Boolean).join(" · ") || "Ver ficha"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
