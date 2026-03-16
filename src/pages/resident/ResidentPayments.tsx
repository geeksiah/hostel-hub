import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Download, ReceiptText, Wallet } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/EmptyState";
import { FileUploader } from "@/components/shared/FileUploader";
import { PageHeader } from "@/components/shared/PageHeader";
import { SurfacePanel } from "@/components/shared/SurfacePanel";
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
    <div className="container mx-auto max-w-6xl space-y-8 py-6 pb-28 md:space-y-10 md:pb-10">
      <PageHeader title="Payments" description="Payments and receipts." />

      <SurfacePanel className="lg:max-w-xl" title="Upload proof" description="Attach your receipt or transfer proof for any pending payment.">
        <div className="space-y-4">
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
      </SurfacePanel>

      {payments.length ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {payments.map((payment) => (
            <SurfacePanel
              key={payment.id}
              className={highlightedPaymentId === payment.id ? "border-emerald/40 bg-emerald-light/20" : ""}
            >
              <div className="space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      <Wallet className="h-4 w-4" />
                      Payment
                    </div>
                    <h2 className="font-display text-[1.75rem] font-semibold tracking-tight text-foreground">
                      {formatCurrency(payment.amount, currency)}
                    </h2>
                    <p className="text-sm capitalize text-muted-foreground">{payment.method.replace("_", " ")}</p>
                  </div>
                  <StatusBadge status={payment.status} type="payment" />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[16px] bg-muted/35 px-4 py-3.5">
                    <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Reference</p>
                    <p className="mt-2 break-all text-sm font-medium text-foreground">{payment.reference}</p>
                  </div>
                  <div className="rounded-[16px] bg-muted/35 px-4 py-3.5">
                    <p className="inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      <ReceiptText className="h-4 w-4" />
                      Receipt
                    </p>
                    <p className="mt-2 break-words text-sm text-foreground">
                      {getStoredFileName(payment.receiptName, "No receipt uploaded yet")}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  {(payment.status === "completed" || payment.status === "verified") && (
                    <Button
                      variant="emerald"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={async () => {
                        const result = await PaymentService.downloadReceiptPdf(payment.id);
                        triggerDownload(result.data.filename, result.data.content, result.data.mimeType);
                        toast.success("Receipt downloaded.");
                      }}
                    >
                      <Download className="h-4 w-4" />
                      Download receipt
                    </Button>
                  )}
                  {payment.status === "pending" && (
                    <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => toast.info("Pending admin verification.")}>
                      Awaiting verification
                    </Button>
                  )}
                </div>
              </div>
            </SurfacePanel>
          ))}
        </div>
      ) : (
        <EmptyState title="No payments yet" description="Payments and downloadable receipts will appear here after booking." />
      )}
    </div>
  );
}
