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
import { SurfacePanel } from "@/components/shared/SurfacePanel";
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
import { useSiteContext } from "@/contexts/SiteContext";
import { getStoredFileName, openStoredFile, serializeFiles } from "@/lib/files";
import { resolveImageSource } from "@/lib/media";

export default function ResidentProfile() {
  const navigate = useNavigate();
  const { database, currentUser, logout, refreshData } = useApp();
  const { buildPublicPath } = useSiteContext();
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
    <div className="container mx-auto w-full max-w-5xl overflow-x-clip space-y-8 py-6 pb-28 md:space-y-10 md:pb-10">
      <PageHeader title="Profile" description="Your details and documents." />

      <SurfacePanel>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
          <div className="min-w-0 flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative mx-auto sm:mx-0">
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

            <div className="min-w-0 space-y-2 text-center sm:text-left">
              <p className="font-display text-2xl font-semibold tracking-tight">{form.name || currentUser.name}</p>
              <p className="break-all text-sm text-muted-foreground">{form.email || currentUser.email}</p>
              <p className="text-sm text-muted-foreground">{form.phone || "No phone added yet"}</p>
              <p className="text-xs text-muted-foreground">Use the camera button to update your photo.</p>
            </div>
          </div>

          <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="min-w-0 rounded-[16px] bg-muted/35 px-4 py-3.5">
              <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Resident type</p>
              <p className="mt-2 text-sm font-medium capitalize text-foreground">{profile?.residentType ?? "student"}</p>
            </div>
            <div className="min-w-0 rounded-[16px] bg-muted/35 px-4 py-3.5">
              <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Student ID</p>
              <p className="mt-2 break-words text-sm text-foreground">{getStoredFileName(form.studentId, "-")}</p>
            </div>
            <div className="min-w-0 rounded-[16px] bg-muted/35 px-4 py-3.5">
              <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Admission letter</p>
              <p className="mt-2 break-words text-sm text-foreground">{getStoredFileName(form.admissionLetter, "-")}</p>
            </div>
          </div>
        </div>
      </SurfacePanel>

      <SurfacePanel title="Personal details" description="Keep your contact information up to date.">
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
      </SurfacePanel>

      <SurfacePanel title="Bio" description="A short note for the hostel team.">
        <Textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} rows={5} />
      </SurfacePanel>

      <SurfacePanel title="Documents" description="Only upload the files needed for verification.">
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
      </SurfacePanel>

      <SurfacePanel>
        <div className="flex flex-col gap-3 sm:flex-row">
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
              logout(buildPublicPath("/"));
              navigate(buildPublicPath("/"));
            }}
          >
            Sign out
          </Button>
        </div>
      </SurfacePanel>
    </div>
  );
}
