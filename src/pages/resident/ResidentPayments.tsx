import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { FileUploader } from "@/components/shared/FileUploader";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { triggerDownload } from "@/lib/download";
import { formatCurrency, getUserCurrency } from "@/lib/currency";
import { getStoredFileName } from "@/lib/files";
import { PaymentService } from "@/services";
import { useApp } from "@/contexts/AppContext";

export default function ResidentPayments() {
  const { database, currentUser, refreshData } = useApp();
  const [searchParams] = useSearchParams();
  const [receiptName, setReceiptName] = useState("");

  if (!database || !currentUser) return <div className="container py-10">Loading payments...</div>;

  const payments = database.payments.filter((payment) => payment.residentId === currentUser.id);
  const currency = getUserCurrency(database, currentUser.id);
  const highlightedPaymentId = searchParams.get("payment");

  return (
    <div className="container mx-auto max-w-6xl space-y-6 py-6">
      <PageHeader title="Payments" description="Payments and receipts." />

      <div className="rounded-lg border bg-card p-5 lg:max-w-xl">
        <h2 className="font-display text-lg font-semibold">Upload proof</h2>
        <div className="mt-4 space-y-3">
          <FileUploader
            label="Receipt or transfer proof"
            description="PDF or image."
            accept=".pdf,image/*"
            value={receiptName}
            onChange={(nextValue) => setReceiptName(nextValue)}
          />
          <Button
            variant="outline"
            className="w-full"
            onClick={async () => {
              const pending = payments.find((payment) => payment.status === "pending");
              if (!pending) {
                toast.info("No pending payments found.");
                return;
              }
              await PaymentService.uploadOfflineReceipt(pending.id, receiptName);
              await refreshData();
              toast.success("Receipt proof updated.");
            }}
          >
            Save receipt proof
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {payments.map((payment) => (
          <div key={payment.id} className={`rounded-lg border bg-card p-4 ${highlightedPaymentId === payment.id ? "border-emerald/40 bg-emerald-light/30" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-display text-lg font-semibold">{formatCurrency(payment.amount, currency)}</h2>
                <p className="truncate text-sm capitalize text-muted-foreground">{payment.method.replace("_", " ")} / {payment.reference}</p>
              </div>
              <StatusBadge status={payment.status} type="payment" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Receipt: {getStoredFileName(payment.receiptName, "No receipt uploaded yet")}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(payment.status === "completed" || payment.status === "verified") && (
                <Button
                  variant="emerald"
                  size="sm"
                  onClick={async () => {
                    const result = await PaymentService.downloadReceiptPdf(payment.id);
                    triggerDownload(result.data.filename, result.data.content, result.data.mimeType);
                    toast.success("Receipt downloaded.");
                  }}
                >
                  Download receipt
                </Button>
              )}
              {payment.status === "pending" && (
                <Button variant="outline" size="sm" onClick={() => toast.info("Pending admin verification.")}>
                  Awaiting verification
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
