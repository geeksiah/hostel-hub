import { useState } from 'react';
import { Link } from 'react-router-dom';
import { mockHostels, mockRooms } from '@/services/mock-data';
import { MapPin, Search, SlidersHorizontal, BedDouble } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RatingStars } from '@/components/shared/RatingStars';
import { StatusBadge } from '@/components/shared/StatusBadge';
import roomImage from '@/assets/room-single.jpg';
import roomDouble from '@/assets/room-double.jpg';

const universities = ['All Universities', 'University of Ghana', 'KNUST', 'UCC'];
const roomTypes = ['All Types', 'single', 'double', 'triple', 'quad'];

export default function ExplorePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUni, setSelectedUni] = useState('All Universities');
  const [selectedType, setSelectedType] = useState('All Types');

  const filtered = mockHostels.filter(h =>
    (selectedUni === 'All Universities' || h.university === selectedUni) &&
    h.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container py-6 space-y-6">
      {/* Search */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search hostels..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {universities.map(u => (
            <Button key={u} variant={selectedUni === u ? 'default' : 'outline'} size="sm" onClick={() => setSelectedUni(u)} className="whitespace-nowrap">
              {u}
            </Button>
          ))}
        </div>
      </div>

      {/* Hostel Cards */}
      <div className="space-y-4">
        {filtered.map(hostel => {
          const rooms = mockRooms.filter(r => r.hostelId === hostel.id);
          return (
            <Link key={hostel.id} to={`/explore/${hostel.id}`} className="block">
              <div className="bg-card rounded-xl border overflow-hidden animate-slide-up">
                <div className="aspect-[16/9] sm:aspect-[21/9] bg-muted overflow-hidden relative">
                  <img src={hostel.id === 'h1' ? roomImage : roomDouble} alt={hostel.name} className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 right-2">
                    <span className="bg-primary/80 text-primary-foreground text-xs px-2 py-1 rounded-md font-medium">
                      {hostel.totalBeds} beds
                    </span>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display font-bold text-lg">{hostel.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <MapPin className="h-3 w-3" /> {hostel.university}
                      </div>
                    </div>
                    <RatingStars rating={hostel.rating} />
                  </div>
                  {/* Room types */}
                  <div className="space-y-1.5 pt-1">
                    {rooms.slice(0, 2).map(room => (
                      <div key={room.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <BedDouble className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="capitalize">{room.type} Room</span>
                        </div>
                        <span className="font-bold text-emerald">GHS {room.pricePerSemester.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs text-muted-foreground">{hostel.availableBeds} available</span>
                    <Button variant="emerald" size="sm">Book Bed</Button>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
