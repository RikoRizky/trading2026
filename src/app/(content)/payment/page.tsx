"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

export default function PaymentPage() {
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "success" | "failed">("pending");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const selectedPlan = searchParams.get("plan");

  const plans = {
    "1month": { name: "1 Month", duration: "30 days", price: 50000 },
    "3months": { name: "3 Months", duration: "90 days", price: 120000 },
    "1year": { name: "1 Year", duration: "365 days", price: 400000 },
  };

  useEffect(() => {
    // Load Snap script (only on browser)
    const midtransScriptUrl = "https://app.sandbox.midtrans.com/snap/snap.js";
    const scriptTag = document.createElement("script");
    scriptTag.src = midtransScriptUrl;
    scriptTag.setAttribute("data-client-key", process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY!);
    document.body.appendChild(scriptTag);

    return () => {
      document.body.removeChild(scriptTag);
    };
  }, []);

  const handlePay = async () => {
    if (!selectedPlan || !user) return;
    setLoading(true);
    try {
      const currentPlan = plans[selectedPlan as keyof typeof plans];
      const res = await fetch("/api/midtrans/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: currentPlan.price,
          plan: selectedPlan,
          name: user.user_metadata?.name || user.email,
          email: user.email,
          description: `Upgrade Premium - ${currentPlan.name}`,
        }),
      });

      const data = await res.json();

      if (data.token) {
        // Pastikan Snap sudah dimuat
        if (typeof window !== "undefined" && (window as any).snap) {
          (window as any).snap.pay(data.token, {
            onSuccess: function (result: any) {
              console.log("Payment success:", result);
              setPaymentStatus("success");
              setTimeout(() => router.push("/dashboard"), 3000);
            },
            onPending: function (result: any) {
              console.log("Waiting for payment:", result);
            },
            onError: function (result: any) {
              console.error("Payment failed:", result);
              setPaymentStatus("failed");
            },
            onClose: function () {
              alert("Payment popup closed without finishing transaction");
            },
          });
        } else {
          alert("Midtrans not loaded yet. Please wait a moment...");
        }
      } else {
        alert("Failed to create transaction");
      }
    } catch (err) {
      console.error("Payment error:", err);
      setPaymentStatus("failed");
    } finally {
      setLoading(false);
    }
  };

  const currentPlan = selectedPlan ? plans[selectedPlan as keyof typeof plans] : null;

  if (!currentPlan) return <p className="text-center mt-20">Invalid Plan</p>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow-lg p-10 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Checkout Premium Plan</h1>
        <p className="text-gray-600 mb-4">
          {currentPlan.name} — Rp {currentPlan.price.toLocaleString()}
        </p>

        {paymentStatus === "success" ? (
          <div className="text-center text-green-600">
            <CheckCircleIcon className="h-16 w-16 mx-auto mb-2" />
            <p className="text-lg font-semibold">Payment Successful!</p>
            <p className="text-gray-500 text-sm">Redirecting to dashboard...</p>
          </div>
        ) : paymentStatus === "failed" ? (
          <div className="text-center text-red-600">
            <XCircleIcon className="h-16 w-16 mx-auto mb-2" />
            <p className="text-lg font-semibold">Payment Failed</p>
            <button
              onClick={handlePay}
              className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition"
            >
              Try Again
            </button>
          </div>
        ) : (
          <button
            onClick={handlePay}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg transition w-full"
          >
            {loading ? "Processing..." : "Pay Now"}
          </button>
        )}
      </div>
    </div>
  );
}
