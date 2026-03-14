import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';

const accountTypes = [
  { value: 'resident', label: 'Student / Guest', desc: 'Book a room and manage your stay' },
  { value: 'tenant_admin', label: 'Hostel Operator', desc: 'Manage your hostel and residents' },
  { value: 'group_organizer', label: 'Group Organizer', desc: 'Book accommodation for groups' },
] as const;

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [type, setType] = useState<typeof accountTypes[number]['value']>('resident');
  const { login } = useApp();
  const navigate = useNavigate();

  const handleRegister = () => {
    login(type);
    toast.success('Account created successfully!');
    if (type === 'tenant_admin') navigate('/onboarding');
    else if (type === 'group_organizer') navigate('/group-booking');
    else navigate('/resident');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 font-display font-bold text-xl">
            <Building2 className="h-6 w-6 text-emerald" /> HostelHub
          </Link>
          <p className="text-sm text-muted-foreground">Create your account</p>
        </div>

        <div className="bg-card border rounded-xl p-6 space-y-4">
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">I am a...</p>
              {accountTypes.map(t => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${type === t.value ? 'border-emerald bg-emerald-light' : 'hover:bg-muted'}`}
                >
                  <p className="font-medium text-sm">{t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                </button>
              ))}
              <Button variant="emerald" className="w-full" onClick={() => setStep(2)}>Continue</Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="space-y-2"><Label>Full Name</Label><Input placeholder="Kofi Asante" /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="you@example.com" /></div>
              <div className="space-y-2"><Label>Phone</Label><Input placeholder="+233 24 xxx xxxx" /></div>
              <div className="space-y-2"><Label>Password</Label><Input type="password" placeholder="••••••••" /></div>
              <Button variant="emerald" className="w-full" onClick={handleRegister}>Create Account</Button>
              <Button variant="ghost" className="w-full" onClick={() => setStep(1)}>Back</Button>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account? <Link to="/login" className="text-emerald font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
