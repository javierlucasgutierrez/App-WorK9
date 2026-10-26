import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { deleteAccount, updateProfile } from "@/app/actions/profile";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { Choice, Field, TextArea } from "@/components/Field";
import { PhotoPicker } from "@/components/market/PhotoPicker";
import { MemberAvatar } from "@/components/MemberAvatar";
import { isAdmin, requireUser } from "@/lib/auth";
import { ACCOUNT_TYPE_HINTS, ACCOUNT_TYPES } from "@/lib/constants";
import { fileUrl } from "@/lib/files";
import { formatMonth } from "@/lib/format";

export const metadata = { title: "Mi perfil" };

export default async function ProfilePage() {
  const user = await requireUser("/perfil");
  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="flex items-center gap-3">
        <MemberAvatar member={user} className="h-14 w-14 text-2xl" />
        <div className="min-w-0">
          <h1 className="h1 truncate">{user.name}</h1>
          <p className="muted">
            {ACCOUNT_TYPES[user.accountType]} · Socio desde {formatMonth(user.createdAt)}
          </p>
        </div>
      </div>
      <Link href={`/socios/${user.id}`} className="btn-secondary w-full">
        👀 Ver mi escaparate público
      </Link>
      {isAdmin(user) && (
        <Link href="/admin" className="btn-secondary w-full border-amber-300 bg-amber-50">
          🛡️ Panel de moderación
        </Link>
      )}

      <ActionForm action={updateProfile} className="card space-y-4">
        <h2 className="h2">Mis datos</h2>
        <Choice label="Soy…" name="accountType" options={Object.entries(ACCOUNT_TYPES)} hints={ACCOUNT_TYPE_HINTS} defaultValue={user.accountType} />
        <Field label="Nombre (o nombre del taller o club)" name="name" defaultValue={user.name} required autoComplete="name" />
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
          <p className="rounded-xl bg-gray-50 px-3 py-2.5 text-gray-700">
            {user.email} {user.emailVerifiedAt ? <span className="text-brand-600">✓ confirmado</span> : <span className="text-amber-700">· sin confirmar</span>}
          </p>
        </div>

        <h2 className="h2 border-t border-gray-100 pt-4">Mi escaparate</h2>
        <p className="muted -mt-2">Lo que verán los demás al pulsar en tu nombre. Ideal si eres profesional, creador o taller.</p>
        <PhotoPicker
          max={1}
          name="avatar"
          removeName="removeAvatar"
          label="Logo o foto"
          existing={user.avatarKey ? [{ id: user.avatarKey, url: fileUrl(user.avatarKey) }] : []}
        />
        <TextArea
          label="Presentación"
          name="bio"
          rows={4}
          maxLength={600}
          defaultValue={user.bio ?? ""}
          placeholder="Quién eres, qué haces, qué fabricas o qué servicios ofreces…"
        />
        <Field label="Tu web (opcional)" name="website" defaultValue={user.website ?? ""} placeholder="miweb.es" inputMode="url" />
        <Field label="Instagram (opcional)" name="instagram" defaultValue={user.instagram ?? ""} placeholder="@tu_cuenta" />
        <SubmitButton>Guardar</SubmitButton>
      </ActionForm>

      <form action={logout}>
        <button className="btn-secondary w-full">Cerrar sesión</button>
      </form>

      <details className="pt-4 text-center">
        <summary className="cursor-pointer list-none text-sm text-gray-500 underline-offset-2 hover:underline">Borrar mi cuenta</summary>
        <ActionForm action={deleteAccount} className="card mt-2 space-y-3 border-red-200 text-left">
          <p className="text-sm text-red-700">
            Se borrarán tu cuenta, todos tus anuncios y sus fotos. <strong>No se puede deshacer.</strong>
          </p>
          <Field label="Escribe BORRAR para confirmar" name="confirm" autoComplete="off" autoCapitalize="characters" required />
          <SubmitButton className="btn-danger w-full" pendingText="Borrando…">
            Borrar mi cuenta para siempre
          </SubmitButton>
        </ActionForm>
      </details>
    </div>
  );
}
