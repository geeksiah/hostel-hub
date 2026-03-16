import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock3, Copy, Mail, MapPin, MessageCircleMore, Share2, Star } from "lucide-react";
import { toast } from "sonner";
import hostelHero from "@/assets/hostel-hero.jpg";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselApi, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Container } from "@/components/shared/Container";
import { Grid } from "@/components/shared/Grid";
import { SurfacePanel } from "@/components/shared/SurfacePanel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/contexts/AppContext";
import { useSiteContext } from "@/contexts/SiteContext";
import { formatCurrency, getHostelCurrency } from "@/lib/currency";
import { getPropertyPath, getRoomPath, shouldUseAccountShell } from "@/lib/app-shell";
import { resolveImageSource, resolveRoomGallery } from "@/lib/media";
import { getRoomView } from "@/modules/catalog/selectors";
import { getSiteHostels } from "@/modules/site/selectors";
import { getRoomPriceForPeriod } from "@/services/store";
import { BookingService } from "@/services";

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
  const primaryImage = gallery[0] ?? resolveRoomGallery(hostel.coverImages)[0] ?? resolveImageSource(hostel.image, hostelHero);
  const previewImages = [primaryImage, ...gallery.filter((image) => image !== primaryImage)].slice(0, 4);
  const selectedPeriod = periods.find((period) => period.id === selectedPeriodId) ?? periods.find((period) => period.isActive) ?? periods[0];
  const discount = discountCodes.find((code) => code.code === discountCode.toUpperCase());
  const basePrice = getRoomPriceForPeriod(database, room, selectedPeriod);
  const totalPrice = discount ? Math.round(basePrice * ((100 - discount.percentage) / 100)) : basePrice;
  const currency = getHostelCurrency(database, hostel.id);
  const availableBeds = beds.filter((bed) => bed.status === "available");
  const selectedBed = beds.find((bed) => bed.id === selectedBedId);
  const summary = `${formatRoomType(room.type)} room on floor ${room.floor} with ${room.capacity} beds and ${room.amenities.slice(0, 3).join(", ")}.`;
  const shareTitle = `${hostel.name} ${formatRoomType(room.type)} room ${room.name}`;
  const detailRows = [
    { label: "Guests", value: `${room.capacity}` },
    { label: "Policy", value: formatPolicy(room.genderPolicy) },
    { label: "Check-in", value: hostel.checkInTime },
    { label: "Check-out", value: hostel.checkOutTime },
  ];
  const hasBottomNav = Boolean(currentUser && ["resident", "group_organizer"].includes(currentUser.role));

  useEffect(() => {
    if (!selectedBedId && availableBeds[0]) {
      setSelectedBedId(availableBeds[0].id);
    }
  }, [availableBeds, selectedBedId]);

  if (shouldUseAccountShell(currentUser) && location.pathname !== roomPath) {
    return <Navigate to={roomPath} replace />;
  }

  const primaryActionLabel = availableBeds.length ? `Book for ${formatCurrency(totalPrice, currency)} now` : "Join waitlist";
  const mobileStickyCta =
    typeof document !== "undefined"
      ? createPortal(
          <div
            className={`fixed inset-x-0 z-[45] border-t border-border/70 bg-card px-4 py-3 shadow-[0_-8px_24px_rgba(16,24,40,0.08)] md:hidden ${
              hasBottomNav ? "bottom-[72px]" : "bottom-0 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]"
            }`}
          >
            <Button variant="emerald" size="lg" className="w-full" onClick={() => void handleContinue()}>
              {primaryActionLabel}
            </Button>
          </div>,
          document.body,
        )
      : null;

  const getShareUrl = () => (typeof window !== "undefined" ? window.location.href : "");

  const copyShareLink = async () => {
    const shareUrl = getShareUrl();
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied.");
    } catch {
      toast.error("Could not copy the link.");
    }
  };

  const shareOnMobile = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: shareTitle, url: getShareUrl() });
        return;
      }
    } catch {
      return;
    }

    await copyShareLink();
  };

  const openWhatsAppShare = () => {
    const shareUrl = getShareUrl();
    if (!shareUrl || typeof window === "undefined") return;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareTitle} ${shareUrl}`)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const openEmailShare = () => {
    const shareUrl = getShareUrl();
    if (!shareUrl || typeof window === "undefined") return;

    const mailtoUrl = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(
      `Take a look at this room:\n${shareUrl}`,
    )}`;
    window.location.href = mailtoUrl;
  };

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
    <div className={`pt-5 md:pt-8 ${hasBottomNav ? "pb-48" : "pb-32 md:pb-20"}`}>
      <Container className="space-y-12 md:space-y-14">
        <div className="flex items-center justify-between gap-4">
          <Button variant="outline" className="rounded-full" onClick={() => navigate(propertyPath)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center">
            <Button variant="outline" className="rounded-full md:hidden" onClick={() => void shareOnMobile()}>
              <Share2 className="h-4 w-4" />
              Share
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="hidden rounded-full md:inline-flex">
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => void copyShareLink()}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={openWhatsAppShare}>
                  <MessageCircleMore className="mr-2 h-4 w-4" />
                  Share to WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem onClick={openEmailShare}>
                  <Mail className="mr-2 h-4 w-4" />
                  Email link
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <section className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12">
          <div className="space-y-5">
            <button
              type="button"
              className="hero-surface relative block min-h-[280px] w-full overflow-hidden bg-muted text-left sm:min-h-[340px] md:min-h-[520px]"
              onClick={() => {
                setLightboxIndex(0);
                setLightboxOpen(true);
              }}
            >
              <img src={primaryImage} alt={room.name} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-slate-950/28" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/94 via-slate-950/58 to-slate-950/16" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white md:p-7">
                <div className="max-w-2xl rounded-[18px] border border-white/14 bg-[rgba(2,6,23,0.62)] p-4 shadow-[0_12px_32px_rgba(15,23,42,0.24)] sm:rounded-[24px] sm:p-5">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-white/88">
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
                    <div className="min-w-0">
                      <p className="text-sm text-white/80">{hostel.name}</p>
                      <h1 className="mt-1 font-display text-[1.85rem] font-semibold leading-[1.02] tracking-tight md:text-[2.6rem]">
                        {formatRoomType(room.type)} room {room.name}
                      </h1>
                    </div>
                    <Badge variant="secondary" className="w-fit bg-white text-slate-950 hover:bg-white">
                      {availableBeds.length ? `${availableBeds.length} beds open` : "Waitlist open"}
                    </Badge>
                  </div>
                </div>
              </div>
            </button>

            <div className="grid grid-cols-4 gap-3">
              {previewImages.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  className="relative overflow-hidden rounded-[14px] border border-border/70 bg-card sm:rounded-[18px]"
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
              <div className="space-y-7">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:gap-6">
                  <div className="min-w-0 space-y-2">
                    <p className="text-[12px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Reserve room</p>
                    <h2 className="text-[1.38rem] font-bold leading-[0.96] tracking-tight text-foreground capitalize sm:text-[1.9rem] sm:font-semibold">
                      {formatRoomType(room.type)} room
                    </h2>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground sm:text-[12px] sm:tracking-[0.22em]">
                      {selectedPeriod?.type === "year" ? "Per year" : selectedPeriod?.type === "vacation" ? "Vacation stay" : "Per semester"}
                    </p>
                    <p className="mt-2 whitespace-nowrap font-display text-[1.6rem] font-bold leading-none tracking-tight text-foreground sm:text-[2rem] sm:font-semibold">
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

        <Grid className="gap-6 lg:grid-cols-[1.05fr_0.95fr]">
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

        {mobileStickyCta}

        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-5xl border-0 bg-black/95 p-4 text-white sm:rounded-2xl">
            <DialogHeader className="sr-only">
              <DialogTitle>{room.name} photo gallery</DialogTitle>
            </DialogHeader>
            <Carousel setApi={setCarouselApi} className="mx-auto w-full max-w-4xl">
              <CarouselContent>
                {[primaryImage, ...gallery.filter((image) => image !== primaryImage)].map((image, index) => (
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
