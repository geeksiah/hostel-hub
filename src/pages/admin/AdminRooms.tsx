import { useMemo, useState } from "react";
import { BedDouble, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ActionMenuSheet } from "@/components/shared/ActionMenuSheet";
import { FileUploader } from "@/components/shared/FileUploader";
import { PageHeader } from "@/components/shared/PageHeader";
import { ResponsiveOverlay } from "@/components/shared/ResponsiveOverlay";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { StoredFileList } from "@/components/shared/StoredFileList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApp } from "@/contexts/AppContext";
import { formatCurrency, getHostelCurrency } from "@/lib/currency";
import { resolveRoomGallery } from "@/lib/media";
import { BedService, HostelService } from "@/services";
import { getRoomPeriodRates, getRoomStartingPrice } from "@/services/store";
import type { BedStatus } from "@/types";

type RoomRateDraft = {
  periodId: string;
  price: number;
  active: boolean;
};

const emptyBlockForm = { id: "", name: "", floors: 1 };

const createDefaultRoomRates = (
  periods: Array<{ id: string; type: "semester" | "year" | "vacation"; isActive: boolean }>,
): RoomRateDraft[] =>
  periods.map((period) => ({
    periodId: period.id,
    active: period.isActive,
    price: period.type === "year" ? 5000 : period.type === "vacation" ? 4050 : 2500,
  }));

const emptyRoomForm = {
  id: "",
  blockId: "",
  name: "",
  type: "double",
  capacity: 2,
  floor: 1,
  genderPolicy: "mixed",
  amenities: "WiFi, Desk",
  images: [] as string[],
  periodRates: [] as RoomRateDraft[],
};

const emptyBedForm = { id: "", roomId: "", label: "", status: "available" as BedStatus };

