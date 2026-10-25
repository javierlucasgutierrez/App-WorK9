import { toInputDate } from "@/lib/format";
import { Field, TextArea } from "./Field";

type Dog = {
  name: string;
  breed: string | null;
  sex: string | null;
  birthDate: Date | null;
  weightKg: number | null;
  notes: string | null;
};

export function DogFields({ dog, required = true }: { dog?: Dog; required?: boolean }) {
  return (
    <div className="space-y-3">
      <Field label="Nombre del perro" name="name" defaultValue={dog?.name} required={required} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Raza" name="breed" defaultValue={dog?.breed ?? ""} />
        <div>
          <label htmlFor="sex" className="label">
            Sexo
          </label>
          <select id="sex" name="sex" className="input" defaultValue={dog?.sex ?? ""}>
            <option value="">—</option>
            <option value="MALE">Macho</option>
            <option value="FEMALE">Hembra</option>
          </select>
        </div>
        <Field label="Fecha de nacimiento" name="birthDate" type="date" defaultValue={toInputDate(dog?.birthDate ?? null)} />
        <Field label="Peso (kg)" name="weightKg" inputMode="decimal" defaultValue={dog?.weightKg ?? ""} />
      </div>
      <TextArea label="Notas (carácter, salud, objetivos…)" name="notes" defaultValue={dog?.notes ?? ""} />
    </div>
  );
}
