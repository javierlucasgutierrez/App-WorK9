import { MarketList, type MarketFilters } from "@/components/market/MarketList";
import { requireClient } from "@/lib/auth";

export default async function MarketPage({ searchParams }: { searchParams: Promise<MarketFilters> }) {
  const user = await requireClient();
  return <MarketList userId={user.id} base="/cliente/material" filters={await searchParams} />;
}
