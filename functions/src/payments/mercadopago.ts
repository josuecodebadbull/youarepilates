import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";

import { adminDb, Timestamp } from "../lib/admin";
import type { PassStatus } from "../lib/types";

const mercadoPagoAccessToken = defineSecret("MERCADOPAGO_ACCESS_TOKEN");

interface PendingPurchaseDoc {
  tenantId: string;
  studentId: string;
  packageId: string;
  creditAmount: number;
  validityDays: number;
  status: "pending" | "paid" | "failed";
}

interface MercadoPagoPayment {
  id: number;
  status: string;
  external_reference: string | null;
}

/**
 * Webhook receiver for Mercado Pago payment notifications (package purchases from the
 * student PWA). This is deliberately a scaffold, not a finished integration:
 *
 *   TODO: validate the `x-signature` / `x-request-id` headers against the webhook
 *         secret (see MP docs) before trusting the payload — currently unverified.
 *   TODO: the checkout flow that creates the MP Preference (with
 *         `external_reference = "<purchaseIntentId>"`) and the corresponding
 *         `purchaseIntents/{id}` pending doc still needs to be built (Fase 4/5).
 *
 * What IS real here: idempotent handling (a payment id already marked "paid" is a
 * no-op on retry) and the actual studentPass creation once a payment is approved.
 */
export const mercadopagoWebhook = onRequest(
  { secrets: [mercadoPagoAccessToken] },
  async (req, res) => {
    const paymentId = req.query["data.id"] ?? req.body?.data?.id;
    if (!paymentId) {
      res.status(200).send("ignored: no payment id");
      return;
    }

    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${mercadoPagoAccessToken.value()}` },
    });

    if (!paymentResponse.ok) {
      res.status(200).send("ignored: could not fetch payment");
      return;
    }

    const payment = (await paymentResponse.json()) as MercadoPagoPayment;
    if (payment.status !== "approved" || !payment.external_reference) {
      res.status(200).send("ignored: not approved yet");
      return;
    }

    const purchaseRef = adminDb.collection("purchaseIntents").doc(payment.external_reference);

    await adminDb.runTransaction(async (tx) => {
      const purchaseSnap = await tx.get(purchaseRef);
      if (!purchaseSnap.exists) return;

      const purchase = purchaseSnap.data() as PendingPurchaseDoc;
      if (purchase.status === "paid") return; // already processed, webhook retry

      const tenantRef = adminDb.collection("tenants").doc(purchase.tenantId);
      const passRef = tenantRef.collection("studentPasses").doc();
      const expiresAt = Timestamp.fromMillis(
        Date.now() + purchase.validityDays * 24 * 60 * 60 * 1000,
      );

      tx.set(passRef, {
        studentId: purchase.studentId,
        packageId: purchase.packageId,
        initialCredits: purchase.creditAmount,
        remainingCredits: purchase.creditAmount,
        expiresAt,
        status: "active" satisfies PassStatus,
      });

      tx.update(purchaseRef, { status: "paid" });
    });

    res.status(200).send("ok");
  },
);
