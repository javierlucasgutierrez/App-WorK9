import { ListingDetail } from "@/components/market/ListingDetail";
import { requireClient } from "@/lib/auth";

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireClient();
  return <ListingDetail userId={user.id} base="/cliente/material" id={(await params).id} />;
}
