import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock3, MapPin, Share2, Star } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselApi, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Container } from "@/components/shared/Container";
import { Grid } from "@/components/shared/Grid";
import { SurfacePanel } from "@/components/shared/SurfacePanel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/contexts/AppContext";
import { useSiteContext } from "@/contexts/SiteContext";
import { formatCurrency, getHostelCurrency } from "@/lib/currency";
import { getPropertyPath, getRoomPath, shouldUseAccountShell } from "@/lib/app-shell";
import { resolveRoomGallery } from "@/lib/media";
import { getRoomView } from "@/modules/catalog/selectors";
import { getSiteHostels } from "@/modules/site/selectors";
import { BookingService } from "@/services";

function resolveRoomPrice(periodType: "semester" | "year" | "vacation" | undefined, semester: number, year: number, nightly: number) {
  if (periodType === "year") return year;
  if (periodType === "vacation") return nightly * 45;
  return semester;
}

function formatRoomType(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function formatPolicy(value: string) {
  return value.replace(/_/g, " ");
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
  const loginPath = buildPublicPath("/login");
  const gallery = resolveRoomGallery(room.images);
  const selectedPeriod = periods.find((period) => period.id === selectedPeriodId) ?? periods.find((period) => period.isActive) ?? periods[0];
  const discount = discountCodes.find((code) => code.code === discountCode.toUpperCase());
  const basePrice = resolveRoomPrice(selectedPeriod?.type, room.pricePerSemester, room.pricePerYear, room.pricePerNight);
  const totalPrice = discount ? Math.round(basePrice * ((100 - discount.percentage) / 100)) : basePrice;
  const currency = getHostelCurrency(database, hostel.id);
  const availableBeds = beds.filter((bed) => bed.status === "available");
  const selectedBed = beds.find((bed) => bed.id === selectedBedId);
  const summary = `${formatRoomType(room.type)} room on floor ${room.floor} with ${room.capacity} beds and ${room.amenities.slice(0, 3).join(", ")}.`;
  const detailRows = [
    { label: "Guests", value: `${room.capacity}` },
    { label: "Policy", value: formatPolicy(room.genderPolicy) },
    { label: "Check-in", value: hostel.checkInTime },
    { label: "Check-out", value: hostel.checkOutTime },
  ];

  useEffect(() => {
    if (!selectedBedId && availableBeds[0]) {
      setSelectedBedId(availableBeds[0].id);
    }
  }, [availableBeds, selectedBedId]);

  if (shouldUseAccountShell(currentUser) && location.pathname !== roomPath) {
    return <Navigate to={roomPath} replace />;
  }

  const primaryActionLabel = availableBeds.length ? `Book for ${formatCurrency(totalPrice, currency)} now` : "Join waitlist";

  const handleContinue = async () => {
    if (!selectedPeriod) return;

    if (availableBeds.length === 0) {
      if (!currentUser || currentUser.role !== "resident") {
        toast.info("Sign in as a resident to join the waiting list.");
        navigate(loginPath);
        return;
      }

      await BookingService.joinWaitingList({
        residentId: currentUser.id,
        hostelId: hostel.id,
        roomType: room.type,
        periodId: selectedPeriod.id,
      });
      toast.success("Added to waiting list.");
      return;
    }

    if (!selectedBedId) {
      toast.info("Choose a bed to continue.");
      return;
    }

    setPendingBooking({
      hostelId: hostel.id,
      roomId: room.id,
      bedId: selectedBedId,
      periodId: selectedPeriod.id,
      residentId: currentUser?.id,
      amount: totalPrice,
      durationLabel: selectedPeriod.name,
      discountCode: discount?.code,
    });

    if (!currentUser || currentUser.role !== "resident") {
      toast.info("Sign in as a resident to continue.");
      navigate(loginPath);
      return;
    }

    navigate("/payment");
  };

  return (
    <div className="pb-28 pt-4 md:pb-20 md:pt-6">
      <Container className="space-y-8 md:space-y-10">
        <div className="flex items-center justify-between gap-4">
          <Button variant="outline" className="rounded-full" onClick={() => navigate(propertyPath)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={async () => {
              try {
                if (typeof navigator !== "undefined" && navigator.share) {
                  await navigator.share({ title: `${hostel.name} Room ${room.name}`, url: window.location.href });
                  return;
                }
              } catch {
                return;
              }
              toast.info("Share this page from your browser menu.");
            }}
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="space-y-4">
            <button
              type="button"
              className="hero-surface relative min-h-[360px] overflow-hidden text-left md:min-h-[520px]"
              onClick={() => {
                setLightboxIndex(0);
                setLightboxOpen(true);
              }}
            >
              <img src={gallery[0]} alt={room.name} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/72 via-slate-950/18 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white md:p-7">
                <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {hostel.location}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Star className="h-4 w-4 fill-current text-amber" />
                    {hostel.rating.toFixed(1)}
                  </span>
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm text-white/70">{hostel.name}</p>
                    <h1 className="mt-1 font-display text-[2rem] font-semibold leading-[1.02] tracking-tight md:text-[2.6rem]">
                      {formatRoomType(room.type)} room {room.name}
                    </h1>
                  </div>
                  <Badge variant="secondary" className="w-fit bg-white/12 text-white hover:bg-white/12">
                    {availableBeds.length ? `${availableBeds.length} beds open` : "Waitlist open"}
                  </Badge>
                </div>
              </div>
            </button>

            <div className="grid grid-cols-4 gap-3">
              {gallery.slice(0, 4).map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  className="relative overflow-hidden rounded-[18px] border border-border/70 bg-card"
                  onClick={() => {
                    setLightboxIndex(index);
                    setLightboxOpen(true);
                  }}
                >
                  <img src={image} alt={`${room.name} ${index + 1}`} className="h-24 w-full object-cover md:h-28" />
                  {index === 3 && gallery.length > 4 ? (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-semibold text-white">
                      +{gallery.length - 4}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <SurfacePanel className="p-6 sm:p-8">
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-[12px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Reserve room</p>
                    <h2 className="text-[1.95rem] font-semibold leading-none tracking-tight text-foreground capitalize">
                      {formatRoomType(room.type)} room
                    </h2>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                      {selectedPeriod?.type === "year" ? "Per year" : selectedPeriod?.type === "vacation" ? "Vacation stay" : "Per semester"}
                    </p>
                    <p className="mt-2 font-display text-[2rem] font-semibold tracking-tight text-foreground">
                      {formatCurrency(basePrice, currency)}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-sm leading-7 text-muted-foreground">{summary}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{selectedPeriod?.name ?? "Current stay"}</Badge>
                    <Badge variant="secondary">{availableBeds.length ? `${availableBeds.length} beds open` : "Waitlist open"}</Badge>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2.5">
                    <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Stay period</p>
                    <Select value={selectedPeriod?.id ?? ""} onValueChange={setSelectedPeriodId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select stay period" />
                      </SelectTrigger>
                      <SelectContent>
                        {periods.map((period) => (
                          <SelectItem key={period.id} value={period.id}>
                            {period.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {availableBeds.length ? (
                    <div className="space-y-2.5">
                      <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Bed</p>
                      <Select value={selectedBedId} onValueChange={setSelectedBedId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a bed" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableBeds.map((bed) => (
                            <SelectItem key={bed.id} value={bed.id}>
                              {bed.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}

                  <div className="space-y-2.5">
                    <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Promo code</p>
                    <Input
                      value={discountCode}
                      onChange={(event) => setDiscountCode(event.target.value.toUpperCase())}
                      placeholder="Optional"
                    />
                    {discount ? <p className="text-xs font-medium text-emerald">{discount.percentage}% discount applied.</p> : null}
                  </div>
                </div>

                <div className="space-y-3 border-t border-border/70 pt-5">
                  {availableBeds.length ? (
                    <p className="text-sm text-muted-foreground">
                      {selectedBed ? `${selectedBed.label} selected.` : "Select a bed to continue."}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">This room is full right now. Join the waitlist to hold your place.</p>
                  )}

                  <Button variant="emerald" size="lg" className="w-full" onClick={() => void handleContinue()}>
                    {primaryActionLabel}
                  </Button>
                </div>
              </div>
            </SurfacePanel>
          </aside>
        </section>

        <Grid className="lg:grid-cols-[1.05fr_0.95fr]">
          <SurfacePanel title="Overview">
            <div className="grid gap-3 sm:grid-cols-2">
              {detailRows.map((item) => (
                <div key={item.label} className="rounded-[16px] bg-muted/35 px-4 py-4">
                  <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
                  <p className="mt-2 text-sm font-medium capitalize text-foreground">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {room.amenities.map((amenity) => (
                <Badge key={amenity} variant="outline">
                  {amenity}
                </Badge>
              ))}
            </div>
          </SurfacePanel>

          <SurfacePanel title="Stay details">
            <div className="space-y-4 text-sm leading-6 text-muted-foreground">
              <div className="rounded-[16px] bg-muted/35 px-4 py-4">
                <p className="inline-flex items-center gap-2 text-foreground">
                  <Clock3 className="h-4 w-4 text-muted-foreground" />
                  Check-in from {hostel.checkInTime}, check-out by {hostel.checkOutTime}
                </p>
              </div>
              <div className="rounded-[16px] bg-muted/35 px-4 py-4">
                <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-muted-foreground">House rules</p>
                <div className="mt-3 space-y-2">
                  {hostel.rules.slice(0, 3).map((rule) => (
                    <p key={rule}>{rule}</p>
                  ))}
                </div>
              </div>
            </div>
          </SurfacePanel>
        </Grid>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-card p-4 md:hidden">
          <Button variant="emerald" size="lg" className="w-full" onClick={() => void handleContinue()}>
            {primaryActionLabel}
          </Button>
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
      </Container>
    </div>
  );
}
