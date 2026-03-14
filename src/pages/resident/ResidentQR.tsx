import { useApp } from '@/contexts/AppContext';
import { QRCodeSVG } from 'qrcode.react';
import { PageHeader } from '@/components/shared/PageHeader';
import { UserCircle } from 'lucide-react';

export default function ResidentQR() {
  const { currentUser } = useApp();

  return (
    <div className="container py-6 space-y-6 max-w-sm mx-auto text-center">
      <PageHeader title="QR Resident ID" />
      <div className="bg-card border rounded-xl p-6 space-y-4">
        <UserCircle className="h-16 w-16 mx-auto text-muted-foreground" />
        <div>
          <h2 className="font-display font-bold text-lg">{currentUser?.name}</h2>
          <p className="text-sm text-muted-foreground">Dreamland Hostel</p>
        </div>
        <div className="flex justify-center">
          <QRCodeSVG
            value={JSON.stringify({ id: currentUser?.id, name: currentUser?.name, hostel: 'Dreamland Hostel' })}
            size={180}
            level="H"
            className="rounded-lg"
          />
        </div>
        <p className="text-xs text-muted-foreground">Show this QR code at the front desk for check-in and verification.</p>
      </div>
    </div>
  );
}
