import { NextResponse } from "next/server";
import { getProfitDetails } from "@/src/application/pricing/get-profit-details";

const requiredFields = ["mla", "categoryId", "publicationType", "sku", "salePrice"];

export async function POST(request) {
  try {
    const body = await request.json();
    const missing = requiredFields.filter((field) => !body[field]);

    if (missing.length) {
      return NextResponse.json({ message: `Faltan campos: ${missing.join(", ")}` }, { status: 400 });
    }

    const data = await getProfitDetails(body);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: error.status || 502 });
  }
}
