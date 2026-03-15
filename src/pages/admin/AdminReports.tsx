import { useState } from "react";
import { toast } from "sonner";
import { BedDouble, CreditCard, TrendingUp, Users } from "lucide-react";
import { MetricCard } from "@/components/shared/MetricCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { triggerDownload } from "@/lib/download";
import { formatCurrency, getHostelCurrency } from "@/lib/currency";
import { ReportService } from "@/services";
import { useApp } from "@/contexts/AppContext";
import type { ReportDataset } from "@/types";

export default function AdminReports() {
  const { database, session } = useApp();
  const [dataset, setDataset] = useState<ReportDataset | null>(null);

  if (!database) return <div className="py-10">Loading reports...</div>;

  const rooms = database.rooms.filter((room) => room.hostelId === session.currentHostelId);
  const totalBeds = rooms.reduce((total, room) => total + room.capacity, 0);
  const occupiedBeds = rooms.reduce((total, room) => total + room.occupancy, 0);
  const payments = database.payments.filter((payment) => {
    if (!payment.bookingId) return false;
    const booking = database.bookings.find((item) => item.id === payment.bookingId);
    return booking?.hostelId === session.currentHostelId;
  });
  const revenue = payments
    .filter((payment) => payment.status === "completed" || payment.status === "verified")
    .reduce((total, payment) => total + payment.amount, 0);
  const residents = database.users.filter((user) => user.role === "resident" && user.hostelId === session.currentHostelId);
  const currency = getHostelCurrency(database, session.currentHostelId);

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="View and export reports."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => void loadReport("occupancy")}>Occupancy</Button>
            <Button variant="outline" size="sm" onClick={() => void loadReport("revenue")}>Revenue</Button>
            <Button variant="outline" size="sm" onClick={() => void loadReport("payments")}>Payments</Button>
            <Button variant="outline" size="sm" onClick={() => void loadReport("residents")}>Residents</Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Occupancy" value={`${Math.round((occupiedBeds / Math.max(totalBeds, 1)) * 100)}%`} icon={BedDouble} variant="emerald" />
        <MetricCard title="Revenue" value={formatCurrency(revenue, currency)} icon={CreditCard} variant="navy" />
        <MetricCard title="Residents" value={residents.length} icon={Users} />
        <MetricCard title="Average bed value" value={formatCurrency(Math.round(revenue / Math.max(occupiedBeds, 1)), currency)} icon={TrendingUp} />
      </div>

      <div className="rounded-lg border bg-card p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">{dataset?.title ?? "Choose a report"}</h2>
            <p className="text-sm text-muted-foreground">{dataset ? `Generated ${dataset.generatedAt}` : "Select a report to preview."}</p>
          </div>
          {dataset && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
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
                onClick={async () => {
                  const result = await ReportService.exportPdf(dataset);
                  triggerDownload(result.data.filename, result.data.content, result.data.mimeType);
                  toast.success("PDF exported.");
                }}
              >
                Export PDF
              </Button>
            </div>
          )}
        </div>

        {dataset && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  {dataset.columns.map((column) => (
                    <th key={column} className="p-3 text-left font-medium">{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {dataset.rows.map((row, index) => (
                  <tr key={`${dataset.id}-${index}`}>
                    {dataset.columns.map((column) => (
                      <td key={column} className="p-3">{row[column] as string | number}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
