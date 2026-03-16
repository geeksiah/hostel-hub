import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { BedDouble, CreditCard, ReceiptText, TrendingUp, TriangleAlert, Users, Wallet } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Grid } from "@/components/shared/Grid";
import { MetricCard } from "@/components/shared/MetricCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { SurfacePanel } from "@/components/shared/SurfacePanel";
import { Button } from "@/components/ui/button";
import { triggerDownload } from "@/lib/download";
import { formatCurrency, getHostelCurrency } from "@/lib/currency";
import { ReportService } from "@/services";
import { useApp } from "@/contexts/AppContext";
import type { Booking, Payment, ReportDataset } from "@/types";

const currencyColumns = new Set(["amount", "grossBilled", "discounts", "collected", "outstanding", "failed"]);

function formatMonthLabel(value: string) {
  const date = new Date(`${value}-01T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function grossAmountForBooking(booking: Booking, database: NonNullable<ReturnType<typeof useApp>["database"]>) {
  if (!booking.discountCode) return booking.amount;
  const discount = database.discountCodes.find(
    (item) => item.hostelId === booking.hostelId && item.code === booking.discountCode?.toUpperCase(),
  );
  if (!discount?.percentage) return booking.amount;
  return Math.round(booking.amount / ((100 - discount.percentage) / 100));
}

function amountFromPayment(payment: Payment, database: NonNullable<ReturnType<typeof useApp>["database"]>) {
  if (!payment.bookingId) return { gross: payment.amount, discount: 0 };
  const booking = database.bookings.find((item) => item.id === payment.bookingId);
  if (!booking) return { gross: payment.amount, discount: 0 };
  const gross = grossAmountForBooking(booking, database);
  return { gross, discount: Math.max(gross - payment.amount, 0) };
}

function renderReportValue(column: string, value: string | number, currency: string) {
  if (typeof value === "number" && currencyColumns.has(column)) {
    return formatCurrency(value, currency);
  }
  if (column === "month" && typeof value === "string") return formatMonthLabel(value);
  if (typeof value === "string" && (column === "method" || column === "channel" || column === "status")) {
    return value.replace(/_/g, " ");
  }
  return value;
}

export default function AdminReports() {
  const { database, session } = useApp();
  const [activeKind, setActiveKind] = useState<ReportDataset["kind"]>("revenue");
  const [dataset, setDataset] = useState<ReportDataset | null>(null);

  const loadReport = async (kind: ReportDataset["kind"]) => {
    const report =
      kind === "occupancy"
        ? await ReportService.getOccupancyReport(session.currentHostelId)
        : kind === "revenue"
          ? await ReportService.getRevenueReport(session.currentHostelId)
          : kind === "payments"
            ? await ReportService.getPaymentReport(session.currentHostelId)
            : await ReportService.getResidentReport(session.currentHostelId);
    setDataset(report.data);
  };

  useEffect(() => {
    void loadReport(activeKind);
  }, [activeKind]);

  if (!database) return <div className="py-10">Loading reports...</div>;

  const currency = getHostelCurrency(database, session.currentHostelId);
  const rooms = database.rooms.filter((room) => room.hostelId === session.currentHostelId);
  const residents = database.users.filter((user) => user.role === "resident" && user.hostelId === session.currentHostelId);
  const payments = database.payments.filter((payment) => {
    if (payment.bookingId) {
      const booking = database.bookings.find((item) => item.id === payment.bookingId);
      return booking?.hostelId === session.currentHostelId;
    }
    if (payment.groupBookingId) {
      const request = database.groupBookings.find((item) => item.id === payment.groupBookingId);
      return request?.hostelId === session.currentHostelId;
    }
    return payment.tenantId === database.hostels.find((hostel) => hostel.id === session.currentHostelId)?.tenantId;
  });

  const totalBeds = rooms.reduce((total, room) => total + room.capacity, 0);
  const occupiedBeds = rooms.reduce((total, room) => total + room.occupancy, 0);

  const revenueSummary = useMemo(() => {
    const monthly = new Map<string, { month: string; collected: number; outstanding: number; leakage: number }>();
    let grossBilled = 0;
    let discounts = 0;
    let collected = 0;
    let outstanding = 0;
    let failed = 0;

    payments.forEach((payment) => {
      const { gross, discount } = amountFromPayment(payment, database);
      const month = payment.createdAt.slice(0, 7);
      const bucket = monthly.get(month) ?? { month, collected: 0, outstanding: 0, leakage: 0 };

      grossBilled += gross;
      discounts += discount;

      if (payment.status === "completed" || payment.status === "verified") {
        collected += payment.amount;
        bucket.collected += payment.amount;
      } else if (payment.status === "pending") {
        outstanding += payment.amount;
        bucket.outstanding += payment.amount;
      } else if (payment.status === "failed") {
        failed += payment.amount;
        bucket.leakage += payment.amount;
      }

      if (discount > 0) {
        bucket.leakage += discount;
      }

      monthly.set(month, bucket);
    });

    const chart = Array.from(monthly.values())
      .sort((left, right) => left.month.localeCompare(right.month))
      .map((row) => ({
        label: formatMonthLabel(row.month),
        collected: row.collected,
        outstanding: row.outstanding,
        leakage: row.leakage,
      }));

    return {
      grossBilled,
      discounts,
      collected,
      outstanding,
      failed,
      netRealized: grossBilled - discounts - outstanding - failed,
      chart,
    };
  }, [database, payments]);

  const paymentSummary = useMemo(
    () => ({
      total: payments.length,
      completed: payments.filter((payment) => payment.status === "completed" || payment.status === "verified").length,
      pending: payments.filter((payment) => payment.status === "pending").length,
      failed: payments.filter((payment) => payment.status === "failed").length,
    }),
    [payments],
  );

  const summaryCards =
    activeKind === "revenue"
      ? [
          { title: "Gross billed", value: formatCurrency(revenueSummary.grossBilled, currency), icon: Wallet, variant: "navy" as const },
          { title: "Collected", value: formatCurrency(revenueSummary.collected, currency), icon: CreditCard, variant: "emerald" as const },
          { title: "Outstanding", value: formatCurrency(revenueSummary.outstanding, currency), icon: ReceiptText },
          { title: "Revenue leakage", value: formatCurrency(revenueSummary.discounts + revenueSummary.failed, currency), icon: TriangleAlert, variant: "amber" as const },
        ]
      : activeKind === "payments"
        ? [
            { title: "Payments", value: paymentSummary.total, icon: ReceiptText },
            { title: "Completed", value: paymentSummary.completed, icon: CreditCard, variant: "emerald" as const },
            { title: "Pending", value: paymentSummary.pending, icon: CreditCard, variant: paymentSummary.pending > 0 ? ("amber" as const) : ("default" as const) },
            { title: "Failed", value: paymentSummary.failed, icon: TriangleAlert },
          ]
        : activeKind === "occupancy"
          ? [
              { title: "Occupancy", value: `${Math.round((occupiedBeds / Math.max(totalBeds, 1)) * 100)}%`, icon: BedDouble, variant: "emerald" as const },
              { title: "Beds occupied", value: occupiedBeds, icon: BedDouble },
              { title: "Beds open", value: totalBeds - occupiedBeds, icon: TrendingUp },
              { title: "Residents", value: residents.length, icon: Users },
            ]
          : [
              { title: "Residents", value: residents.length, icon: Users, variant: "navy" as const },
              { title: "Assigned rooms", value: residents.filter((resident) => resident.hostelId === session.currentHostelId).length, icon: BedDouble },
              { title: "Payments linked", value: payments.filter((payment) => payment.residentId).length, icon: CreditCard },
              { title: "Occupancy", value: `${Math.round((occupiedBeds / Math.max(totalBeds, 1)) * 100)}%`, icon: TrendingUp, variant: "emerald" as const },
            ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Finance, occupancy, residents, and exportable reporting."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant={activeKind === "revenue" ? "emerald" : "outline"} size="sm" onClick={() => setActiveKind("revenue")}>Revenue</Button>
            <Button variant={activeKind === "payments" ? "emerald" : "outline"} size="sm" onClick={() => setActiveKind("payments")}>Payments</Button>
            <Button variant={activeKind === "occupancy" ? "emerald" : "outline"} size="sm" onClick={() => setActiveKind("occupancy")}>Occupancy</Button>
            <Button variant={activeKind === "residents" ? "emerald" : "outline"} size="sm" onClick={() => setActiveKind("residents")}>Residents</Button>
          </div>
        }
      />

      <Grid className="md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <MetricCard key={card.title} title={card.title} value={card.value} icon={card.icon} variant={card.variant} />
        ))}
      </Grid>

      {activeKind === "revenue" ? (
        <Grid className="xl:grid-cols-[1.2fr_0.8fr]">
          <SurfacePanel
            title="Revenue performance"
            description="Collected revenue against outstanding balances and leakage by month."
          >
            <ChartContainer
              config={{
                collected: { label: "Collected", color: "hsl(var(--secondary))" },
                outstanding: { label: "Outstanding", color: "hsl(var(--muted-foreground) / 0.55)" },
                leakage: { label: "Leakage", color: "hsl(var(--accent))" },
              }}
              className="h-[320px] w-full"
            >
              <BarChart data={revenueSummary.chart} barGap={10}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => (
                        <div className="flex min-w-[11rem] items-center justify-between gap-4">
                          <span className="text-muted-foreground">{String(name)}</span>
                          <span className="font-medium text-foreground">{formatCurrency(Number(value), currency)}</span>
                        </div>
                      )}
                    />
                  }
                />
                <Bar dataKey="collected" radius={[8, 8, 0, 0]} fill="var(--color-collected)" />
                <Bar dataKey="outstanding" radius={[8, 8, 0, 0]} fill="var(--color-outstanding)" />
                <Bar dataKey="leakage" radius={[8, 8, 0, 0]} fill="var(--color-leakage)" />
              </BarChart>
            </ChartContainer>
          </SurfacePanel>

          <SurfacePanel
            title="P&L view"
            description="A quick financial read on what has been realized, what is still outstanding, and where revenue is leaking."
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-[18px] border border-border/70 bg-background px-4 py-3">
                <span className="text-sm text-muted-foreground">Gross billed</span>
                <span className="text-sm font-semibold text-foreground">{formatCurrency(revenueSummary.grossBilled, currency)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-[18px] border border-border/70 bg-background px-4 py-3">
                <span className="text-sm text-muted-foreground">Discounts</span>
                <span className="text-sm font-semibold text-foreground">{formatCurrency(revenueSummary.discounts, currency)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-[18px] border border-border/70 bg-background px-4 py-3">
                <span className="text-sm text-muted-foreground">Failed payments</span>
                <span className="text-sm font-semibold text-foreground">{formatCurrency(revenueSummary.failed, currency)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-[18px] border border-border/70 bg-background px-4 py-3">
                <span className="text-sm text-muted-foreground">Outstanding</span>
                <span className="text-sm font-semibold text-foreground">{formatCurrency(revenueSummary.outstanding, currency)}</span>
              </div>
              <div className="rounded-[22px] bg-primary px-5 py-5 text-primary-foreground">
                <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-primary-foreground/65">Net realized</p>
                <p className="mt-2 font-display text-[2rem] font-semibold tracking-tight">
                  {formatCurrency(revenueSummary.netRealized, currency)}
                </p>
                <p className="mt-2 text-sm text-primary-foreground/72">
                  This is the collected value after discounts, pending receipts, and failed attempts are stripped out.
                </p>
              </div>
            </div>
          </SurfacePanel>
        </Grid>
      ) : null}

      <SurfacePanel
        title={dataset?.title ?? "Report preview"}
        description={dataset ? `Generated ${dataset.generatedAt}` : "Loading report data."}
      >
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!dataset}
            onClick={async () => {
              if (!dataset) return;
              const result = await ReportService.exportCsv(dataset);
              triggerDownload(result.data.filename, result.data.content, result.data.mimeType);
              toast.success("CSV exported.");
            }}
          >
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!dataset}
            onClick={async () => {
              if (!dataset) return;
              const result = await ReportService.exportPdf(dataset);
              triggerDownload(result.data.filename, result.data.content, result.data.mimeType);
              toast.success("PDF exported.");
            }}
          >
            Export PDF
          </Button>
        </div>

        {dataset ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/55">
                <tr>
                  {dataset.columns.map((column) => (
                    <th key={column} className="p-3 text-left text-[12px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {dataset.rows.map((row, index) => (
                  <tr key={`${dataset.id}-${index}`}>
                    {dataset.columns.map((column) => (
                      <td key={column} className="p-3">
                        {renderReportValue(column, row[column] as string | number, currency)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </SurfacePanel>
    </div>
  );
}
