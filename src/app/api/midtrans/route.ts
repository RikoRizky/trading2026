import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
const midtransClient = require("midtrans-client");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = createServerClient();

    // 🔐 Cek user login dari Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🔑 Ambil Server Key dari environment
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      return NextResponse.json({ error: "MIDTRANS_SERVER_KEY not found" }, { status: 500 });
    }

    // Pastikan environment sandbox (jangan production dulu)
    const isProduction = false;

    // 🧩 Inisialisasi Midtrans
    const snap = new midtransClient.Snap({
      isProduction,
      serverKey: serverKey.trim(),
    });

    // 🔧 Buat order ID unik
    const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 🧾 Parameter transaksi
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: Number(body.amount),
      },
      customer_details: {
        first_name: body.name || "Guest",
        email: body.email || "guest@example.com",
      },
      item_details: [
        {
          id: body.plan,
          price: Number(body.amount),
          quantity: 1,
          name: body.description || "Premium Plan",
        },
      ],
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/payment/pending`,
        error: `${process.env.NEXT_PUBLIC_APP_URL}/payment/error`,
      },
    };

    // 💰 Buat transaksi di Midtrans
    const transaction = await snap.createTransaction(parameter);

    // 🗃️ Simpan ke database Supabase
    const { error: insertError } = await supabase.from("payments").insert({
      id: orderId,
      user_id: user.id,
      amount: Number(body.amount),
      description: body.description || "Premium Plan",
      status: "pending",
      payment_method: "midtrans",
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error("Error storing payment:", insertError);
      return NextResponse.json({ error: "Failed to store payment" }, { status: 500 });
    }

    // ✅ Kirim token ke frontend
    return NextResponse.json({
      token: transaction.token,
      orderId: orderId,
    });
  } catch (error: any) {
    console.error("Midtrans Error:", error);
    const message =
      error?.ApiResponse?.error_messages?.[0] ||
      error?.message ||
      "Unknown error";
    const status = error?.httpStatusCode === 401 ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
