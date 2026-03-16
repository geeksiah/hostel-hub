import { useEffect, useRef, useState, type ChangeEvent } from "react";
import jsQR from "jsqr";
import { Camera, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckInService, QrService } from "@/services";
import { useApp } from "@/contexts/AppContext";
import { isSecurityAdmin } from "@/modules/admin/permissions";
import type { Booking, GroupBooking, Room, User } from "@/types";

const SCANNER_IDLE_MS = 120;
const QR_CAPTURE_MAX_DIMENSION = 1600;

function getScaledDimensions(width: number, height: number) {
  const scale = Math.min(1, QR_CAPTURE_MAX_DIMENSION / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function loadImageFromFile(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not load image."));
    };
    image.src = objectUrl;
  });
}

async function decodeQrFromImageFile(file: File) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;

  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    try {
      const { width, height } = getScaledDimensions(bitmap.width, bitmap.height);
      canvas.width = width;
      canvas.height = height;
      context.drawImage(bitmap, 0, 0, width, height);
    } finally {
      bitmap.close();
    }
  } else {
    const image = await loadImageFromFile(file);
    const { width, height } = getScaledDimensions(image.width, image.height);
    canvas.width = width;
    canvas.height = height;
    context.drawImage(image, 0, 0, width, height);
  }

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(imageData.data, canvas.width, canvas.height)?.data ?? null;
}

