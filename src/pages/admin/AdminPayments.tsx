import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Download, Percent, Plus, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ActionMenuSheet } from "@/components/shared/ActionMenuSheet";
import { DatePickerField } from "@/components/shared/DatePickerField";
import { FileUploader } from "@/components/shared/FileUploader";
import { PageHeader } from "@/components/shared/PageHeader";
import { ResponsiveOverlay } from "@/components/shared/ResponsiveOverlay";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { StoredFileList } from "@/components/shared/StoredFileList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApp } from "@/contexts/AppContext";
import { triggerDownload } from "@/lib/download";
import { formatCurrency, getHostelCurrency } from "@/lib/currency";
import { PaymentService, PeriodPricingService } from "@/services";
import type { Payment, PaymentMethod } from "@/types";

const emptyForm = {
  bookingId: "",
  residentId: "",
  method: "bank_transfer" as PaymentMethod,
  amount: 0,
  receiptName: "",
};

const emptyDiscountForm = {
  id: "",
  code: "",
  percentage: 10,
  validUntil: "",
  usageLimit: 20,
  active: true,
};

export default function AdminPayments() {
  const { database, currentUser, session, refreshData } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedPaymentId, setSelectedPaymentId] = useState("");
  const [paymentOverlayOpen, setPaymentOverlayOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [discountForm, setDiscountForm] = useState(emptyDiscountForm);
  const [discountOverlayOpen, setDiscountOverlayOpen] = useState(false);
  const highlightedPaymentId = searchParams.get("payment");
  const activeTab = searchParams.get("tab") ?? "payments";

  useEffect(() => {
    if (highlightedPaymentId) {
      setSelectedPaymentId(highlightedPaymentId);
    }
  }, [highlightedPaymentId]);

  if (!database) return <div className="py-10">Loading payments...</div>;

  const currency = getHostelCurrency(database, session.currentHostelId);
  const paymentConfig = database.tenantPaymentConfigs.find((item) => item.tenantId === currentUser?.tenantId);
  const availableMethods = paymentConfig?.supportedMethods.filter((item) => item.enabled).length
    ? paymentConfig.supportedMethods.filter((item) => item.enabled)
    : [
        { method: "momo", displayLabel: "Mobile money" },
        { method: "card", displayLabel: "Card" },
        { method: "cash", displayLabel: "Cash" },
        { method: "bank_transfer", displayLabel: "Bank transfer" },
      ];

  const payments = database.payments.filter((payment) => {
    if (!payment.bookingId) return true;
    const booking = database.bookings.find((item) => item.id === payment.bookingId);
    return booking?.hostelId === session.currentHostelId;
  });
  const discountCodes = database.discountCodes.filter((code) => code.hostelId === session.currentHostelId);
  const bookings = database.bookings.filter((booking) => booking.hostelId === session.currentHostelId);
  const residents = useMemo(
    () => database.users.filter((user) => user.role === "resident" && user.hostelId === session.currentHostelId),
    [database.users, session.currentHostelId],
  );
  const selectedPayment = payments.find((payment) => payment.id === selectedPaymentId) ?? payments[0];

  const openCreate = () => {
    setForm({
      ...emptyForm,
      bookingId: bookings[0]?.id ?? "",
      residentId: bookings[0]?.residentId ?? residents[0]?.id ?? "",
      method: (availableMethods[0]?.method as PaymentMethod | undefined) ?? emptyForm.method,
      amount: bookings[0]?.amount ?? 0,
    });
    setPaymentOverlayOpen(true);
  };

  const createPayment = async () => {
    if (!form.residentId || !form.amount) return;
    await PaymentService.createPayment({
      bookingId: form.bookingId || undefined,
      residentId: form.residentId,
      amount: form.amount,
      method: form.method,
      receiptName: form.receiptName || undefined,
    });
    await refreshData();
    setPaymentOverlayOpen(false);
    setForm(emptyForm);
    toast.success("Payment record created.");
  };

  const saveDiscount = async () => {
    if (!discountForm.code.trim()) return;
    if (discountForm.id) {
      await PeriodPricingService.updateDiscountCode(discountForm.id, {
        code: discountForm.code.trim().toUpperCase(),
        percentage: discountForm.percentage,
        validUntil: discountForm.validUntil,
        usageLimit: discountForm.usageLimit,
        active: discountForm.active,
      });
      toast.success("Discount updated.");
    } else {
      await PeriodPricingService.createDiscountCode({
        hostelId: session.currentHostelId,
        code: discountForm.code.trim().toUpperCase(),
        percentage: discountForm.percentage,
        validUntil: discountForm.validUntil,
        usageLimit: discountForm.usageLimit,
        active: true,
      });
      toast.success("Discount created.");
    }
    await refreshData();
    setDiscountOverlayOpen(false);
    setDiscountForm(emptyDiscountForm);
  };

  const handleVerify = async (paymentId: string) => {
    await PaymentService.verifyPayment(paymentId, currentUser?.id ?? "u2");
    await refreshData();
    toast.success("Payment verified.");
  };

  const handleDownload = async (paymentId: string) => {
    const result = await PaymentService.downloadReceiptPdf(paymentId);
    triggerDownload(result.data.filename, result.data.content, result.data.mimeType);
    toast.success("Receipt downloaded.");
  };

  const setTab = (value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", value);
    setSearchParams(next);
  };

  const renderPaymentActions = (payment: Payment, residentName: string) => (
    <ActionMenuSheet
      title={payment.reference}
      description="Payment actions"
      onViewDetails={() => setSelectedPaymentId(payment.id)}
      details={
        <>
          <p><span className="text-muted-foreground">Resident:</span> {residentName}</p>
          <p><span className="text-muted-foreground">Method:</span> {payment.method.replace("_", " ")}</p>
        </>
      }
      actions={[
        ...(payment.status === "pending"
          ? [{
              label: "Verify payment",
              icon: <CheckCircle2 className="h-4 w-4" />,
              onSelect: async () => {
                await handleVerify(payment.id);
              },
            }]
          : []),
        {
          label: "Download receipt PDF",
          icon: <Download className="h-4 w-4" />,
          onSelect: async () => {
            await handleDownload(payment.id);
          },
        },
      ]}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Payments, receipts, verification, and discounts."
        actions={
          <div className="flex flex-wrap gap-2">
            {activeTab === "payments" ? (
              <>
                <Link to="/admin/settings?tab=payment">
                  <Button variant="outline" size="sm">Payment setup</Button>
                </Link>
                <Button variant="emerald" size="sm" onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  Record payment
                </Button>
              </>
            ) : (
              <Button
                variant="emerald"
                size="sm"
                onClick={() => {
                  setDiscountForm(emptyDiscountForm);
                  setDiscountOverlayOpen(true);
                }}
              >
                <Tag className="h-4 w-4" />
                Add discount
              </Button>
            )}
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setTab} className="space-y-5">
        <TabsList className="flex h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="discounts">Discounts</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-5">
          {paymentConfig ? (
            <div className="rounded-2xl border bg-card p-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">Provider</p>
                  <p className="font-medium">{paymentConfig.providerDisplayName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="font-medium capitalize">{paymentConfig.status}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Enabled methods</p>
                  <p className="font-medium">{paymentConfig.supportedMethods.filter((item) => item.enabled).map((item) => item.displayLabel).join(", ") || "None"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last test</p>
                  <p className="font-medium">{paymentConfig.lastTestedAt ? paymentConfig.lastTestedAt.slice(0, 10) : "Not tested"}</p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border bg-card p-4">
                  <p className="text-xs text-muted-foreground">Payments</p>
                  <p className="mt-1 font-display text-2xl font-semibold">{payments.length}</p>
                </div>
                <div className="rounded-2xl border bg-card p-4">
                  <p className="text-xs text-muted-foreground">Pending review</p>
                  <p className="mt-1 font-display text-2xl font-semibold">{payments.filter((item) => item.status === "pending").length}</p>
                </div>
                <div className="rounded-2xl border bg-card p-4">
                  <p className="text-xs text-muted-foreground">Captured value</p>
                  <p className="mt-1 font-display text-2xl font-semibold">
                    {formatCurrency(
                      payments
                        .filter((item) => item.status === "completed" || item.status === "verified")
                        .reduce((sum, item) => sum + item.amount, 0),
                      currency,
                    )}
                  </p>
                </div>
              </div>

              <div className="space-y-3 lg:hidden">
                {payments.map((payment) => {
                  const resident = payment.residentId ? database.users.find((user) => user.id === payment.residentId) : undefined;
                  return (
                    <div
                      key={payment.id}
                      onClick={() => setSelectedPaymentId(payment.id)}
                      className={`w-full rounded-2xl border bg-card p-4 text-left ${selectedPayment?.id === payment.id || highlightedPaymentId === payment.id ? "border-emerald/40 bg-emerald-light/30" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-mono text-xs font-medium">{payment.reference}</p>
                          <p className="truncate text-sm text-muted-foreground">{resident?.name ?? "Group booking"}</p>
                        </div>
                        <StatusBadge status={payment.status} type="payment" />
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Method</p>
                          <p className="text-sm font-medium capitalize">{payment.method.replace("_", " ")}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Amount</p>
                          <p className="text-sm font-medium">{formatCurrency(payment.amount, currency)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Created</p>
                          <p className="text-sm font-medium">{payment.createdAt.slice(0, 10)}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {payment.status === "pending" ? (
                          <Button
                            type="button"
                            variant="emerald"
                            size="sm"
                            onClick={async (event) => {
                              event.stopPropagation();
                              await handleVerify(payment.id);
                            }}
                          >
                            Verify
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={async (event) => {
                            event.stopPropagation();
                            await handleDownload(payment.id);
                          }}
                        >
                          Receipt
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hidden overflow-hidden rounded-2xl border bg-card lg:block">
                <Table>
                  <TableHeader className="bg-muted/60">
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Reference</TableHead>
                      <TableHead>Resident</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[72px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => {
                      const resident = payment.residentId ? database.users.find((user) => user.id === payment.residentId) : undefined;
                      const residentName = resident?.name ?? "Group booking";
                      return (
                        <TableRow
                          key={payment.id}
                          className={selectedPayment?.id === payment.id || highlightedPaymentId === payment.id ? "bg-muted/30" : ""}
                          onClick={() => setSelectedPaymentId(payment.id)}
                        >
                          <TableCell>
                            <div>
                              <p className="font-mono text-xs font-medium">{payment.reference}</p>
                              <p className="text-xs text-muted-foreground">{payment.createdAt.slice(0, 10)}</p>
                            </div>
                          </TableCell>
                          <TableCell>{residentName}</TableCell>
                          <TableCell className="capitalize">{payment.method.replace("_", " ")}</TableCell>
                          <TableCell>{formatCurrency(payment.amount, currency)}</TableCell>
                          <TableCell><StatusBadge status={payment.status} type="payment" /></TableCell>
                          <TableCell className="text-right">
                            {renderPaymentActions(payment, residentName)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-5">
              {selectedPayment ? (
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-lg font-semibold">{selectedPayment.reference}</h2>
                      <p className="text-sm text-muted-foreground">{selectedPayment.createdAt.slice(0, 10)}</p>
                    </div>
                    <StatusBadge status={selectedPayment.status} type="payment" />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-muted/60 p-3">
                      <p className="text-xs text-muted-foreground">Amount</p>
                      <p className="font-semibold">{formatCurrency(selectedPayment.amount, currency)}</p>
                    </div>
                    <div className="rounded-xl bg-muted/60 p-3">
                      <p className="text-xs text-muted-foreground">Method</p>
                      <p className="font-semibold capitalize">{selectedPayment.method.replace("_", " ")}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Resident:</span> {database.users.find((user) => user.id === selectedPayment.residentId)?.name ?? "Group booking"}</p>
                    <p><span className="text-muted-foreground">Verified by:</span> {selectedPayment.verifiedBy ?? "-"}</p>
                    <p><span className="text-muted-foreground">Gateway:</span> {selectedPayment.provider ?? "-"}</p>
                    <p><span className="text-muted-foreground">External status:</span> {selectedPayment.externalStatus ?? "-"}</p>
                    <p><span className="text-muted-foreground">Failure reason:</span> {selectedPayment.failureReason ?? "-"}</p>
                  </div>

                  <div>
                    <h3 className="mb-2 font-medium">Uploaded files</h3>
                    <StoredFileList files={[selectedPayment.receiptName]} emptyLabel="No uploaded receipt." />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedPayment.status === "pending" ? (
                      <Button
                        variant="emerald"
                        size="sm"
                        onClick={async () => {
                          await handleVerify(selectedPayment.id);
                        }}
                      >
                        Verify payment
                      </Button>
                    ) : null}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        await handleDownload(selectedPayment.id);
                      }}
                    >
                      Download PDF
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed text-sm text-muted-foreground">
                  Select a payment to view details.
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="discounts" className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border bg-card p-4">
              <p className="text-xs text-muted-foreground">Active codes</p>
              <p className="mt-1 font-display text-2xl font-semibold">{discountCodes.filter((code) => code.active).length}</p>
            </div>
            <div className="rounded-2xl border bg-card p-4">
              <p className="text-xs text-muted-foreground">Total redemptions</p>
              <p className="mt-1 font-display text-2xl font-semibold">{discountCodes.reduce((sum, code) => sum + code.usedCount, 0)}</p>
            </div>
            <div className="rounded-2xl border bg-card p-4">
              <p className="text-xs text-muted-foreground">Largest discount</p>
              <p className="mt-1 font-display text-2xl font-semibold">{Math.max(0, ...discountCodes.map((code) => code.percentage))}%</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border bg-card">
            <div className="border-b px-4 py-3">
              <h2 className="font-display text-lg font-semibold">Discount codes</h2>
              <p className="text-sm text-muted-foreground">Keep promotions inside payments instead of a separate pricing menu.</p>
            </div>
            <Table>
              <TableHeader className="bg-muted/60">
                <TableRow className="hover:bg-transparent">
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Valid until</TableHead>
                  <TableHead className="w-[72px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discountCodes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell className="font-mono font-medium">{code.code}</TableCell>
                    <TableCell>{code.percentage}%</TableCell>
                    <TableCell>{code.usedCount}/{code.usageLimit}</TableCell>
                    <TableCell>{code.validUntil}</TableCell>
                    <TableCell className="text-right">
                      <ActionMenuSheet
                        title={code.code}
                        description="Discount code actions"
                        details={<p><span className="text-muted-foreground">Usage:</span> {code.usedCount}/{code.usageLimit}</p>}
                        actions={[
                          {
                            label: "Edit code",
                            icon: <Percent className="h-4 w-4" />,
                            onSelect: () => {
                              setDiscountForm({
                                id: code.id,
                                code: code.code,
                                percentage: code.percentage,
                                validUntil: code.validUntil,
                                usageLimit: code.usageLimit,
                                active: code.active,
                              });
                              setDiscountOverlayOpen(true);
                            },
                          },
                          {
                            label: code.active ? "Disable code" : "Enable code",
                            onSelect: async () => {
                              await PeriodPricingService.updateDiscountCode(code.id, { active: !code.active });
                              await refreshData();
                              toast.success(code.active ? "Discount disabled." : "Discount enabled.");
                            },
                          },
                          {
                            label: "Delete code",
                            icon: <Trash2 className="h-4 w-4" />,
                            destructive: true,
                            onSelect: async () => {
                              await PeriodPricingService.deleteDiscountCode(code.id);
                              await refreshData();
                              toast.success("Discount deleted.");
                            },
                          },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <ResponsiveOverlay
        open={paymentOverlayOpen}
        onOpenChange={setPaymentOverlayOpen}
        title="Record payment"
        description="Add a payment record."
      >
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Booking</Label>
              <select
                value={form.bookingId}
                onChange={(event) => {
                  const booking = bookings.find((item) => item.id === event.target.value);
                  setForm({
                    ...form,
                    bookingId: event.target.value,
                    residentId: booking?.residentId ?? "",
                    amount: booking?.amount ?? form.amount,
                  });
                }}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="">No linked booking</option>
                {bookings.map((booking) => (
                  <option key={booking.id} value={booking.id}>
                    {booking.id} / {formatCurrency(booking.amount, currency)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Resident</Label>
              <select
                value={form.residentId}
                onChange={(event) => setForm({ ...form, residentId: event.target.value })}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Select resident</option>
                {residents.map((resident) => (
                  <option key={resident.id} value={resident.id}>{resident.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Method</Label>
              <select
                value={form.method}
                onChange={(event) => setForm({ ...form, method: event.target.value as PaymentMethod })}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                {availableMethods.map((item) => (
                  <option key={item.method} value={item.method}>{item.displayLabel}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Amount ({currency})</Label>
              <Input type="number" min={0} value={form.amount} onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })} />
            </div>
          </div>

          <FileUploader
            label="Receipt or proof"
            description="Receipt or proof."
            accept="image/*,.pdf"
            value={form.receiptName}
            onChange={(value) => setForm({ ...form, receiptName: value })}
          />

          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => setPaymentOverlayOpen(false)}>Cancel</Button>
            <Button variant="emerald" onClick={() => void createPayment()}>
              Record payment
            </Button>
          </div>
        </div>
      </ResponsiveOverlay>

      <ResponsiveOverlay
        open={discountOverlayOpen}
        onOpenChange={setDiscountOverlayOpen}
        title={discountForm.id ? "Edit discount code" : "Add discount code"}
        description="Promo code details."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Code</Label>
            <Input value={discountForm.code} onChange={(event) => setDiscountForm({ ...discountForm, code: event.target.value.toUpperCase() })} />
          </div>
          <div className="space-y-2">
            <Label>Discount %</Label>
            <Input type="number" value={discountForm.percentage} onChange={(event) => setDiscountForm({ ...discountForm, percentage: Number(event.target.value) })} />
          </div>
          <div className="space-y-2">
            <DatePickerField label="Valid until" value={discountForm.validUntil} onChange={(value) => setDiscountForm({ ...discountForm, validUntil: value })} />
          </div>
          <div className="space-y-2">
            <Label>Usage limit</Label>
            <Input type="number" value={discountForm.usageLimit} onChange={(event) => setDiscountForm({ ...discountForm, usageLimit: Number(event.target.value) })} />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={() => setDiscountOverlayOpen(false)}>Cancel</Button>
          <Button variant="emerald" onClick={() => void saveDiscount()}>
            Save code
          </Button>
        </div>
      </ResponsiveOverlay>
    </div>
  );
}
