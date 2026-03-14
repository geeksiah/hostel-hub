import { PageHeader } from '@/components/shared/PageHeader';
import { mockPricingRules, mockDiscountCodes } from '@/services/mock-data';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPricing() {
  return (
    <div className="space-y-6">
      <PageHeader title="Pricing" description="Set room pricing and discount codes" />

      {/* Pricing Table */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-display font-semibold">Room Pricing</h3>
          <Button variant="emerald" size="sm"><Plus className="h-4 w-4 mr-1" /> Add Rule</Button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3 font-medium">Room Type</th>
              <th className="text-left p-3 font-medium">Period</th>
              <th className="text-left p-3 font-medium">Price</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {mockPricingRules.map(p => (
              <tr key={p.id}>
                <td className="p-3 capitalize">{p.roomType}</td>
                <td className="p-3 capitalize">{p.periodType}</td>
                <td className="p-3 font-medium">{p.currency} {p.price.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Discount Codes */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-display font-semibold">Discount Codes</h3>
          <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" /> Create Code</Button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3 font-medium">Code</th>
              <th className="text-left p-3 font-medium">Discount</th>
              <th className="text-left p-3 font-medium">Usage</th>
              <th className="text-left p-3 font-medium">Valid Until</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {mockDiscountCodes.map(d => (
              <tr key={d.id}>
                <td className="p-3 font-mono text-xs font-bold">{d.code}</td>
                <td className="p-3">{d.percentage}%</td>
                <td className="p-3">{d.usedCount}/{d.usageLimit}</td>
                <td className="p-3 text-xs">{d.validUntil}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