export default function AdminCheckIn() {
  const { database, session, refreshData, currentUser } = useApp();
  const [search, setSearch] = useState("");
  const [inspectionNotes, setInspectionNotes] = useState("Wardrobe checked, keys issued.");
  const [manualToken, setManualToken] = useState("");
  const [verification, setVerification] = useState<{ user?: User; booking?: Booking; room?: Room; groupBooking?: GroupBooking } | null>(null);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const captureInputRef = useRef<HTMLInputElement | null>(null);
  const manualInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  const scannerBufferRef = useRef("");
  const scannerTimeoutRef = useRef<number | null>(null);
  const securityDesk = isSecurityAdmin(currentUser);
  const canUseLiveBarcodeScanner = typeof window !== "undefined" && "BarcodeDetector" in window;

  const stopScan = () => {
    scanningRef.current = false;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScan();
      if (scannerTimeoutRef.current) {
        window.clearTimeout(scannerTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (securityDesk) {
      manualInputRef.current?.focus();
    }
  }, [securityDesk]);

  useEffect(() => {
    if (!securityDesk) return;

    const flushScannerBuffer = () => {
      const buffered = scannerBufferRef.current.trim();
      scannerBufferRef.current = "";
      if (scannerTimeoutRef.current) {
        window.clearTimeout(scannerTimeoutRef.current);
        scannerTimeoutRef.current = null;
      }
      if (!buffered) return;
      setManualToken(buffered);
      void verifyToken(buffered);
    };

    const handleGlobalScanner = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;

      const target = event.target as HTMLElement | null;
      const isEditableTarget =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        Boolean(target?.isContentEditable);

      if (isEditableTarget) return;

      if (event.key === "Escape") {
        scannerBufferRef.current = "";
        setManualToken("");
        return;
      }

      if (event.key === "Enter" || event.key === "Tab") {
        if (scannerBufferRef.current.trim()) {
          event.preventDefault();
          flushScannerBuffer();
        }
        return;
      }

      if (event.key.length !== 1) return;

      scannerBufferRef.current += event.key;
      setManualToken(scannerBufferRef.current);

      if (scannerTimeoutRef.current) {
        window.clearTimeout(scannerTimeoutRef.current);
      }

      scannerTimeoutRef.current = window.setTimeout(() => {
        if (scannerBufferRef.current.trim().length >= 6) {
          flushScannerBuffer();
        }
      }, SCANNER_IDLE_MS);
    };

    window.addEventListener("keydown", handleGlobalScanner);
    return () => {
      window.removeEventListener("keydown", handleGlobalScanner);
      if (scannerTimeoutRef.current) {
        window.clearTimeout(scannerTimeoutRef.current);
        scannerTimeoutRef.current = null;
      }
    };
  }, [securityDesk]);

  if (!database) return <div className="py-10">Loading check-in desk...</div>;

  const bookings = database.bookings.filter(
    (booking) => booking.hostelId === session.currentHostelId && (booking.status === "confirmed" || booking.status === "checked_in"),
  );
  const filtered = bookings.filter((booking) => {
    const resident = database.users.find((user) => user.id === booking.residentId);
    const room = database.rooms.find((item) => item.id === booking.roomId);
    const haystack = `${resident?.name ?? ""} ${room?.name ?? ""}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const verifyToken = async (token: string) => {
    const normalizedToken = token.trim();
    if (!normalizedToken) {
      toast.error("Scan or enter a token to verify.");
      return;
    }
    const result = await QrService.verifyResidentToken(token);
    setVerification(result.data);
    if (result.data.user?.role === "resident") {
      toast.success("Resident verified.");
      return;
    }
    if (result.data.user?.role === "group_organizer") {
      toast.success("Group organizer verified.");
      return;
    }
    toast.error("No resident or group matched this token.");
  };

  const handleCapturedQrImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setScanning(true);
    try {
      const decodedValue = await decodeQrFromImageFile(file);
      if (!decodedValue) {
        toast.error("No QR code was detected in the captured image.");
        return;
      }
      setManualToken(decodedValue);
      await verifyToken(decodedValue);
    } catch {
      toast.error("The captured image could not be read.");
    } finally {
      setScanning(false);
    }
  };

  const startScan = async () => {
    if (scanning) {
      stopScan();
      return;
    }

    if (!canUseLiveBarcodeScanner) {
      captureInputRef.current?.click();
      return;
    }

    if (!("mediaDevices" in navigator) || !navigator.mediaDevices.getUserMedia) {
      toast.error("Camera access is not available in this browser.");
      return;
    }

    try {
      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      scanningRef.current = true;
      setScanning(true);

      const tick = async () => {
        if (!videoRef.current || !scanningRef.current) return;
        if (videoRef.current.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
          requestAnimationFrame(() => void tick());
          return;
        }

        try {
          const codes = await detector.detect(videoRef.current);
          const value = codes[0]?.rawValue?.trim();
          if (value) {
            stopScan();
            setManualToken(value);
            await verifyToken(value);
            return;
          }
        } catch {
          // Keep polling frames while the browser warms up the video feed.
        }

        requestAnimationFrame(() => void tick());
      };

      requestAnimationFrame(() => void tick());
    } catch {
      stopScan();
      toast.error("The live camera could not be started on this device.");
    }
  };

  const verifiedHostel = verification?.booking?.hostelId ?? verification?.groupBooking?.hostelId ?? verification?.user?.hostelId;
  const verifiedHostelName = database.hostels.find((item) => item.id === verifiedHostel)?.name;
  const sameHostel = Boolean(verifiedHostel && verifiedHostel === session.currentHostelId);
  const groupStatus = verification?.groupBooking?.status;
  const submitManualToken = async (value = manualToken) => {
    scannerBufferRef.current = "";
    if (scannerTimeoutRef.current) {
      window.clearTimeout(scannerTimeoutRef.current);
      scannerTimeoutRef.current = null;
    }
    await verifyToken(value);
  };

  return (
    <div className="space-y-6">
      <input
        ref={captureInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => void handleCapturedQrImage(event)}
      />
      <PageHeader
        title={securityDesk ? "Security scanner" : "Check-in / check-out"}
        description={
          securityDesk
            ? "Scan resident or group QR codes. External keyboard-style scanners can type directly into the verification field."
            : "Manage arrivals and verify resident or group QR codes."
        }
      />

      <div className={`grid gap-6 ${securityDesk ? "xl:grid-cols-[0.95fr_1.05fr]" : "xl:grid-cols-[1.1fr_0.9fr]"}`}>
        {!securityDesk ? (
          <div className="space-y-4">
            <div className="max-w-sm">
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search resident or room" />
            </div>

            <div className="space-y-3">
              {filtered.map((booking) => {
                const resident = database.users.find((user) => user.id === booking.residentId);
                const room = database.rooms.find((item) => item.id === booking.roomId);
                return (
                  <div key={booking.id} className="space-y-3 rounded-lg border bg-card p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h2 className="text-sm font-semibold">{resident?.name}</h2>
                        <p className="text-xs text-muted-foreground">Room {room?.name} / Booking {booking.id}</p>
                      </div>
                      <StatusBadge status={booking.status} type="booking" />
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Inspection notes</p>
                      <Textarea value={inspectionNotes} onChange={(event) => setInspectionNotes(event.target.value)} rows={2} />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {booking.status === "confirmed" ? (
                        <Button
                          variant="emerald"
                          size="sm"
                          onClick={async () => {
                            await CheckInService.checkInResident(booking.id, inspectionNotes);
                            await refreshData();
                            toast.success(`${resident?.name} checked in.`);
                          }}
                        >
                          Check in
                        </Button>
                      ) : null}
                      {booking.status === "checked_in" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            await CheckInService.checkOutResident(booking.id, inspectionNotes);
                            await refreshData();
                            toast.success(`${resident?.name} checked out.`);
                          }}
                        >
                          Check out
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          await CheckInService.saveInspectionNotes(booking.id, inspectionNotes);
                          await refreshData();
                          toast.success("Inspection notes saved.");
                        }}
                      >
                        Save notes
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border bg-card p-5" onClick={() => manualInputRef.current?.focus()}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold">Scanner-ready verification</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  USB and Bluetooth QR scanners that type like a keyboard work here without extra setup. If focus is lost, rapid scans are still captured at page level and verified automatically.
                </p>
              </div>
              <StatusBadge status="active" />
            </div>
            <div className="mt-4 grid gap-3">
              <Input
                ref={manualInputRef}
                value={manualToken}
                onChange={(event) => setManualToken(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === "Tab") {
                    event.preventDefault();
                    void submitManualToken(manualToken);
                  }
                }}
                placeholder="Scan QR token, resident ID, or organizer email"
              />
              <div className="flex flex-wrap gap-2">
                <Button variant="emerald" onClick={() => void submitManualToken(manualToken)}>
                  Verify record
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    scannerBufferRef.current = "";
                    setManualToken("");
                    setVerification(null);
                    manualInputRef.current?.focus();
                  }}
                >
                  Clear capture
                </Button>
                <Button variant="outline" onClick={() => void startScan()}>
                  <Camera className="mr-2 h-4 w-4" />
                  {scanning ? "Scanning..." : "Use camera instead"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Supported input: QR payloads, resident IDs, and organizer emails. Most external scanners send an automatic Enter or Tab; idle scans also auto-submit after a short pause.
              </p>
              <video ref={videoRef} className="aspect-video w-full rounded-lg bg-muted object-cover" muted playsInline autoPlay />
            </div>
          </div>
        )}

        <div className="space-y-4">
          {!securityDesk ? (
            <div className="rounded-lg border bg-card p-5">
              <h2 className="font-display text-lg font-semibold">Resident verification desk</h2>
              <p className="mt-1 text-sm text-muted-foreground">Scan or paste a resident or group QR token to verify identity and current stay.</p>

              <div className="mt-4 grid gap-4">
                <video ref={videoRef} className="aspect-video w-full rounded-lg bg-muted object-cover" muted playsInline autoPlay />
                <Button variant="outline" onClick={() => void startScan()}>
                  <Camera className="mr-2 h-4 w-4" />
                  {scanning ? "Scanning..." : "Start camera scan"}
                </Button>
                <div className="space-y-2">
                  <Input
                    ref={manualInputRef}
                    value={manualToken}
                    onChange={(event) => setManualToken(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === "Tab") {
                        event.preventDefault();
                        void submitManualToken(manualToken);
                      }
                    }}
                    placeholder="Paste QR token, resident ID, or organizer email"
                  />
                  <Button variant="emerald" className="w-full" onClick={() => void submitManualToken(manualToken)}>
                    Verify resident
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {verification ? (
            <div className="rounded-lg border bg-card p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-1 h-5 w-5 text-emerald" />
                <div>
                  <h2 className="font-display text-lg font-semibold">{verification.user?.name ?? "Unverified token"}</h2>
                  <p className="text-sm text-muted-foreground">
                    {verification.user?.role === "resident"
                      ? "Registered resident"
                      : verification.user?.role === "group_organizer"
                        ? "Group organizer"
                        : "No matching record"}
                  </p>
                </div>
              </div>

              {verification.user ? (
                <div className="mt-4 space-y-3 text-sm">
                  <p><span className="text-muted-foreground">Email:</span> {verification.user.email}</p>
                  <p><span className="text-muted-foreground">Hostel:</span> {verifiedHostelName ?? "-"}</p>
                  {verification.user.role === "resident" ? (
                    <>
                      <p><span className="text-muted-foreground">Room:</span> {verification.room?.name ?? "-"}</p>
                      <p><span className="text-muted-foreground">Current booking:</span> {verification.booking?.id ?? "-"}</p>
                      {verification.booking ? <StatusBadge status={verification.booking.status} type="booking" /> : null}
                    </>
                  ) : (
                    <>
                      <p><span className="text-muted-foreground">Group:</span> {verification.groupBooking?.groupName ?? "-"}</p>
                      <p><span className="text-muted-foreground">Allocated beds:</span> {verification.groupBooking ? `${verification.groupBooking.bedsAllocated}/${verification.groupBooking.bedsRequired}` : "-"}</p>
                      {groupStatus ? (
                        <StatusBadge
                          status={groupStatus}
                          variant={groupStatus === "confirmed" ? "success" : groupStatus === "allocated" ? "info" : "warning"}
                        />
                      ) : null}
                    </>
                  )}
                  {!sameHostel && verifiedHostel ? <p className="text-xs text-amber">This record is tied to another hostel.</p> : null}
                </div>
              ) : null}

              {sameHostel && verification.booking?.status === "confirmed" && !securityDesk ? (
                <div className="mt-4">
                  <Button
                    variant="emerald"
                    size="sm"
                    onClick={async () => {
                      await CheckInService.checkInResident(verification.booking!.id, inspectionNotes);
                      await refreshData();
                      const updated = await QrService.verifyResidentToken(JSON.stringify({ userId: verification.user?.id, bookingId: verification.booking?.id }));
                      setVerification(updated.data);
                      toast.success("Resident checked in from QR verification.");
                    }}
                  >
                    Check in verified resident
                  </Button>
                </div>
              ) : null}

              {sameHostel && verification.booking?.status === "checked_in" && !securityDesk ? (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      await CheckInService.checkOutResident(verification.booking!.id, inspectionNotes);
                      await refreshData();
                      const updated = await QrService.verifyResidentToken(JSON.stringify({ userId: verification.user?.id, bookingId: verification.booking?.id }));
                      setVerification(updated.data);
                      toast.success("Resident checked out from QR verification.");
                    }}
                  >
                    Check out verified resident
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

declare global {
  interface Window {
    BarcodeDetector: {
      new (options: { formats: string[] }): {
        detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
      };
    };
  }
}
