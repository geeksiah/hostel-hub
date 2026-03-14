import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Check, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const steps = ['Hostel Details', 'Location & Contact', 'Rules & Policies', 'Complete'];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const next = () => {
    if (currentStep < steps.length - 1) setCurrentStep(s => s + 1);
    else {
      toast.success('Hostel created successfully!');
      navigate('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-display text-2xl font-bold">Setup Your Hostel</h1>
          <p className="text-sm text-muted-foreground">Complete the steps below to get started</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i <= currentStep ? 'bg-emerald text-secondary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && <div className={`w-8 h-0.5 ${i < currentStep ? 'bg-emerald' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-display font-semibold">{steps[currentStep]}</h2>

          {currentStep === 0 && (
            <div className="space-y-3">
              <div className="space-y-2"><Label>Hostel Name</Label><Input placeholder="Dreamland Hostel" /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Describe your hostel..." /></div>
              <div className="space-y-2"><Label>University / Institution</Label><Input placeholder="University of Ghana" /></div>
            </div>
          )}
          {currentStep === 1 && (
            <div className="space-y-3">
              <div className="space-y-2"><Label>Address</Label><Input placeholder="East Legon, Accra" /></div>
              <div className="space-y-2"><Label>Phone</Label><Input placeholder="+233 20 xxx xxxx" /></div>
              <div className="space-y-2"><Label>Email</Label><Input placeholder="info@yourhostel.com" /></div>
            </div>
          )}
          {currentStep === 2 && (
            <div className="space-y-3">
              <div className="space-y-2"><Label>Hostel Rules</Label><Textarea placeholder="One rule per line..." rows={5} /></div>
            </div>
          )}
          {currentStep === 3 && (
            <div className="text-center space-y-3 py-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-light flex items-center justify-center">
                <Check className="h-8 w-8 text-emerald" />
              </div>
              <h3 className="font-display font-bold text-lg">All Set!</h3>
              <p className="text-sm text-muted-foreground">Your hostel is ready. You can now add blocks, rooms, and start accepting bookings.</p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {currentStep > 0 && <Button variant="outline" onClick={() => setCurrentStep(s => s - 1)}>Back</Button>}
            <Button variant="emerald" className="flex-1" onClick={next}>
              {currentStep === steps.length - 1 ? 'Go to Dashboard' : 'Continue'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
