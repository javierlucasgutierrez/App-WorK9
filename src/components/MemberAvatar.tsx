import { fileUrl } from "@/lib/files";

/** Logo o foto del socio; si no tiene, un círculo con su inicial. */
export function MemberAvatar({
  member,
  className = "h-7 w-7 text-sm",
}: {
  member: { name: string; avatarKey?: string | null };
  className?: string;
}) {
  if (member.avatarKey) {
    // eslint-disable-next-line @next/next/no-img-element -- foto de nuestro propio almacenamiento
    return <img src={fileUrl(member.avatarKey)} alt="" className={`shrink-0 rounded-full bg-white object-cover ${className}`} />;
  }
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-jute-200 font-bold text-brand-900 ${className}`}
      aria-hidden
    >
      {member.name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
