import { logout } from "@/app/actions/auth";
import { updateProfile } from "@/app/actions/profile";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { Choice, Field } from "@/components/Field";
import { Avatar } from "@/components/SiteShell";
import { requireUser } from "@/lib/auth";
import { ACCOUNT_TYPES } from "@/lib/constants";
import { formatMonth } from "@/lib/format";

export const metadata = { title: "Mi perfil · K9 Club" };

export default async function ProfilePage() {
  const user = await requireUser("/perfil");
  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="flex items-center gap-3">
        <Avatar name={user.name} className="h-14 w-14 text-2xl" />
        <div>
          <h1 className="h1">{user.name}</h1>
          <p className="muted">
            {ACCOUNT_TYPES[user.accountType]} · Socio desde {formatMonth(user.createdAt)}
          </p>
        </div>
      </div>

      <ActionForm action={updateProfile} className="card space-y-4">
        <h2 className="h2">Mis datos</h2>
        <Choice label="Soy…" name="accountType" options={Object.entries(ACCOUNT_TYPES)} defaultValue={user.accountType} />
        <Field label="Nombre" name="name" defaultValue={user.name} required autoComplete="name" />
        <Field
          label="Teléfono"
          name="phone"
          type="tel"
          defaultValue={user.phone ?? ""}
          autoComplete="tel"
          hint="Solo lo ven las personas con las que contactas por un anuncio."
        />
        <Field label="Zona o ciudad" name="location" defaultValue={user.location ?? ""} hint="Se propone al publicar un anuncio." />
        <div>
          <p className="label">Correo</p>
          <p className="rounded-xl bg-gray-50 px-3 py-2.5 text-gray-700">{user.email}</p>
        </div>
        <SubmitButton>Guardar</SubmitButton>
      </ActionForm>

      <form action={logout}>
        <button className="btn-secondary w-full">Cerrar sesión</button>
      </form>
    </div>
  );
}
