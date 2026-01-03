import { NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";

export async function POST(req: Request) {
  const supabase = supabaseServer();

  // Ambil user login dari session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "User tidak ditemukan / belum login" },
      { status: 401 }
    );
  }

  const { amount, membershipType } = await req.json();

  // 1. Insert transaksi baru
  const { data: transaction, error } = await supabase
    .from("transactions")
    .insert([
      {
        user_id: user.id,
        amount,
        membership_type: membershipType,
        status: "pending",
      },
    ])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // 2. Simulasi sukses bayar → update transaksi
  const { error: updateError } = await supabase
    .from("transactions")
    .update({ status: "success" })
    .eq("id", transaction.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  // 3. Hitung expire date (30 hari dari sekarang)
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1); // +1 bulan

  // 4. Update membership_type + membership_expires_at di profile user
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      membership_type: membershipType,
      membership_expires_at: expiresAt.toISOString(),
    })
    .eq("id", user.id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({
    message: "Transaction successful",
    transaction,
    membership_expires_at: expiresAt.toISOString(),
  });
}
