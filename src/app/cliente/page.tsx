import { requireClient } from "@/lib/auth";

export default async function ClientHome() {
  const user = await requireClient();
  return <h1 className="h1">Hola, {user.name.split(" ")[0]}</h1>;
}
