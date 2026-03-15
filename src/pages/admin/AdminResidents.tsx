import { useMemo, useState } from "react";
import { BedDouble, Pencil, Plus, TicketPlus, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { ActionMenuSheet } from "@/components/shared/ActionMenuSheet";
import { PageHeader } from "@/components/shared/PageHeader";
import { ResponsiveOverlay } from "@/components/shared/ResponsiveOverlay";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { StoredFileList } from "@/components/shared/StoredFileList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApp } from "@/contexts/AppContext";
import { BookingService, ResidentService, UserService } from "@/services";

const emptyForm = {
  id: "",
  accountType: "resident",
  name: "",
  email: "",
  phone: "",
  institution: "",
  residentType: "student",
  groupName: "",
  notes: "",
};

export default function AdminResidents() {
  const { database, session, refreshData } = useApp();
  const [form, setForm] = useState(emptyForm);
  const [residentOverlayOpen, setResidentOverlayOpen] = useState(false);
  const [assignmentOverlayOpen, setAssignmentOverlayOpen] = useState(false);
  const [selectedResidentId, setSelectedResidentId] = useState("");
  const [assignmentResidentId, setAssignmentResidentId] = useState("");
  const [assignmentForm, setAssignmentForm] = useState({ roomId: "", bedId: "", periodId: "" });

  const residents = useMemo(
    () =>
      database?.users
        .filter((user) => user.role === "resident" && user.hostelId === session.currentHostelId)
        .map((user) => ({
          user,
          profile: database.residentProfiles.find((profile) => profile.userId === user.id),
          booking: database.bookings.find((booking) => booking.residentId === user.id && booking.status !== "cancelled"),
        })) ?? [],
    [database, session.currentHostelId],
  );
  const groupOrganizers = useMemo(
    () =>
      database?.groupBookings
        .filter((booking) => booking.hostelId === session.currentHostelId)
        .map((booking) => ({
          booking,
          organizer: database.users.find((user) => user.id === booking.organizerId),
        }))
        .filter((item) => item.organizer) ?? [],
    [database, session.currentHostelId],
  );

  const selectedResident = residents.find((item) => item.user.id === selectedResidentId) ?? residents[0];
  const rooms = useMemo(() => database?.rooms.filter((room) => room.hostelId === session.currentHostelId) ?? [], [database, session.currentHostelId]);
  const periods = useMemo(() => database?.periods.filter((period) => period.hostelId === session.currentHostelId) ?? [], [database, session.currentHostelId]);

  if (!database) return <div className="py-10">Loading residents...</div>;

  const openCreate = () => {
    setForm(emptyForm);
    setResidentOverlayOpen(true);
  };

  const openEdit = (residentId: string) => {
    const resident = residents.find((item) => item.user.id === residentId);
    if (!resident) return;
    setForm({
      id: resident.user.id,
      accountType: "resident",
      name: resident.user.name,
      email: resident.user.email,
      phone: resident.user.phone,
      institution: resident.profile?.institution ?? "",
      residentType: resident.profile?.residentType ?? "student",
      groupName: "",
      notes: "",
    });
    setResidentOverlayOpen(true);
  };

  const openEditGroup = (organizerId: string) => {
    const groupEntry = groupOrganizers.find((item) => item.organizer?.id === organizerId);
    if (!groupEntry?.organizer) return;
    setForm({
      id: groupEntry.organizer.id,
      accountType: "group",
      name: groupEntry.organizer.name,
      email: groupEntry.organizer.email,
      phone: groupEntry.organizer.phone,
      institution: "",
      residentType: "student",
      groupName: groupEntry.booking.groupName,
      notes: groupEntry.booking.notes ?? "",
    });
    setResidentOverlayOpen(true);
  };

  const saveResident = async () => {
    if (!form.name.trim() || !form.email.trim()) return;
    if (form.accountType === "group") {
      if (form.id) {
        await UserService.updateAccount(form.id, {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone,
        });
        const groupEntry = groupOrganizers.find((item) => item.organizer?.id === form.id);
        if (groupEntry) {
          await BookingService.updateGroupRequest(groupEntry.booking.id, {
            groupName: form.groupName.trim() || groupEntry.booking.groupName,
            contactPhone: form.phone,
            notes: form.notes.trim(),
          });
        }
        toast.success("Group organizer updated.");
      } else {
        const organizer = await UserService.createGroupOrganizer({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone,
        });
        await BookingService.createGroupRequest({
          organizerId: organizer.data.id,
          hostelId: session.currentHostelId,
          groupName: form.groupName.trim() || `${form.name.trim()} group`,
          bedsRequired: 2,
          periodId: periods.find((period) => period.isActive)?.id ?? periods[0]?.id ?? "",
          contactPhone: form.phone,
          notes: form.notes.trim() || "Created by admin from the resident directory.",
        });
        toast.success("Group organizer created.");
      }
    } else if (form.id) {
      await ResidentService.updateProfile(form.id, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone,
        institution: form.institution,
        residentType: form.residentType as "student" | "guest",
      });
      toast.success("Resident updated.");
    } else {
      await ResidentService.createResident({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone,
        hostelId: session.currentHostelId,
        institution: form.institution,
        residentType: form.residentType as "student" | "guest",
      });
      toast.success("Resident created.");
    }
    await refreshData();
    setResidentOverlayOpen(false);
    setForm(emptyForm);
  };

  const openAssignment = (residentId: string) => {
    const resident = residents.find((item) => item.user.id === residentId);
    setAssignmentResidentId(residentId);
    setAssignmentForm({
      roomId: resident?.booking?.roomId ?? "",
      bedId: resident?.booking?.bedId ?? "",
      periodId: resident?.booking?.periodId ?? periods.find((period) => period.isActive)?.id ?? periods[0]?.id ?? "",
    });
    setAssignmentOverlayOpen(true);
  };

  const saveAssignment = async () => {
    if (!assignmentResidentId || !assignmentForm.roomId || !assignmentForm.bedId || !assignmentForm.periodId) return;
    const resident = residents.find((item) => item.user.id === assignmentResidentId);
    await BookingService.assignResidentToBed({
      residentId: assignmentResidentId,
      hostelId: session.currentHostelId,
      roomId: assignmentForm.roomId,
      bedId: assignmentForm.bedId,
      periodId: assignmentForm.periodId,
      bookingId: resident?.booking?.id,
    });
    await refreshData();
    setAssignmentOverlayOpen(false);
    toast.success(resident?.booking ? "Room assignment updated." : "Room assigned.");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Residents and groups"
        description="Residents, groups, and room assignments."
        actions={
          <Button variant="emerald" size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add resident or group
          </Button>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="border-b px-4 py-3">
            <h2 className="font-display text-lg font-semibold">Resident directory</h2>
            <p className="text-sm text-muted-foreground">Use row actions to assign rooms, edit accounts, or open tickets.</p>
          </div>

          <Table>
            <TableHeader className="bg-muted/60">
              <TableRow className="hover:bg-transparent">
                <TableHead>Resident</TableHead>
                <TableHead>Institution</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[72px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {residents.map(({ user, profile, booking }) => {
                const room = booking ? database.rooms.find((item) => item.id === booking.roomId) : undefined;
                return (
                  <TableRow
                    key={user.id}
                    className={selectedResident?.user.id === user.id ? "bg-muted/30" : ""}
                    onClick={() => setSelectedResidentId(user.id)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{profile?.institution || "-"}</TableCell>
                    <TableCell>{room ? `Room ${room.name}` : "-"}</TableCell>
                    <TableCell>
                      {booking ? <StatusBadge status={booking.status} type="booking" /> : <StatusBadge status="unassigned" variant="neutral" />}
                    </TableCell>
                    <TableCell className="text-right">
                      <ActionMenuSheet
                        title={user.name}
                        description="Resident actions"
                        onViewDetails={() => setSelectedResidentId(user.id)}
                        details={
                          <>
                            <p><span className="text-muted-foreground">Phone:</span> {user.phone || "-"}</p>
                            <p><span className="text-muted-foreground">Type:</span> {profile?.residentType ?? "student"}</p>
                          </>
                        }
                        actions={[
                          {
                            label: "Edit resident",
                            icon: <Pencil className="h-4 w-4" />,
                            onSelect: () => openEdit(user.id),
                          },
                          {
                            label: booking ? "Manage room" : "Assign room",
                            icon: <BedDouble className="h-4 w-4" />,
                            onSelect: () => openAssignment(user.id),
                          },
                          {
                            label: "Create room-change ticket",
                            icon: <TicketPlus className="h-4 w-4" />,
                            onSelect: async () => {
                              await ResidentService.requestRoomChange(
                                user.id,
                                "Room change request",
                                `Admin opened a room change review for ${user.name}.`,
                                user.hostelId ?? session.currentHostelId,
                              );
                              await refreshData();
                              toast.success("Room change ticket created.");
                            },
                          },
                          {
                            label: "Delete resident",
                            icon: <Trash2 className="h-4 w-4" />,
                            destructive: true,
                            onSelect: async () => {
                              await ResidentService.deleteResident(user.id);
                              await refreshData();
                              if (selectedResidentId === user.id) setSelectedResidentId("");
                              toast.success("Resident removed.");
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
          {selectedResident ? (
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-muted">
                  {selectedResident.user.avatar ? (
                    <img src={selectedResident.user.avatar} alt={selectedResident.user.name} className="h-full w-full object-cover" />
                  ) : (
                    <UserRound className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-lg font-semibold">{selectedResident.user.name}</h2>
                  <p className="truncate text-sm text-muted-foreground">{selectedResident.user.email}</p>
                </div>
                {selectedResident.booking ? <StatusBadge status={selectedResident.booking.status} type="booking" /> : null}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-muted/60 p-3">
                  <p className="text-xs text-muted-foreground">Resident type</p>
                  <p className="font-medium capitalize">{selectedResident.profile?.residentType ?? "student"}</p>
                </div>
                <div className="rounded-xl bg-muted/60 p-3">
                  <p className="text-xs text-muted-foreground">Institution</p>
                  <p className="font-medium">{selectedResident.profile?.institution || "-"}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Phone:</span> {selectedResident.user.phone || "-"}</p>
                <p><span className="text-muted-foreground">Room:</span> {selectedResident.booking ? `Room ${database.rooms.find((room) => room.id === selectedResident.booking?.roomId)?.name ?? "-"}` : "-"}</p>
                <p><span className="text-muted-foreground">Emergency:</span> {selectedResident.profile?.emergencyContact || "-"}</p>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-medium">Resident files</h3>
                  <Button variant="outline" size="sm" onClick={() => openEdit(selectedResident.user.id)}>
                    <Pencil className="h-4 w-4" />
                    Edit account
                  </Button>
                </div>
                <StoredFileList
                  files={[
                    selectedResident.profile?.passportPhoto,
                    selectedResident.profile?.admissionLetter,
                    selectedResident.profile?.studentId,
                    selectedResident.profile?.nationalId,
                  ]}
                  emptyLabel="No files uploaded yet."
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="emerald" size="sm" onClick={() => openAssignment(selectedResident.user.id)}>
                  {selectedResident.booking ? "Manage room" : "Assign room"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await ResidentService.requestRoomChange(
                      selectedResident.user.id,
                      "Room change request",
                      `Admin opened a room change review for ${selectedResident.user.name}.`,
                      selectedResident.user.hostelId ?? session.currentHostelId,
                    );
                    await refreshData();
                    toast.success("Room change ticket created.");
                  }}
                >
                  Open room change
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed text-sm text-muted-foreground">
              Select a resident to view account details.
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="border-b px-4 py-3">
            <h2 className="font-display text-lg font-semibold">Group organizers</h2>
            <p className="text-sm text-muted-foreground">Contacts for group stays.</p>
          </div>
          <Table>
            <TableHeader className="bg-muted/60">
              <TableRow className="hover:bg-transparent">
                <TableHead>Organizer</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[72px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupOrganizers.map(({ organizer, booking }) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{organizer?.name}</p>
                      <p className="text-xs text-muted-foreground">{organizer?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{booking.groupName}</TableCell>
                  <TableCell>
                    <StatusBadge status={booking.status} variant={booking.status === "confirmed" ? "success" : booking.status === "allocated" ? "info" : "warning"} />
                  </TableCell>
                  <TableCell className="text-right">
                    <ActionMenuSheet
                      title={organizer?.name ?? booking.groupName}
                      description="Group actions"
                      details={
                        <>
                          <p><span className="text-muted-foreground">Beds:</span> {booking.bedsAllocated}/{booking.bedsRequired}</p>
                          <p><span className="text-muted-foreground">Phone:</span> {booking.contactPhone}</p>
                        </>
                      }
                      actions={[
                        {
                          label: "Edit organizer",
                          icon: <Pencil className="h-4 w-4" />,
                          onSelect: () => organizer && openEditGroup(organizer.id),
                        },
                      ]}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <ResponsiveOverlay
        open={residentOverlayOpen}
        onOpenChange={setResidentOverlayOpen}
        title={form.id ? "Edit resident" : "Add resident"}
        description="Resident or group contact details."
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant={form.accountType === "resident" ? "emerald" : "outline"} size="sm" onClick={() => setForm({ ...form, accountType: "resident" })}>
              Resident
            </Button>
            <Button variant={form.accountType === "group" ? "emerald" : "outline"} size="sm" onClick={() => setForm({ ...form, accountType: "group" })}>
              Group organizer
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{form.accountType === "group" ? "Group name" : "Institution"}</Label>
              <Input
                value={form.accountType === "group" ? form.groupName : form.institution}
                onChange={(event) => setForm({ ...form, [form.accountType === "group" ? "groupName" : "institution"]: event.target.value })}
              />
            </div>
            {form.accountType === "resident" ? (
              <div className="space-y-2 md:col-span-2">
                <Label>Resident type</Label>
                <select
                  value={form.residentType}
                  onChange={(event) => setForm({ ...form, residentType: event.target.value })}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="student">Student</option>
                  <option value="guest">Guest</option>
                </select>
              </div>
            ) : (
              <div className="space-y-2 md:col-span-2">
                <Label>Group notes</Label>
                <Input value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
              </div>
            )}
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => setResidentOverlayOpen(false)}>Cancel</Button>
            <Button variant="emerald" onClick={() => void saveResident()}>
              {form.id ? "Save account" : form.accountType === "group" ? "Create group organizer" : "Create resident"}
            </Button>
          </div>
        </div>
      </ResponsiveOverlay>

      <ResponsiveOverlay
        open={assignmentOverlayOpen}
        onOpenChange={setAssignmentOverlayOpen}
        title="Manage room assignment"
        description="Assign, change, or remove a room."
      >
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Room</Label>
              <select
                value={assignmentForm.roomId}
                onChange={(event) => setAssignmentForm({ ...assignmentForm, roomId: event.target.value, bedId: "" })}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Select room</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>Room {room.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Bed</Label>
              <select
                value={assignmentForm.bedId}
                onChange={(event) => setAssignmentForm({ ...assignmentForm, bedId: event.target.value })}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Select bed</option>
                {database.beds
                  .filter((bed) => bed.roomId === assignmentForm.roomId && (bed.status === "available" || bed.id === residents.find((item) => item.user.id === assignmentResidentId)?.booking?.bedId))
                  .map((bed) => (
                    <option key={bed.id} value={bed.id}>{bed.label}</option>
                  ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Period</Label>
              <select
                value={assignmentForm.periodId}
                onChange={(event) => setAssignmentForm({ ...assignmentForm, periodId: event.target.value })}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Select period</option>
                {periods.map((period) => (
                  <option key={period.id} value={period.id}>{period.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            {residents.find((item) => item.user.id === assignmentResidentId)?.booking ? (
              <Button
                variant="outline"
                onClick={async () => {
                  const resident = residents.find((item) => item.user.id === assignmentResidentId);
                  if (!resident?.booking) return;
                  await BookingService.removeResidentAssignment(assignmentResidentId, resident.booking.id);
                  await refreshData();
                  setAssignmentOverlayOpen(false);
                  toast.success("Room assignment removed.");
                }}
              >
                Remove room
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => setAssignmentOverlayOpen(false)}>Cancel</Button>
            <Button variant="emerald" onClick={() => void saveAssignment()}>
              Save assignment
            </Button>
          </div>
        </div>
      </ResponsiveOverlay>
    </div>
  );
}
