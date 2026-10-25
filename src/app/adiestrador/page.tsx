import { requireTrainer } from "@/lib/auth";

export default async function TrainerHome() {
  const user = await requireTrainer();
  return (
    <div className="space-y-4">
      <h1 className="h1">Hola, {user.name.split(" ")[0]}</h1>
      <div className="card">
        <p className="muted">Tu código de invitación para clientes</p>
        <p className="text-2xl font-bold tracking-wider text-brand-700">{user.inviteCode}</p>
      </div>
    </div>
  );
}
