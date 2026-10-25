import { createClient } from "@/app/actions/trainer";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { DogFields } from "@/components/DogFields";
import { Field } from "@/components/Field";
import { PageHeader } from "@/components/ui";

export default function NewClientPage() {
  return (
    <>
      <PageHeader title="Nuevo cliente" back={{ href: "/adiestrador/clientes", label: "Clientes" }} />
      <ActionForm action={createClient}>
        <div className="card space-y-3">
          <h2 className="h2">Datos del cliente</h2>
          <Field label="Nombre y apellidos" name="clientName" required />
          <Field label="Correo electrónico (será su usuario)" name="email" type="email" required />
          <Field label="Teléfono" name="phone" type="tel" />
          <Field label="Contraseña inicial (dásela al cliente)" name="password" minLength={6} required />
        </div>
        <div className="card">
          <h2 className="h2 mb-3">Su perro (opcional)</h2>
          <DogFields required={false} />
        </div>
        <SubmitButton>Crear cliente</SubmitButton>
      </ActionForm>
    </>
  );
}
