import { ListingDetail } from "@/components/market/ListingDetail";
import { requireTrainer } from "@/lib/auth";

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireTrainer();
  return <ListingDetail userId={user.id} base="/adiestrador/material" id={(await params).id} />;
}
