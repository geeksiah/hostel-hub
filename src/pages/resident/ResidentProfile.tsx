import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/PageHeader";
import { FileUploader } from "@/components/shared/FileUploader";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ResidentService } from "@/services";
import { useApp } from "@/contexts/AppContext";
import { getStoredFileName, openStoredFile, serializeFiles } from "@/lib/files";
import { resolveImageSource } from "@/lib/media";

export default function ResidentProfile() {
  const navigate = useNavigate();
  const { database, currentUser, logout, refreshData } = useApp();
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const profile = useMemo(() => database?.residentProfiles.find((item) => item.userId === currentUser?.id), [currentUser?.id, database]);
  const [form, setForm] = useState({
    name: currentUser?.name ?? "",
    email: currentUser?.email ?? "",
    phone: currentUser?.phone ?? "",
    institution: profile?.institution ?? "",
    emergencyContact: profile?.emergencyContact ?? "",
    studentId: profile?.studentId ?? "",
    admissionLetter: profile?.admissionLetter ?? "",
    passportPhoto: profile?.passportPhoto ?? "",
    bio: profile?.bio ?? "",
  });

  if (!database || !currentUser) return <div className="container py-10">Loading profile...</div>;

  const updatePhoto = async (files: FileList | null) => {
    const [serialized] = await serializeFiles(Array.from(files ?? []));
    if (!serialized) return;
    setForm((current) => ({ ...current, passportPhoto: serialized }));
  };

  return (
    <div className="container mx-auto max-w-4xl space-y-6 py-6">
      <PageHeader title="Profile" description="Your details and documents." />

      <div className="rounded-2xl border bg-card p-5 md:p-6">
        <div className="flex flex-col gap-5 border-b pb-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24 border shadow-sm">
                <AvatarImage
                  src={form.passportPhoto ? resolveImageSource(form.passportPhoto) : currentUser.avatar ? resolveImageSource(currentUser.avatar) : undefined}
                  alt={form.name}
                />
                <AvatarFallback>{(form.name || currentUser.name).slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  void updatePhoto(event.target.files);
                  event.currentTarget.value = "";
                }}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" size="icon" className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full border bg-card shadow-sm">
                    <Camera className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={(event) => {
                    event.preventDefault();
                    photoInputRef.current?.click();
                  }}>
                    Choose photo
                  </DropdownMenuItem>
                  {form.passportPhoto ? (
                    <DropdownMenuItem onSelect={(event) => {
                      event.preventDefault();
                      openStoredFile(form.passportPhoto);
                    }}>
                      <Eye className="mr-2 h-4 w-4" />
                      View photo
                    </DropdownMenuItem>
                  ) : null}
                  {form.passportPhoto ? <DropdownMenuSeparator /> : null}
                  {form.passportPhoto ? (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onSelect={(event) => {
                        event.preventDefault();
                        setForm((current) => ({ ...current, passportPhoto: "" }));
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove photo
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="min-w-0">
              <p className="font-display text-xl font-semibold">{form.name || currentUser.name}</p>
              <p className="truncate text-sm text-muted-foreground">{form.email || currentUser.email}</p>
              <p className="mt-1 text-xs text-muted-foreground">Use the camera button to update your photo.</p>
            </div>
          </div>

          <div className="grid gap-2 text-sm sm:text-right">
            <p><span className="text-muted-foreground">Resident type:</span> {profile?.residentType ?? "student"}</p>
            <p><span className="text-muted-foreground">Student ID:</span> {getStoredFileName(form.studentId, "-")}</p>
            <p><span className="text-muted-foreground">Admission letter:</span> {getStoredFileName(form.admissionLetter, "-")}</p>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          <section className="space-y-4">
            <div className="space-y-1">
              <h2 className="font-display text-lg font-semibold">Personal details</h2>
              <p className="text-sm text-muted-foreground">Keep your contact information up to date.</p>
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
                <Label>Institution</Label>
                <Input value={form.institution} onChange={(event) => setForm({ ...form, institution: event.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Emergency contact</Label>
                <Input value={form.emergencyContact} onChange={(event) => setForm({ ...form, emergencyContact: event.target.value })} />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="space-y-1">
              <h2 className="font-display text-lg font-semibold">Bio</h2>
              <p className="text-sm text-muted-foreground">A short note for the hostel team.</p>
            </div>
            <Textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} rows={4} />
          </section>

          <section className="space-y-4">
            <div className="space-y-1">
              <h2 className="font-display text-lg font-semibold">Documents</h2>
              <p className="text-sm text-muted-foreground">Only upload the files needed for verification.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FileUploader
                label="Student ID card"
                description="PDF or image."
                accept=".pdf,image/*"
                value={form.studentId}
                onChange={(nextValue) => setForm({ ...form, studentId: nextValue })}
              />
              <FileUploader
                label="Admission letter"
                description="PDF or image."
                accept=".pdf,image/*"
                value={form.admissionLetter}
                onChange={(nextValue) => setForm({ ...form, admissionLetter: nextValue })}
              />
            </div>
          </section>

          <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row">
            <Button
              variant="emerald"
              className="flex-1"
              onClick={async () => {
                await ResidentService.updateProfile(currentUser.id, {
                  ...form,
                  avatar: form.passportPhoto,
                });
                await refreshData();
                toast.success("Profile updated.");
              }}
            >
              Save changes
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
