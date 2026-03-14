import { useApp } from '@/contexts/AppContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function ResidentProfile() {
  const { currentUser, logout } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Signed out');
  };

  return (
    <div className="container py-6 space-y-6 max-w-sm mx-auto">
      <PageHeader title="Profile" />
      <div className="text-center">
        <UserCircle className="h-20 w-20 mx-auto text-muted-foreground" />
        <h2 className="font-display font-bold text-lg mt-2">{currentUser?.name}</h2>
        <p className="text-sm text-muted-foreground">{currentUser?.email}</p>
      </div>
      <div className="bg-card border rounded-lg p-5 space-y-3">
        <div className="space-y-2"><Label>Name</Label><Input defaultValue={currentUser?.name} /></div>
        <div className="space-y-2"><Label>Email</Label><Input defaultValue={currentUser?.email} /></div>
        <div className="space-y-2"><Label>Phone</Label><Input defaultValue={currentUser?.phone} /></div>
        <Button variant="emerald" className="w-full" onClick={() => toast.success('Profile updated')}>Save Changes</Button>
      </div>
      <Button variant="outline" className="w-full" onClick={handleLogout}>
        <LogOut className="h-4 w-4 mr-2" /> Sign Out
      </Button>
    </div>
  );
}
