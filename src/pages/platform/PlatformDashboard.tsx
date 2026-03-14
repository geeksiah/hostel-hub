import { MetricCard } from '@/components/shared/MetricCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { mockTenants } from '@/services/mock-data';
import { Building2, Users, TrendingUp, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function PlatformDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader title="Platform Overview" description="HostelHub Platform Administration" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Tenants" value={mockTenants.length} icon={Building2} variant="navy" />
        <MetricCard title="Active" value={mockTenants.filter(t => t.status === 'active').length} icon={Shield} variant="emerald" />
        <MetricCard title="Total Users" value="1,245" icon={Users} />
        <MetricCard title="Revenue" value="GHS 89K" icon={TrendingUp} trend={{ value: 23, label: 'this month' }} />
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="p-4 border-b"><h3 className="font-display font-semibold">Tenants</h3></div>
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3 font-medium">Name</th>
              <th className="text-left p-3 font-medium">Hostels</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {mockTenants.map(t => (
              <tr key={t.id} className="hover:bg-muted/50">
                <td className="p-3 font-medium">{t.name}</td>
                <td className="p-3">{t.hostels.length}</td>
                <td className="p-3"><StatusBadge status={t.status} variant={t.status === 'active' ? 'success' : t.status === 'pending' ? 'warning' : 'error'} /></td>
                <td className="p-3 flex gap-1">
                  {t.status === 'pending' && <Button variant="emerald" size="sm" onClick={() => toast.success('Tenant activated')}>Activate</Button>}
                  {t.status === 'active' && <Button variant="outline" size="sm" onClick={() => toast.warning('Tenant suspended')}>Suspend</Button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
