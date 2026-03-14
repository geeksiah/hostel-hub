import { PageHeader } from '@/components/shared/PageHeader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AdminSettings() {
  return (
    <div className="space-y-6 max-w-lg">
      <PageHeader title="Settings" description="Hostel configuration" />

      <div className="bg-card border rounded-lg p-5 space-y-4">
        <h3 className="font-display font-semibold">Hostel Profile</h3>
        <div className="space-y-3">
          <div className="space-y-2"><Label>Hostel Name</Label><Input defaultValue="Dreamland Hostel" /></div>
          <div className="space-y-2"><Label>Email</Label><Input defaultValue="info@dreamland.com" /></div>
          <div className="space-y-2"><Label>Phone</Label><Input defaultValue="+233201234567" /></div>
        </div>
        <Button variant="emerald" onClick={() => toast.success('Settings saved')}>Save Changes</Button>
      </div>
    </div>
  );
}