export default function AdminRooms() {
  const { database, session, refreshData } = useApp();
  const [blockForm, setBlockForm] = useState(emptyBlockForm);
  const [roomForm, setRoomForm] = useState(emptyRoomForm);
  const [bedForm, setBedForm] = useState(emptyBedForm);
  const [blockOverlayOpen, setBlockOverlayOpen] = useState(false);
  const [roomOverlayOpen, setRoomOverlayOpen] = useState(false);
  const [bedOverlayOpen, setBedOverlayOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState("");

  const workspace = useMemo(() => {
    if (!database) return null;
    const blocks = database.blocks.filter((block) => block.hostelId === session.currentHostelId);
    const rooms = database.rooms.filter((room) => room.hostelId === session.currentHostelId);
    const periods = database.periods.filter((period) => period.hostelId === session.currentHostelId);
    return { blocks, rooms, periods };
  }, [database, session.currentHostelId]);

  const selectedRoom = workspace?.rooms.find((room) => room.id === selectedRoomId) ?? workspace?.rooms[0];
  const selectedRoomBeds = selectedRoom ? database?.beds.filter((bed) => bed.roomId === selectedRoom.id) ?? [] : [];

  if (!database || !workspace) return <div className="py-10">Loading rooms...</div>;
  const currency = getHostelCurrency(database, session.currentHostelId);

  const buildRoomRateDrafts = (roomId?: string) =>
    workspace.periods.map((period) => {
      const existing = roomId ? getRoomPeriodRates(database, roomId).find((rate) => rate.periodId === period.id) : undefined;
      return {
        periodId: period.id,
        active: existing?.active ?? period.isActive,
        price: existing?.price ?? (period.type === "year" ? 5000 : period.type === "vacation" ? 4050 : 2500),
      };
    });

  const openCreateBlock = () => {
    setBlockForm(emptyBlockForm);
    setBlockOverlayOpen(true);
  };

  const openEditBlock = (blockId: string) => {
    const block = workspace.blocks.find((item) => item.id === blockId);
    if (!block) return;
    setBlockForm({ id: block.id, name: block.name, floors: block.floors });
    setBlockOverlayOpen(true);
  };

  const saveBlock = async () => {
    if (!blockForm.name.trim()) return;
    if (blockForm.id) {
      await HostelService.updateBlock(blockForm.id, { name: blockForm.name.trim(), floors: blockForm.floors });
      toast.success("Block updated.");
    } else {
      await HostelService.createBlock({ hostelId: session.currentHostelId, name: blockForm.name.trim(), floors: blockForm.floors });
      toast.success("Block created.");
    }
    await refreshData();
    setBlockOverlayOpen(false);
    setBlockForm(emptyBlockForm);
  };

  const openCreateRoom = () => {
    setRoomForm({
      ...emptyRoomForm,
      blockId: workspace.blocks[0]?.id ?? "",
      periodRates: createDefaultRoomRates(workspace.periods),
    });
    setRoomOverlayOpen(true);
  };

  const openEditRoom = (roomId: string) => {
    const room = workspace.rooms.find((item) => item.id === roomId);
    if (!room) return;
    setRoomForm({
      id: room.id,
      blockId: room.blockId,
      name: room.name,
      type: room.type,
      capacity: room.capacity,
      floor: room.floor,
      genderPolicy: room.genderPolicy,
      amenities: room.amenities.join(", "),
      images: room.images,
      periodRates: buildRoomRateDrafts(room.id),
    });
    setRoomOverlayOpen(true);
  };

  const saveRoom = async () => {
    if (!roomForm.blockId || !roomForm.name.trim()) return;
    const payload = {
      blockId: roomForm.blockId,
      name: roomForm.name.trim(),
      type: roomForm.type as "single" | "double" | "triple" | "quad",
      capacity: roomForm.capacity,
      floor: roomForm.floor,
      genderPolicy: roomForm.genderPolicy as "mixed" | "female_only" | "male_only",
      amenities: roomForm.amenities.split(",").map((item) => item.trim()).filter(Boolean),
      images: roomForm.images,
      periodRates: roomForm.periodRates.map((rate) => ({
        periodId: rate.periodId,
        price: rate.price,
        active: rate.active,
      })),
    };

    if (roomForm.id) {
      await HostelService.updateRoom(roomForm.id, payload);
      toast.success("Room updated.");
    } else {
      const result = await HostelService.createRoom({ hostelId: session.currentHostelId, ...payload });
      setSelectedRoomId(result.data.id);
      toast.success("Room created.");
    }
    await refreshData();
    setRoomOverlayOpen(false);
    setRoomForm(emptyRoomForm);
  };

  const openCreateBed = (roomId: string) => {
    const roomBeds = database.beds.filter((bed) => bed.roomId === roomId);
    setBedForm({
      id: "",
      roomId,
      label: `Bed ${String.fromCharCode(65 + roomBeds.length)}`,
      status: "available",
    });
    setBedOverlayOpen(true);
  };

  const openEditBed = (bedId: string) => {
    const bed = database.beds.find((item) => item.id === bedId);
    if (!bed) return;
    setBedForm({ id: bed.id, roomId: bed.roomId, label: bed.label, status: bed.status });
    setBedOverlayOpen(true);
  };

  const saveBed = async () => {
    if (!bedForm.roomId || !bedForm.label.trim()) return;
    if (bedForm.id) {
      await BedService.updateBed(bedForm.id, { label: bedForm.label.trim(), status: bedForm.status });
      toast.success("Bed updated.");
    } else {
      const result = await HostelService.createBeds(bedForm.roomId, 1);
      const nextBed = result.data[0];
      if (nextBed) {
        await BedService.updateBed(nextBed.id, { label: bedForm.label.trim(), status: bedForm.status });
      }
      toast.success("Bed added.");
    }
    await refreshData();
    setBedOverlayOpen(false);
    setBedForm(emptyBedForm);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rooms"
        description="Blocks, rooms, beds, photos, and period pricing."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={openCreateBlock}>
              <Plus className="h-4 w-4" />
              Add block
            </Button>
            <Button variant="emerald" size="sm" onClick={openCreateRoom}>
              <Plus className="h-4 w-4" />
              Add room
            </Button>
          </div>
        }
      />

      <div className="space-y-5">
        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <h2 className="font-display text-lg font-semibold">Blocks</h2>
              <p className="text-sm text-muted-foreground">Hostel blocks and floors.</p>
            </div>
          </div>
          <Table>
            <TableHeader className="bg-muted/60">
              <TableRow className="hover:bg-transparent">
                <TableHead>Block</TableHead>
                <TableHead>Floors</TableHead>
                <TableHead>Rooms</TableHead>
                <TableHead className="w-[72px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workspace.blocks.map((block) => {
                const blockRooms = workspace.rooms.filter((room) => room.blockId === block.id);
                return (
                  <TableRow key={block.id}>
                    <TableCell className="font-medium">{block.name}</TableCell>
                    <TableCell>{block.floors}</TableCell>
                    <TableCell>{blockRooms.length}</TableCell>
                    <TableCell className="text-right">
                      <ActionMenuSheet
                        title={block.name}
                        description="Block actions"
                        details={
                          <>
                            <p><span className="text-muted-foreground">Floors:</span> {block.floors}</p>
                            <p><span className="text-muted-foreground">Rooms:</span> {blockRooms.length}</p>
                          </>
                        }
                        actions={[
                          {
                            label: "Edit block",
                            icon: <Pencil className="h-4 w-4" />,
                            onSelect: () => openEditBlock(block.id),
                          },
                          {
                            label: "Delete block",
                            icon: <Trash2 className="h-4 w-4" />,
                            destructive: true,
                            onSelect: async () => {
                              const result = await HostelService.deleteBlock(block.id);
                              if (!result.data) {
                                toast.error("Move or end active bookings before deleting this block.");
                                return;
                              }
                              await refreshData();
                              toast.success("Block deleted.");
                            },
                          },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="overflow-hidden rounded-2xl border bg-card">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <h2 className="font-display text-lg font-semibold">Rooms</h2>
                <p className="text-sm text-muted-foreground">Room setup, available periods, and bed inventory.</p>
              </div>
            </div>

            <Table>
              <TableHeader className="bg-muted/60">
                <TableRow className="hover:bg-transparent">
                  <TableHead>Room</TableHead>
                  <TableHead>Block</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Periods</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[72px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workspace.rooms.map((room) => {
                  const block = workspace.blocks.find((item) => item.id === room.blockId);
                  const availableBeds = database.beds.filter((bed) => bed.roomId === room.id && bed.status === "available").length;
                  const activeRates = getRoomPeriodRates(database, room.id, { activeOnly: true });
                  return (
                    <TableRow
                      key={room.id}
                      className={selectedRoom?.id === room.id ? "bg-muted/30" : ""}
                      onClick={() => setSelectedRoomId(room.id)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{room.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{room.type} / floor {room.floor}</p>
                        </div>
                      </TableCell>
                      <TableCell>{block?.name ?? "-"}</TableCell>
                      <TableCell>{availableBeds}/{room.capacity} open</TableCell>
                      <TableCell>{activeRates.length}</TableCell>
                      <TableCell>{formatCurrency(getRoomStartingPrice(database, room), currency)}</TableCell>
                      <TableCell>
                        <StatusBadge
                          status={room.status}
                          variant={room.status === "available" ? "success" : room.status === "full" ? "warning" : "neutral"}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <ActionMenuSheet
                          title={`Room ${room.name}`}
                          description="Room actions"
                          onViewDetails={() => setSelectedRoomId(room.id)}
                          details={
                            <>
                              <p><span className="text-muted-foreground">Block:</span> {block?.name ?? "-"}</p>
                              <p><span className="text-muted-foreground">Policy:</span> {room.genderPolicy.replace(/_/g, " ")}</p>
                              <p><span className="text-muted-foreground">Beds:</span> {room.capacity}</p>
                            </>
                          }
                          actions={[
                            {
                              label: "Edit room",
                              icon: <Pencil className="h-4 w-4" />,
                              onSelect: () => openEditRoom(room.id),
                            },
                            {
                              label: "Add bed",
                              icon: <Plus className="h-4 w-4" />,
                              onSelect: () => openCreateBed(room.id),
                            },
                            {
                              label: "Delete room",
                              icon: <Trash2 className="h-4 w-4" />,
                              destructive: true,
                              onSelect: async () => {
                                const result = await HostelService.deleteRoom(room.id);
                                if (!result.data) {
                                  toast.error("End or move active bookings before deleting this room.");
                                  return;
                                }
                                await refreshData();
                                if (selectedRoomId === room.id) setSelectedRoomId("");
                                toast.success("Room deleted.");
                              },
                            },
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="rounded-2xl border bg-card p-5">
            {selectedRoom ? (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-semibold">Room {selectedRoom.name}</h2>
                    <p className="text-sm text-muted-foreground capitalize">
                      {selectedRoom.type} / floor {selectedRoom.floor} / {selectedRoom.genderPolicy.replace(/_/g, " ")}
                    </p>
                  </div>
                  <StatusBadge
                    status={selectedRoom.status}
                    variant={selectedRoom.status === "available" ? "success" : selectedRoom.status === "full" ? "warning" : "neutral"}
                  />
                </div>

                <img src={resolveRoomGallery(selectedRoom.images)[0]} alt={selectedRoom.name} className="h-52 w-full rounded-2xl object-cover" />

                <div className="grid gap-3">
                  <div className="rounded-xl bg-muted/60 p-3">
                    <p className="text-xs text-muted-foreground">Starting from</p>
                    <p className="font-semibold">{formatCurrency(getRoomStartingPrice(database, selectedRoom), currency)}</p>
                  </div>
                  <div className="rounded-xl border bg-card p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">Period pricing</p>
                      <p className="text-xs text-muted-foreground">{getRoomPeriodRates(database, selectedRoom.id, { activeOnly: true }).length} active</p>
                    </div>
                    <div className="space-y-2">
                      {workspace.periods.map((period) => {
                        const rate = getRoomPeriodRates(database, selectedRoom.id).find((item) => item.periodId === period.id);
                        return (
                          <div key={period.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-3 py-2">
                            <div>
                              <p className="text-sm font-medium">{period.name}</p>
                              <p className="text-xs capitalize text-muted-foreground">{period.type}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">{formatCurrency(rate?.price ?? 0, currency)}</p>
                              <p className="text-xs text-muted-foreground">{rate?.active ? "Enabled" : "Hidden"}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedRoom.amenities.map((amenity) => (
                    <span key={amenity} className="rounded-full bg-muted px-3 py-1 text-xs">
                      {amenity}
                    </span>
                  ))}
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-medium">Room files</h3>
                    <Button variant="outline" size="sm" onClick={() => openEditRoom(selectedRoom.id)}>
                      <Pencil className="h-4 w-4" />
                      Edit room
                    </Button>
                  </div>
                  <StoredFileList files={selectedRoom.images} emptyLabel="No photos uploaded yet." />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-medium">Beds</h3>
                    <Button variant="outline" size="sm" onClick={() => openCreateBed(selectedRoom.id)}>
                      <Plus className="h-4 w-4" />
                      Add bed
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {selectedRoomBeds.map((bed) => (
                      <div key={bed.id} className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                            <BedDouble className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{bed.label}</p>
                            <p className="text-xs text-muted-foreground capitalize">{bed.status}</p>
                          </div>
                        </div>
                        <ActionMenuSheet
                          title={bed.label}
                          description="Bed actions"
                          details={<p><span className="text-muted-foreground">Status:</span> {bed.status}</p>}
                          actions={[
                            {
                              label: "Edit bed",
                              icon: <Pencil className="h-4 w-4" />,
                              onSelect: () => openEditBed(bed.id),
                            },
                            {
                              label: "Delete bed",
                              icon: <Trash2 className="h-4 w-4" />,
                              destructive: true,
                              onSelect: async () => {
                                const result = await BedService.deleteBed(bed.id);
                                if (!result.data) {
                                  toast.error("Only beds without active bookings can be deleted.");
                                  return;
                                }
                                await refreshData();
                                toast.success("Bed deleted.");
                              },
                            },
                          ]}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed text-sm text-muted-foreground">
                Select a room to view details.
              </div>
            )}
          </div>
        </div>
      </div>

      <ResponsiveOverlay
        open={blockOverlayOpen}
        onOpenChange={setBlockOverlayOpen}
        title={blockForm.id ? "Edit block" : "Add block"}
        description="Block details."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Block name</Label>
            <Input value={blockForm.name} onChange={(event) => setBlockForm({ ...blockForm, name: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Floors</Label>
            <Input type="number" min={1} value={blockForm.floors} onChange={(event) => setBlockForm({ ...blockForm, floors: Number(event.target.value) })} />
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => setBlockOverlayOpen(false)}>Cancel</Button>
            <Button variant="emerald" onClick={() => void saveBlock()}>
              {blockForm.id ? "Save block" : "Create block"}
            </Button>
          </div>
        </div>
      </ResponsiveOverlay>

      <ResponsiveOverlay
        open={roomOverlayOpen}
        onOpenChange={setRoomOverlayOpen}
        title={roomForm.id ? "Edit room" : "Add room"}
        description="Room details, period pricing, and photos."
        desktopClassName="max-w-4xl"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Block</Label>
            <select
              value={roomForm.blockId}
              onChange={(event) => setRoomForm({ ...roomForm, blockId: event.target.value })}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="">Select block</option>
              {workspace.blocks.map((block) => (
                <option key={block.id} value={block.id}>{block.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Room name</Label>
            <Input value={roomForm.name} onChange={(event) => setRoomForm({ ...roomForm, name: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Room type</Label>
            <select
              value={roomForm.type}
              onChange={(event) => setRoomForm({ ...roomForm, type: event.target.value })}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="single">Single</option>
              <option value="double">Double</option>
              <option value="triple">Triple</option>
              <option value="quad">Quad</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Total beds</Label>
            <Input type="number" min={1} value={roomForm.capacity} onChange={(event) => setRoomForm({ ...roomForm, capacity: Number(event.target.value) })} />
          </div>
          <div className="space-y-2">
            <Label>Floor</Label>
            <Input type="number" min={0} value={roomForm.floor} onChange={(event) => setRoomForm({ ...roomForm, floor: Number(event.target.value) })} />
          </div>
          <div className="space-y-2">
            <Label>Gender policy</Label>
            <select
              value={roomForm.genderPolicy}
              onChange={(event) => setRoomForm({ ...roomForm, genderPolicy: event.target.value })}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="mixed">Mixed</option>
              <option value="female_only">Female only</option>
              <option value="male_only">Male only</option>
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Amenities</Label>
            <Input value={roomForm.amenities} onChange={(event) => setRoomForm({ ...roomForm, amenities: event.target.value })} placeholder="WiFi, Desk, AC" />
          </div>
          <div className="rounded-2xl border bg-muted/30 p-4 md:col-span-2">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-medium">Period pricing</h3>
                <p className="text-sm text-muted-foreground">Enable the periods this room can be sold for and set a direct price for each one.</p>
              </div>
            </div>

            {workspace.periods.length ? (
              <div className="space-y-3">
                {workspace.periods.map((period) => {
                  const rate = roomForm.periodRates.find((item) => item.periodId === period.id) ?? { periodId: period.id, active: false, price: 0 };
                  return (
                    <div key={period.id} className="grid gap-3 rounded-2xl border bg-card p-4 md:grid-cols-[1.2fr_0.8fr_auto] md:items-center">
                      <div>
                        <p className="font-medium">{period.name}</p>
                        <p className="text-xs capitalize text-muted-foreground">{period.type}</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Price ({currency})</Label>
                        <Input
                          type="number"
                          min={0}
                          value={rate.price}
                          onChange={(event) =>
                            setRoomForm({
                              ...roomForm,
                              periodRates: roomForm.periodRates.map((item) =>
                                item.periodId === period.id ? { ...item, price: Number(event.target.value) } : item,
                              ),
                            })
                          }
                        />
                      </div>
                      <label className="inline-flex items-center gap-2 text-sm font-medium">
                        <input
                          type="checkbox"
                          checked={rate.active}
                          onChange={(event) =>
                            setRoomForm({
                              ...roomForm,
                              periodRates: roomForm.periodRates.map((item) =>
                                item.periodId === period.id ? { ...item, active: event.target.checked } : item,
                              ),
                            })
                          }
                        />
                        Available
                      </label>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed bg-card px-4 py-5 text-sm text-muted-foreground">
                Create at least one stay period on the Periods page before pricing rooms.
              </div>
            )}
          </div>
          <div className="md:col-span-2">
            <FileUploader
              label="Room photos"
              description="Room gallery photos."
              accept="image/*"
              multiple
              values={roomForm.images}
              onChangeMany={(nextValues) => setRoomForm({ ...roomForm, images: nextValues })}
            />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={() => setRoomOverlayOpen(false)}>Cancel</Button>
          <Button variant="emerald" disabled={!roomForm.blockId} onClick={() => void saveRoom()}>
            {roomForm.id ? "Save room" : "Create room"}
          </Button>
        </div>
      </ResponsiveOverlay>

      <ResponsiveOverlay
        open={bedOverlayOpen}
        onOpenChange={setBedOverlayOpen}
        title={bedForm.id ? "Edit bed" : "Add bed"}
        description="Bed label and status."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Bed label</Label>
            <Input value={bedForm.label} onChange={(event) => setBedForm({ ...bedForm, label: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <select
              value={bedForm.status}
              onChange={(event) => setBedForm({ ...bedForm, status: event.target.value as BedStatus })}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="available">Available</option>
              <option value="maintenance">Maintenance</option>
              {bedForm.id ? <option value="reserved">Reserved</option> : null}
              {bedForm.id ? <option value="occupied">Occupied</option> : null}
            </select>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => setBedOverlayOpen(false)}>Cancel</Button>
            <Button variant="emerald" onClick={() => void saveBed()}>
              {bedForm.id ? "Save bed" : "Add bed"}
            </Button>
          </div>
        </div>
      </ResponsiveOverlay>
    </div>
  );
}
