import { useState } from "react";
import { Pencil, Percent, Plus, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ActionMenuSheet } from "@/components/shared/ActionMenuSheet";
import { DatePickerField } from "@/components/shared/DatePickerField";
import { PageHeader } from "@/components/shared/PageHeader";
import { ResponsiveOverlay } from "@/components/shared/ResponsiveOverlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApp } from "@/contexts/AppContext";
import { PeriodPricingService } from "@/services";

const emptyRule = {
  id: "",
  roomType: "single",
  periodType: "semester",
  durationLabel: "Semester",
  price: 0,
};

const emptyCode = {
  id: "",
  code: "",
  percentage: 10,
  validUntil: "",
  usageLimit: 20,
  active: true,
};

export default function AdminPricing() {
  const { database, session, refreshData } = useApp();
  const [ruleForm, setRuleForm] = useState(emptyRule);
  const [discountForm, setDiscountForm] = useState(emptyCode);
  const [ruleOverlayOpen, setRuleOverlayOpen] = useState(false);
  const [discountOverlayOpen, setDiscountOverlayOpen] = useState(false);

  if (!database) return <div className="py-10">Loading pricing...</div>;

  const rules = database.pricingRules.filter((rule) => rule.hostelId === session.currentHostelId);
  const codes = database.discountCodes.filter((code) => code.hostelId === session.currentHostelId);

  const saveRule = async () => {
    await PeriodPricingService.savePricingRule({
      id: ruleForm.id || undefined,
      hostelId: session.currentHostelId,
      roomType: ruleForm.roomType as "single" | "double" | "triple" | "quad",
      periodType: ruleForm.periodType as "semester" | "year" | "vacation",
      durationLabel: ruleForm.durationLabel,
      price: ruleForm.price,
      currency: "GHS",
    });
    await refreshData();
    setRuleOverlayOpen(false);
    setRuleForm(emptyRule);
    toast.success("Pricing rule saved.");
  };

  const saveCode = async () => {
    if (discountForm.id) {
      await PeriodPricingService.updateDiscountCode(discountForm.id, {
        code: discountForm.code,
        percentage: discountForm.percentage,
        validUntil: discountForm.validUntil,
        usageLimit: discountForm.usageLimit,
        active: discountForm.active,
      });
    } else {
      await PeriodPricingService.createDiscountCode({
        hostelId: session.currentHostelId,
        code: discountForm.code,
        percentage: discountForm.percentage,
        validUntil: discountForm.validUntil,
        usageLimit: discountForm.usageLimit,
        active: true,
      });
    }
    await refreshData();
    setDiscountOverlayOpen(false);
    setDiscountForm(emptyCode);
    toast.success("Discount code saved.");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pricing"
        description="Pricing rules and discounts."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setDiscountOverlayOpen(true)}>
              <Tag className="h-4 w-4" />
              Add discount
            </Button>
            <Button variant="emerald" size="sm" onClick={() => setRuleOverlayOpen(true)}>
              <Plus className="h-4 w-4" />
              Add pricing rule
            </Button>
          </div>
        }
      />

      <div className="space-y-5">
        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="border-b px-4 py-3">
            <h2 className="font-display text-lg font-semibold">Pricing rules</h2>
          </div>
          <Table>
            <TableHeader className="bg-muted/60">
              <TableRow className="hover:bg-transparent">
                <TableHead>Room type</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="w-[72px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="capitalize">{rule.roomType}</TableCell>
                  <TableCell className="capitalize">{rule.periodType}</TableCell>
                  <TableCell>{rule.durationLabel}</TableCell>
                  <TableCell>{rule.currency} {rule.price.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <ActionMenuSheet
                      title={`${rule.roomType} / ${rule.durationLabel}`}
                      description="Pricing rule actions"
                      details={<p><span className="text-muted-foreground">Price:</span> {rule.currency} {rule.price.toLocaleString()}</p>}
                      actions={[
                        {
                          label: "Edit rule",
                          icon: <Pencil className="h-4 w-4" />,
                          onSelect: () => {
                            setRuleForm({
                              id: rule.id,
                              roomType: rule.roomType,
                              periodType: rule.periodType,
                              durationLabel: rule.durationLabel,
                              price: rule.price,
                            });
                            setRuleOverlayOpen(true);
                          },
                        },
                        {
                          label: "Delete rule",
                          icon: <Trash2 className="h-4 w-4" />,
                          destructive: true,
                          onSelect: async () => {
                            await PeriodPricingService.deletePricingRule(rule.id);
                            await refreshData();
                            toast.success("Pricing rule deleted.");
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

        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="border-b px-4 py-3">
            <h2 className="font-display text-lg font-semibold">Discount codes</h2>
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
              {codes.map((code) => (
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
                          label: "Delete code",
                          icon: <Trash2 className="h-4 w-4" />,
                          destructive: true,
                          onSelect: async () => {
                            await PeriodPricingService.deleteDiscountCode(code.id);
                            await refreshData();
                            toast.success("Discount code deleted.");
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
      </div>

      <ResponsiveOverlay
        open={ruleOverlayOpen}
        onOpenChange={setRuleOverlayOpen}
        title={ruleForm.id ? "Edit pricing rule" : "Add pricing rule"}
        description="Pricing by room type and period."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Room type</Label>
            <select
              value={ruleForm.roomType}
              onChange={(event) => setRuleForm({ ...ruleForm, roomType: event.target.value })}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="single">Single</option>
              <option value="double">Double</option>
              <option value="triple">Triple</option>
              <option value="quad">Quad</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Period</Label>
            <select
              value={ruleForm.periodType}
              onChange={(event) => setRuleForm({ ...ruleForm, periodType: event.target.value })}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="semester">Semester</option>
              <option value="year">Academic year</option>
              <option value="vacation">Vacation</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Label</Label>
            <Input value={ruleForm.durationLabel} onChange={(event) => setRuleForm({ ...ruleForm, durationLabel: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Price</Label>
            <Input type="number" value={ruleForm.price} onChange={(event) => setRuleForm({ ...ruleForm, price: Number(event.target.value) })} />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={() => setRuleOverlayOpen(false)}>Cancel</Button>
          <Button variant="emerald" onClick={() => void saveRule()}>
            Save rule
          </Button>
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
          <Button variant="emerald" onClick={() => void saveCode()}>
            Save code
          </Button>
        </div>
      </ResponsiveOverlay>
    </div>
  );
}
