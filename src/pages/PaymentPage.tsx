import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Smartphone, Building, Banknote, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Method = 'momo' | 'card' | 'bank_transfer' | 'cash';
const methods: { value: Method; label: string; icon: React.ElementType; desc: string }[] = [
  { value: 'momo', label: 'Mobile Money', icon: Smartphone, desc: 'MTN, Vodafone, AirtelTigo' },
  { value: 'card', label: 'Card', icon: CreditCard, desc: 'Visa, Mastercard' },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: Building, desc: 'Direct bank payment' },
  { value: 'cash', label: 'Cash', icon: Banknote, desc: 'Pay at front desk' },
];

export default function PaymentPage() {
  const [method, setMethod] = useState<Method>('momo');
  const [step, setStep] = useState<'select' | 'details' | 'success'>('select');
  const navigate = useNavigate();

  const handlePay = () => {
    toast.success('Payment successful!');
    setStep('success');
  };

  return (
    <div className="container py-6 space-y-6 max-w-sm mx-auto">
      <PageHeader title="Payment" description="Complete your booking payment" />

      {step === 'select' && (
        <div className="space-y-3">
          <div className="bg-card border rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground">Amount Due</p>
            <p className="font-display text-3xl font-bold">GHS 3,500</p>
            <p className="text-xs text-muted-foreground">Room A302 · Semester 1</p>
          </div>

          <p className="text-sm font-medium">Payment Method</p>
          {methods.map(m => (
            <button
              key={m.value}
              onClick={() => setMethod(m.value)}
              className={cn('w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors', method === m.value ? 'border-emerald bg-emerald-light' : 'hover:bg-muted')}
            >
              <m.icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{m.label}</p>
                <p className="text-xs text-muted-foreground">{m.desc}</p>
              </div>
            </button>
          ))}
          <Button variant="hero" className="w-full" onClick={() => setStep('details')}>Continue</Button>
        </div>
      )}

      {step === 'details' && (
        <div className="space-y-4">
          {method === 'momo' && (
            <div className="space-y-3">
              <div className="space-y-2"><Label>MoMo Number</Label><Input placeholder="024 xxx xxxx" /></div>
              <div className="space-y-2"><Label>Network</Label><Input placeholder="MTN / Vodafone / AirtelTigo" /></div>
            </div>
          )}
          {method === 'card' && (
            <div className="space-y-3">
              <div className="space-y-2"><Label>Card Number</Label><Input placeholder="4242 4242 4242 4242" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Expiry</Label><Input placeholder="MM/YY" /></div>
                <div className="space-y-2"><Label>CVV</Label><Input placeholder="123" /></div>
              </div>
            </div>
          )}
          {(method === 'bank_transfer' || method === 'cash') && (
            <div className="bg-amber-light border border-amber/20 rounded-lg p-4 text-sm">
              <p className="font-medium">Instructions</p>
              <p className="text-xs text-muted-foreground mt-1">
                {method === 'bank_transfer' ? 'Transfer to: Dreamland Hostels Ltd, GCB Bank, Acc: 1234567890. Use booking ref as reference.' : 'Visit the front desk with your booking reference to make cash payment.'}
              </p>
            </div>
          )}
          <Button variant="hero" className="w-full" onClick={handlePay}>Confirm Payment</Button>
          <Button variant="ghost" className="w-full" onClick={() => setStep('select')}>Back</Button>
        </div>
      )}

      {step === 'success' && (
        <div className="text-center space-y-4 py-8">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-light flex items-center justify-center">
            <Check className="h-8 w-8 text-emerald" />
          </div>
          <h2 className="font-display font-bold text-xl">Payment Successful!</h2>
          <p className="text-sm text-muted-foreground">Your booking has been confirmed. You'll receive a confirmation via SMS and email.</p>
          <div className="flex flex-col gap-2">
            <Button variant="emerald" onClick={() => navigate('/resident')}>Go to Dashboard</Button>
            <Button variant="outline" onClick={() => toast.info('Downloading receipt...')}>Download Receipt</Button>
          </div>
        </div>
      )}
    </div>
  );
}
