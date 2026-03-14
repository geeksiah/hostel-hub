import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { mockRooms, mockBlocks } from '@/services/mock-data';
import { Button } from '@/components/ui/button';
import { BedDouble, Plus } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function AdminRooms() {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rooms"
        description="Manage blocks, rooms, and beds"
        actions={
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button variant="emerald" size="sm"><Plus className="h-4 w-4 mr-1" /> Add Room</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add New Room</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-2"><Label>Room Name</Label><Input placeholder="A401" /></div>
                <div className="space-y-2"><Label>Block</Label><Input placeholder="Block A" /></div>
                <div className="space-y-2"><Label>Type</Label><Input placeholder="single / double / triple / quad" /></div>
                <div className="space-y-2"><Label>Capacity</Label><Input type="number" placeholder="2" /></div>
                <div className="space-y-2"><Label>Price (GHS / semester)</Label><Input type="number" placeholder="2800" /></div>
                <Button variant="emerald" className="w-full" onClick={() => { toast.success('Room created'); setShowAdd(false); }}>Create Room</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Blocks */}
      {mockBlocks.filter(b => b.hostelId === 'h1').map(block => {
        const rooms = mockRooms.filter(r => r.blockId === block.id);
        return (
          <div key={block.id} className="space-y-3">
            <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wider">{block.name} · {block.floors} floors</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {rooms.map(room => (
                <div key={room.id} className="bg-card border rounded-lg p-4 space-y-2 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BedDouble className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">Room {room.name}</span>
                    </div>
                    <StatusBadge
                      status={room.status}
                      variant={room.status === 'available' ? 'success' : room.status === 'full' ? 'warning' : 'neutral'}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p className="capitalize">{room.type} · Floor {room.floor}</p>
                    <p>{room.occupancy}/{room.capacity} occupied</p>
                    <p className="font-medium text-foreground">GHS {room.pricePerSemester.toLocaleString()}/sem</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {room.amenities.map(a => (
                      <span key={a} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{a}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
