import { useState } from "react";
import { CheckCircle2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ActionMenuSheet } from "@/components/shared/ActionMenuSheet";
import { DatePickerField } from "@/components/shared/DatePickerField";
import { PageHeader } from "@/components/shared/PageHeader";
import { ResponsiveOverlay } from "@/components/shared/ResponsiveOverlay";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApp } from "@/contexts/AppContext";
import { PeriodPricingService } from "@/services";

const emptyForm = {
  id: "",
  name: "",
  type: "semester",
  startDate: "",
  endDate: "",
  isActive: false,
};

export default function AdminPeriods() {
  const { database, session, refreshData } = useApp();
  const [form, setForm] = useState(emptyForm);
  const [overlayOpen, setOverlayOpen] = useState(false);

  if (!database) return <div className="py-10">Loading periods...</div>;

  const periods = database.periods.filter((period) => period.hostelId === session.currentHostelId);

  const openCreate = () => {
    setForm(emptyForm);
    setOverlayOpen(true);
  };

  const openEdit = (periodId: string) => {
    const period = periods.find((item) => item.id === periodId);
    if (!period) return;
    setForm({
      id: period.id,
      name: period.name,
      type: period.type,
      startDate: period.startDate,
      endDate: period.endDate,
      isActive: period.isActive,
    });
    setOverlayOpen(true);
  };

  const savePeriod = async () => {
    if (!form.name.trim()) return;
    if (form.id) {
      await PeriodPricingService.updatePeriod(form.id, {
        name: form.name.trim(),
        type: form.type as "semester" | "year" | "vacation",
        startDate: form.startDate,
        endDate: form.endDate,
        isActive: form.isActive,
      });
      toast.success("Period updated.");
    } else {
      await PeriodPricingService.createPeriod({
        hostelId: session.currentHostelId,
        name: form.name.trim(),
        type: form.type as "semester" | "year" | "vacation",
        startDate: form.startDate,
        endDate: form.endDate,
        isActive: form.isActive,
      });
      toast.success("Period created.");
    }
    await refreshData();
    setOverlayOpen(false);
    setForm(emptyForm);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academic periods"
        description="Create and manage booking periods."
        actions={
          <Button variant="emerald" size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add period
          </Button>
        }
      />

      <div className="overflow-hidden rounded-2xl border bg-card">
        <Table>
          <TableHeader className="bg-muted/60">
            <TableRow className="hover:bg-transparent">
              <TableHead>Period</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[72px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {periods.map((period) => (
              <TableRow key={period.id}>
                <TableCell className="font-medium">{period.name}</TableCell>
                <TableCell className="capitalize">{period.type}</TableCell>
                <TableCell>{period.startDate} to {period.endDate}</TableCell>
                <TableCell>
                  <StatusBadge status={period.isActive ? "active" : "inactive"} variant={period.isActive ? "success" : "neutral"} />
                </TableCell>
                <TableCell className="text-right">
                  <ActionMenuSheet
                    title={period.name}
                    description="Academic period actions"
                    details={
                      <>
                        <p><span className="text-muted-foreground">Type:</span> {period.type}</p>
                        <p><span className="text-muted-foreground">Dates:</span> {period.startDate} to {period.endDate}</p>
                      </>
                    }
                    actions={[
                      {
                        label: "Edit period",
                        icon: <Pencil className="h-4 w-4" />,
                        onSelect: () => openEdit(period.id),
                      },
                      {
                        label: period.isActive ? "Deactivate period" : "Activate period",
                        icon: <CheckCircle2 className="h-4 w-4" />,
                        onSelect: async () => {
                          await PeriodPricingService.updatePeriod(period.id, { isActive: !period.isActive });
                          await refreshData();
                          toast.success(period.isActive ? "Period deactivated." : "Period activated.");
                        },
                      },
                      {
                        label: "Delete period",
                        icon: <Trash2 className="h-4 w-4" />,
                        destructive: true,
                        onSelect: async () => {
                          await PeriodPricingService.deletePeriod(period.id);
                          await refreshData();
                          toast.success("Period deleted.");
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

      <ResponsiveOverlay
        open={overlayOpen}
        onOpenChange={setOverlayOpen}
        title={form.id ? "Edit period" : "Add period"}
        description="Period details."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <select
              value={form.type}
              onChange={(event) => setForm({ ...form, type: event.target.value })}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="semester">Semester</option>
              <option value="year">Academic year</option>
              <option value="vacation">Vacation</option>
            </select>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <DatePickerField label="Start date" value={form.startDate} onChange={(value) => setForm({ ...form, startDate: value })} />
            <DatePickerField label="End date" value={form.endDate} onChange={(value) => setForm({ ...form, endDate: value })} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
            Mark as active
          </label>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => setOverlayOpen(false)}>Cancel</Button>
            <Button variant="emerald" onClick={() => void savePeriod()}>
              {form.id ? "Save period" : "Create period"}
            </Button>
          </div>
        </div>
      </ResponsiveOverlay>
    </div>
  );
}
