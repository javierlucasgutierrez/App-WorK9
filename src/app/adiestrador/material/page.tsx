import { MarketList, type MarketFilters } from "@/components/market/MarketList";
import { requireTrainer } from "@/lib/auth";

export default async function MarketPage({ searchParams }: { searchParams: Promise<MarketFilters> }) {
  const user = await requireTrainer();
  return <MarketList userId={user.id} base="/adiestrador/material" filters={await searchParams} />;
}
