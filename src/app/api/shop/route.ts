import { z } from "zod";
import { isDominoSkin } from "@/lib/dominoSkins";
import { callPlatform } from "@/server/platform";

const requestSchema = z.object({
  action: z.enum(["catalog", "buy", "equip"]),
  token: z.string().max(4096).optional(),
  expectedPrice: z.int().positive().max(2147483647).optional(),
  item: z.custom<string>(isDominoSkin).optional(),
});

export async function POST(request: Request) {
  const body = requestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Requête invalide." }, { status: 400 });
  try {
    const result = await callPlatform("shop", body.data);
    if (result) return Response.json(await result.json(), {
      status: result.status, headers: { "cache-control": "no-store" },
    });
  } catch { /* The local catalogue remains available when the wallet is offline. */ }
  return Response.json({ error: "Portefeuille indisponible." }, { status: 503 });
}
