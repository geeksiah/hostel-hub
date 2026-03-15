import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { BackBreadcrumbHeader } from "@/components/shared/BackBreadcrumbHeader";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselApi, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useApp } from "@/contexts/AppContext";
import { useSiteContext } from "@/contexts/SiteContext";
import { formatCurrency, getHostelCurrency } from "@/lib/currency";
import { getPropertyPath, getRoomPath, shouldUseAccountShell } from "@/lib/app-shell";
import { getRoomView } from "@/modules/catalog/selectors";
import { getSiteHostels } from "@/modules/site/selectors";
import { resolveRoomGallery } from "@/lib/media";

function resolveRoomPrice(periodType: "semester" | "year" | "vacation" | undefined, semester: number, year: number, nightly: number) {
  if (periodType === "year") return year;
  if (periodType === "vacation") return nightly * 45;
  return semester;
}

export default function RoomDetailPage() {
  const { roomId = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { database, currentUser, setPendingBooking } = useApp();
  const { publicSite, preferredSite, buildPublicPath } = useSiteContext();
  const [selectedBedId, setSelectedBedId] = useState("");
  const [selectedPeriodId, setSelectedPeriodId] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  useEffect(() => {
    if (lightboxOpen) {
      carouselApi?.scrollTo(lightboxIndex);
    }
  }, [carouselApi, lightboxIndex, lightboxOpen]);

  const view = useMemo(() => (database ? getRoomView(database, roomId) : null), [database, roomId]);

  const site = publicSite ?? preferredSite;
  const allowedHostels = new Set(database ? getSiteHostels(database, site).map((hostel) => hostel.id) : []);

  if (!database || !view?.room || !view.hostel || !allowedHostels.has(view.hostel.id)) {
    return <div className="container py-10">Loading room...</div>;
  }

  const { room, hostel, beds, periods, discountCodes } = view;
  const propertyPath = getPropertyPath(currentUser, hostel.id, buildPublicPath);
  const roomPath = getRoomPath(currentUser, room.id, buildPublicPath);
  const gallery = resolveRoomGallery(room.images);
  const selectedPeriod = periods.find((period) => period.id === selectedPeriodId) ?? periods.find((period) => period.isActive) ?? periods[0];
  const discount = discountCodes.find((code) => code.code === discountCode.toUpperCase());
  const basePrice = resolveRoomPrice(selectedPeriod?.type, room.pricePerSemester, room.pricePerYear, room.pricePerNight);
  const totalPrice = discount ? Math.round(basePrice * ((100 - discount.percentage) / 100)) : basePrice;
  const currency = getHostelCurrency(database, hostel.id);

  if (shouldUseAccountShell(currentUser) && location.pathname !== roomPath) {
    return <Navigate to={roomPath} replace />;
  }

  return (
    <div className="container mx-auto max-w-5xl space-y-6 py-6">
      <BackBreadcrumbHeader
        title={`Room ${room.name}`}
        backHref={propertyPath}
        backLabel="Back to rooms"
        breadcrumbs={[
          { label: "Rooms", href: currentUser?.role === "resident" ? "/resident/properties" : currentUser?.role === "group_organizer" ? "/group/properties" : buildPublicPath("/properties") },
          { label: hostel.name, href: propertyPath },
          { label: `Room ${room.name}` },
        ]}
        mobileStickyOffsetClass="top-14"
        actions={
          <div className="hidden rounded-full bg-emerald-light px-3 py-1 text-xs font-medium text-emerald md:inline-flex">
            {beds.filter((bed) => bed.status === "available").length} beds available
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.95fr]">
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1.3fr_0.7fr]">
            <button
              type="button"
              className="overflow-hidden rounded-xl"
              onClick={() => {
                setLightboxIndex(0);
                setLightboxOpen(true);
              }}
            >
              <img src={gallery[0]} alt={room.name} className="h-72 w-full rounded-xl object-cover transition hover:scale-[1.01]" />
            </button>
            <div className="grid gap-3">
              {gallery.slice(1, 3).map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  className="relative overflow-hidden rounded-xl"
                  onClick={() => {
                    setLightboxIndex(index + 1);
                    setLightboxOpen(true);
                  }}
                >
                  <img src={image} alt={`${room.name} ${index + 2}`} className="h-[141px] w-full rounded-xl object-cover transition hover:scale-[1.01]" />
                  {index === 1 && gallery.length > 3 ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-semibold text-white">
                      +{gallery.length - 3} more
                    </div>
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <h1 className="font-display text-3xl font-bold">Room {room.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {hostel.name} / {room.type} / floor {room.floor} / {room.genderPolicy.replace(/_/g, " ")}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {room.amenities.map((amenity) => (
                <span key={amenity} className="rounded-full bg-muted px-3 py-1 text-xs">{amenity}</span>
              ))}
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl bg-muted/60 p-4">
                <p className="text-xs text-muted-foreground">Semester</p>
                <p className="font-display text-xl font-semibold">{formatCurrency(room.pricePerSemester, currency)}</p>
              </div>
              <div className="rounded-xl bg-muted/60 p-4">
                <p className="text-xs text-muted-foreground">Academic year</p>
                <p className="font-display text-xl font-semibold">{formatCurrency(room.pricePerYear, currency)}</p>
              </div>
              <div className="rounded-xl bg-muted/60 p-4">
                <p className="text-xs text-muted-foreground">Vacation</p>
                <p className="font-display text-xl font-semibold">{formatCurrency(room.pricePerNight, currency)}/night</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5">
            <h2 className="font-display text-lg font-semibold">Reserve a bed</h2>
            <div className="mt-4 space-y-4">
              <div className="rounded-full bg-emerald-light px-3 py-1 text-xs font-medium text-emerald md:hidden">
                {beds.filter((bed) => bed.status === "available").length} beds available
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Period</label>
                <select
                  value={selectedPeriod?.id ?? ""}
                  onChange={(event) => setSelectedPeriodId(event.target.value)}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  {periods.map((period) => (
                    <option key={period.id} value={period.id}>{period.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Bed</label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {beds.map((bed) => {
                    const selectable = bed.status === "available";
                    const active = selectedBedId === bed.id;
                    return (
                      <button
                        key={bed.id}
                        type="button"
                        disabled={!selectable}
                        onClick={() => setSelectedBedId(bed.id)}
                        className={`rounded-lg border px-4 py-3 text-left ${active ? "border-emerald bg-emerald-light" : "border-border"} ${selectable ? "" : "opacity-50"}`}
                      >
                        <p className="font-medium">{bed.label}</p>
                        <p className="text-xs text-muted-foreground capitalize">{bed.status}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Discount code</label>
                <Input value={discountCode} onChange={(event) => setDiscountCode(event.target.value.toUpperCase())} placeholder="EARLY2026" />
                {discount ? <p className="text-xs text-emerald">{discount.percentage}% discount applied.</p> : null}
              </div>

              <div className="rounded-xl bg-muted/60 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Estimated total</span>
                  <span className="font-display text-2xl font-semibold">{formatCurrency(totalPrice, currency)}</span>
                </div>
              </div>

              <Button
                variant="emerald"
                className="w-full"
                disabled={!selectedBedId || !selectedPeriod}
                onClick={() => {
                  if (!selectedBedId || !selectedPeriod) return;
                  const draft = {
                    hostelId: hostel.id,
                    roomId: room.id,
                    bedId: selectedBedId,
                    periodId: selectedPeriod.id,
                    residentId: currentUser?.id,
                    amount: totalPrice,
                    durationLabel: selectedPeriod.name,
                    discountCode: discount?.code,
                  };

                  setPendingBooking(draft);

                  if (!currentUser || currentUser.role !== "resident") {
                    toast.info("Sign in as a resident to continue.");
                    navigate("/login");
                    return;
                  }

                  navigate("/payment");
                }}
              >
                Proceed to payment
              </Button>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald" />
              <div>
                <p className="font-medium">Secure demo flow</p>
                <p className="text-xs text-muted-foreground">Booking, payment, and notification records are created together.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl border-0 bg-black/95 p-4 text-white sm:rounded-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>{room.name} photo gallery</DialogTitle>
          </DialogHeader>
          <Carousel setApi={setCarouselApi} className="mx-auto w-full max-w-4xl">
            <CarouselContent>
              {gallery.map((image, index) => (
                <CarouselItem key={`${image}-${index}`}>
                  <div className="flex h-[70vh] items-center justify-center">
                    <img src={image} alt={`${room.name} preview ${index + 1}`} className="max-h-[70vh] w-full rounded-xl object-contain" />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-3 border-white/20 bg-black/40 text-white hover:bg-black/60" />
            <CarouselNext className="right-3 border-white/20 bg-black/40 text-white hover:bg-black/60" />
          </Carousel>
        </DialogContent>
      </Dialog>
    </div>
  );
}
