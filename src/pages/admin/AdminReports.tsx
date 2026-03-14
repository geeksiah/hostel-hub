import { PageHeader } from '@/components/shared/PageHeader';
import { MetricCard } from '@/components/shared/MetricCard';
import { mockRooms, mockPayments, mockBookings } from '@/services/mock-data';
import { BedDouble, CreditCard, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AdminReports() {
  const totalBeds = mockRooms.reduce((s, r) => s + r.capacity, 0);
  const occupied = mockRooms.reduce((s, r) => s + r.occupancy, 0);
  const revenue = mockPayments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0);
  const totalResidents = new Set(mockBookings.map(b => b.residentId)).size;

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Analytics and export" actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.info('Exporting PDF...')}>Export PDF</Button>
          <Button variant="outline" size="sm" onClick={() => toast.info('Exporting CSV...')}>Export CSV</Button>
        </div>
      } />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Occupancy" value={`${Math.round((occupied / totalBeds) * 100)}%`} icon={BedDouble} variant="emerald" />
        <MetricCard title="Total Revenue" value={`GHS ${revenue.toLocaleString()}`} icon={CreditCard} variant="navy" />
        <MetricCard title="Total Residents" value={totalResidents} icon={Users} />
        <MetricCard title="Avg Revenue/Bed" value={`GHS ${Math.round(revenue / (occupied || 1)).toLocaleString()}`} icon={TrendingUp} />
      </div>

      {/* Simple bar chart placeholder */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="font-display font-semibold mb-4">Monthly Revenue</h3>
        <div className="flex items-end gap-3 h-40">
          {[65, 40, 80, 55, 90, 70].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-emerald rounded-t" style={{ height: `${h}%` }} />
              <span className="text-[10px] text-muted-foreground">{['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
