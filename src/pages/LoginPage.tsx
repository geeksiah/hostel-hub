import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';
import type { UserRole } from '@/types';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useApp();
  const navigate = useNavigate();

  const quickLogin = (role: UserRole) => {
    login(role);
    toast.success(`Logged in as ${role.replace('_', ' ')}`);
    if (role === 'platform_owner') navigate('/platform');
    else if (role === 'tenant_admin') navigate('/admin');
    else if (role === 'group_organizer') navigate('/group-booking');
    else navigate('/resident');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 font-display font-bold text-xl">
            <Building2 className="h-6 w-6 text-emerald" /> HostelHub
          </Link>
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </div>
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <Button variant="emerald" className="w-full" onClick={() => quickLogin('resident')}>Sign In</Button>
        </div>

        {/* Quick role login for prototype */}
        <div className="bg-amber-light border border-amber/20 rounded-xl p-4 space-y-3">
          <p className="text-xs font-medium text-center">🧪 Prototype Quick Login</p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => quickLogin('platform_owner')}>Platform Owner</Button>
            <Button variant="outline" size="sm" onClick={() => quickLogin('tenant_admin')}>Hostel Admin</Button>
            <Button variant="outline" size="sm" onClick={() => quickLogin('resident')}>Resident</Button>
            <Button variant="outline" size="sm" onClick={() => quickLogin('group_organizer')}>Group Organizer</Button>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account? <Link to="/register" className="text-emerald font-medium">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
