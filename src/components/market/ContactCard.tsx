import { whatsappUrl } from "@/lib/format";
import { ACCOUNT_TYPES } from "@/lib/constants";
import { MemberAvatar } from "../MemberAvatar";

type Person = {
  name: string;
  email: string;
  phone: string | null;
  location?: string | null;
  accountType?: string;
  avatarKey?: string | null;
};

/** Datos de contacto con botones para llamar, escribir por WhatsApp o enviar un correo. */
export function ContactCard({ person, subject }: { person: Person; subject?: string }) {
  const wa = person.phone ? whatsappUrl(person.phone) : null;
  const mail = `mailto:${person.email}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`;
  return (
    <div>
      <div className="flex items-center gap-3">
        <MemberAvatar member={person} className="h-10 w-10 text-base" />
        <div className="min-w-0">
          <p className="font-semibold">{person.name}</p>
          <p className="truncate text-sm text-gray-600">
            {[person.accountType && ACCOUNT_TYPES[person.accountType], person.location].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>
      <p className="mt-2 select-all break-all text-sm">✉️ {person.email}</p>
      {person.phone && <p className="select-all text-sm">📞 {person.phone}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {person.phone && (
          <a href={`tel:${person.phone.replace(/\s/g, "")}`} className="btn-secondary flex-1 px-3 text-sm">
            📞 Llamar
          </a>
        )}
        {wa && (
          <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-secondary flex-1 px-3 text-sm">
            💬 WhatsApp
          </a>
        )}
        <a href={mail} className="btn-secondary flex-1 px-3 text-sm">
          ✉️ Correo
        </a>
      </div>
    </div>
  );
}
