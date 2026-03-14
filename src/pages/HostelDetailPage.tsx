import { useParams, Link } from 'react-router-dom';
import { mockHostels, mockRooms, mockBeds } from '@/services/mock-data';
import { MapPin, BedDouble, Wifi, Wind, ChevronLeft, Heart, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RatingStars } from '@/components/shared/RatingStars';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import roomImage from '@/assets/room-single.jpg';
import roomDouble from '@/assets/room-double.jpg';
import { useState } from 'react';
import { toast } from 'sonner';

export default function HostelDetailPage() {
  const { hostelId } = useParams();
  const hostel = mockHostels.find(h => h.id === hostelId);
  const rooms = mockRooms.filter(r => r.hostelId === hostelId);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  if (!hostel) return <div className="container py-12 text-center">Hostel not found</div>;

  const handleBookBed = (bedId: string) => {
    toast.success('Bed reserved! Redirecting to payment...', { duration: 2000 });
  };

  return (
    <div className="container py-4 space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to="/explore" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>
        <Button variant="ghost" size="icon"><Heart className="h-5 w-5" /></Button>
      </div>

      {/* Image */}
      <div className="aspect-video rounded-xl overflow-hidden bg-muted">
        <img src={roomImage} alt={hostel.name} className="w-full h-full object-cover" />
      </div>

      {/* Info */}
      <div className="space-y-3">
        <h1 className="font-display text-2xl font-bold">{hostel.name}</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{hostel.location}</span>
          <RatingStars rating={hostel.rating} />
          <span>{hostel.rating}</span>
        </div>
        <p className="text-sm text-muted-foreground">{hostel.description}</p>
      </div>

      {/* Room Types */}
      <div className="space-y-3">
        <h2 className="font-display font-bold text-lg">Room Types</h2>
        {rooms.map(room => {
          const beds = mockBeds.filter(b => b.roomId === room.id);
          const available = beds.filter(b => b.status === 'available');
          const isExpanded = selectedRoom === room.id;

          return (
            <div key={room.id} className="bg-card border rounded-lg overflow-hidden">
              <button
                onClick={() => setSelectedRoom(isExpanded ? null : room.id)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <BedDouble className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-semibold capitalize">{room.type} Room</p>
                    <p className="text-xs text-muted-foreground">
                      Room {room.name} / {room.capacity} {room.capacity > 1 ? 'persons' : 'person'} / {room.amenities.length > 0 ? room.amenities.slice(0, 2).join(', ') : 'Basic'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald">GHS {room.pricePerSemester.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{available.length} available</p>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-3 space-y-2 animate-slide-up bg-muted/30">
                  <div className="grid grid-cols-2 gap-2">
                    <img src={roomDouble} alt="Room" className="rounded-lg aspect-video object-cover" />
                    <div className="space-y-1">
                      <p className="text-xs font-medium">Amenities</p>
                      {room.amenities.map(a => (
                        <span key={a} className="inline-block text-xs bg-muted px-2 py-0.5 rounded mr-1">{a}</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs font-medium mt-2">Available Beds</p>
                  <div className="flex flex-wrap gap-2">
                    {beds.map(bed => (
                      <Button
                        key={bed.id}
                        variant={bed.status === 'available' ? 'emerald' : 'outline'}
                        size="sm"
                        disabled={bed.status !== 'available'}
                        onClick={() => handleBookBed(bed.id)}
                      >
                        {bed.label} {bed.status !== 'available' && `(${bed.status})`}
                      </Button>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <div>
                      <span className="text-lg font-bold">GHS {room.pricePerSemester.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground ml-1">/semester</span>
                    </div>
                    <Button variant="hero" disabled={available.length === 0}>
                      {available.length > 0 ? 'Book Bed' : 'Full'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Contact */}
      <div className="bg-card border rounded-lg p-4 space-y-2">
        <h3 className="font-display font-semibold">Contact</h3>
        <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" />{hostel.contact.phone}</div>
        <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" />{hostel.contact.email}</div>
      </div>

      {/* Rules */}
      <div className="bg-card border rounded-lg p-4 space-y-2">
        <h3 className="font-display font-semibold">Hostel Rules</h3>
        <ul className="space-y-1">
          {hostel.rules.map((rule, i) => (
            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
              <span className="text-emerald mt-0.5">•</span> {rule}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
