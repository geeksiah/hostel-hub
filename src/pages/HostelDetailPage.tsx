import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams, Navigate } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { BackBreadcrumbHeader } from "@/components/shared/BackBreadcrumbHeader";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselApi, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RatingStars } from "@/components/shared/RatingStars";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useApp } from "@/contexts/AppContext";
import { useSiteContext } from "@/contexts/SiteContext";
import { formatCurrency, getHostelCurrency } from "@/lib/currency";
import { getBrowsePath, getPropertyPath, getRoomPath, shouldUseAccountShell } from "@/lib/app-shell";
import { resolveRoomGallery } from "@/lib/media";
import { getHostelView } from "@/modules/catalog/selectors";
import { getSiteHostels } from "@/modules/site/selectors";
import { BookingService } from "@/services";

function resolveRoomPrice(periodType: "semester" | "year" | "vacation" | undefined, semester: number, year: number, nightly: number) {
  if (periodType === "year") return year;
  if (periodType === "vacation") return nightly * 45;
  return semester;
}

export default function HostelDetailPage() {
  const { hostelId = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { database, currentUser, refreshData } = useApp();
  const { publicSite, preferredSite, buildPublicPath } = useSiteContext();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [roomType, setRoomType] = useState<"all" | "single" | "double" | "triple" | "quad">("all");
  const [selectedPeriodId, setSelectedPeriodId] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);

  useEffect(() => {
    if (lightboxOpen) carouselApi?.scrollTo(lightboxIndex);
  }, [carouselApi, lightboxIndex, lightboxOpen]);

  const { hostel, rooms, periods, activePeriod } = useMemo(
    () => (database ? getHostelView(database, hostelId) : { hostel: undefined, rooms: [], periods: [], activePeriod: undefined }),
    [database, hostelId],
  );
  const site = publicSite ?? preferredSite;
  const allowedHostels = useMemo(
    () => new Set(database ? getSiteHostels(database, site).map((item) => item.id) : []),
    [database, site],
  );
  const currency = database ? getHostelCurrency(database, hostelId) : "GHS";
  const browsePath = getBrowsePath(currentUser, buildPublicPath);
  const propertyPath = getPropertyPath(currentUser, hostelId, buildPublicPath);
  const gallery = resolveRoomGallery(hostel?.coverImages);
  const heroCards = gallery.slice(0, 3);
  const selectedPeriod = periods.find((period) => period.id === selectedPeriodId) ?? activePeriod ?? periods[0];
  const maxPriceForPeriod = rooms.length
    ? Math.max(...rooms.map((room) => resolveRoomPrice(selectedPeriod?.type, room.pricePerSemester, room.pricePerYear, room.pricePerNight)))
    : 0;

  useEffect(() => {
    if (!selectedPeriodId && selectedPeriod?.id) {
      setSelectedPeriodId(selectedPeriod.id);
    }
  }, [selectedPeriod?.id, selectedPeriodId]);

  useEffect(() => {
    setPriceRange([0, maxPriceForPeriod]);
  }, [maxPriceForPeriod, selectedPeriod?.id]);

  const filteredRooms = useMemo(
    () =>
      rooms.filter((room) => {
        const nextPrice = resolveRoomPrice(selectedPeriod?.type, room.pricePerSemester, room.pricePerYear, room.pricePerNight);
        const matchesType = roomType === "all" || room.type === roomType;
        const matchesPrice = nextPrice >= priceRange[0] && nextPrice <= priceRange[1];
        return matchesType && matchesPrice;
      }),
    [priceRange, roomType, rooms, selectedPeriod?.type],
  );
  const selectedPriceLabel =
    selectedPeriod?.type === "year" ? "Academic year price" : selectedPeriod?.type === "vacation" ? "Vacation estimate" : "Semester price";

  if (!database) return <div className="container py-10">Loading hostel...</div>;

  if (!hostel || !allowedHostels.has(hostel.id)) {
    return (
      <div className="container py-12">
        <EmptyState title="Property not found" description="The selected property is unavailable for this site." />
      </div>
    );
  }

  if (shouldUseAccountShell(currentUser) && location.pathname !== propertyPath) {
    return <Navigate to={propertyPath} replace />;
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-6 py-6">
      <BackBreadcrumbHeader
        title={hostel.name}
        backHref={browsePath}
        backLabel="Back to rooms"
        breadcrumbs={[
          { label: "Rooms", href: browsePath },
          { label: hostel.name },
        ]}
        mobileStickyOffsetClass="top-14"
        actions={
          <div className="hidden items-center gap-2 md:flex">
            <StatusBadge status={`${hostel.availableBeds} beds open`} variant="success" />
            <StatusBadge status={hostel.genderPolicy.replace(/_/g, " ")} variant="info" />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.95fr]">
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
            <button
              type="button"
              className="overflow-hidden rounded-xl"
              onClick={() => {
                setLightboxIndex(0);
                setLightboxOpen(true);
              }}
            >
              <img src={heroCards[0]} alt={hostel.name} className="h-72 w-full rounded-xl object-cover transition hover:scale-[1.01]" />
            </button>
            <div className="grid gap-3">
              {heroCards.slice(1).map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  className="relative overflow-hidden rounded-xl"
                  onClick={() => {
                    setLightboxIndex(index + 1);
                    setLightboxOpen(true);
                  }}
                >
                  <img src={image} alt={`${hostel.name} ${index + 2}`} className="h-36 w-full rounded-xl object-cover transition hover:scale-[1.01]" />
                  {index === 1 && gallery.length > 3 ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-semibold text-white">
                      +{gallery.length - 3} more
                    </div>
                  ) : null}
                </button>
              ))}
              <div className="rounded-xl border bg-card p-4">
                <p className="text-xs text-muted-foreground">Selected stay</p>
                <p className="mt-1 font-display text-lg font-semibold">{selectedPeriod?.name ?? "Flexible stay"}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedPeriod ? `${selectedPeriod.startDate} to ${selectedPeriod.endDate}` : "Select a period inside a room."}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="font-display text-3xl font-bold">{hostel.name}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {hostel.location}
                  </span>
                  <span>{hostel.university}</span>
                  <RatingStars rating={hostel.rating} />
                </div>
              </div>
              <div className="rounded-xl bg-muted px-4 py-3 text-right">
                <p className="text-xs text-muted-foreground">Starting from</p>
                <p className="font-display text-2xl font-semibold">
                  {formatCurrency(
                    rooms.length
                      ? Math.min(...rooms.map((room) => resolveRoomPrice(selectedPeriod?.type, room.pricePerSemester, room.pricePerYear, room.pricePerNight)))
                      : 0,
                    currency,
                  )}
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">{hostel.description}</p>

            <div className="mt-5 rounded-xl border bg-muted/30 p-4">
              <div className="grid gap-3 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Room type</Label>
                  <select
                    value={roomType}
                    onChange={(event) => setRoomType(event.target.value as typeof roomType)}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="all">All room types</option>
                    <option value="single">Single</option>
                    <option value="double">Double</option>
                    <option value="triple">Triple</option>
                    <option value="quad">Quad</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Stay period</Label>
                  <select
                    value={selectedPeriod?.id ?? ""}
                    onChange={(event) => setSelectedPeriodId(event.target.value)}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    {periods.map((period) => (
                      <option key={period.id} value={period.id}>
                        {period.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Min price</Label>
                  <Input
                    type="number"
                    min={0}
                    value={priceRange[0]}
                    onChange={(event) => setPriceRange([Math.max(0, Number(event.target.value || 0)), priceRange[1]])}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max price</Label>
                  <Input
                    type="number"
                    min={0}
                    value={priceRange[1]}
                    onChange={(event) => setPriceRange([priceRange[0], Math.max(0, Number(event.target.value || 0))])}
                  />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {filteredRooms.length} room types match this availability view.
              </p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-muted/60 p-4">
                <h2 className="font-display text-lg font-semibold">Contact</h2>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{hostel.contact.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{hostel.contact.email}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-muted/60 p-4">
                <h2 className="font-display text-lg font-semibold">House rules</h2>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {hostel.rules.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold">Rooms and availability</h2>
              <p className="text-sm text-muted-foreground">{selectedPeriod?.name ?? "Current stay view"}</p>
            </div>
            <div className="rounded-xl bg-muted px-4 py-3 text-right">
              <p className="text-xs text-muted-foreground">Price view</p>
              <p className="font-medium">{selectedPriceLabel}</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {filteredRooms.length === 0 ? (
              <EmptyState title="No rooms match these filters" description="Try a different room type or widen the price range." />
            ) : null}
            {filteredRooms.map((room, index) => {
              const availableBeds = database.beds.filter((bed) => bed.roomId === room.id && bed.status === "available").length;
              const displayedPrice = resolveRoomPrice(selectedPeriod?.type, room.pricePerSemester, room.pricePerYear, room.pricePerNight);
              return (
                <div key={room.id} className="rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-lg font-semibold capitalize">{room.type} room</h3>
                      <p className="text-sm text-muted-foreground">
                        Room {room.name} / floor {room.floor} / {room.capacity} beds
                      </p>
                    </div>
                    <StatusBadge status={availableBeds > 0 ? `${availableBeds} available` : "full"} variant={availableBeds > 0 ? "success" : "warning"} />
                  </div>

                  <button
                    type="button"
                    className="mt-3 block w-full overflow-hidden rounded-lg"
                    onClick={() => navigate(getRoomPath(currentUser, room.id, buildPublicPath))}
                  >
                    <img src={resolveRoomGallery(room.images)[0]} alt={room.name} className="h-36 w-full rounded-lg object-cover transition hover:scale-[1.01]" />
                  </button>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {room.amenities.map((amenity) => (
                      <span key={amenity} className="rounded-full bg-muted px-2.5 py-1 text-xs">{amenity}</span>
                    ))}
                  </div>

                  <div className="mt-4 space-y-3 sm:flex sm:items-end sm:justify-between sm:space-y-0">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{selectedPriceLabel}</p>
                      <p className="font-display text-2xl font-semibold leading-none whitespace-nowrap">{formatCurrency(displayedPrice, currency)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                      {availableBeds === 0 ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={async () => {
                            if (!currentUser || currentUser.role !== "resident") {
                              toast.info("Sign in as a resident to join the waiting list.");
                              navigate("/login");
                              return;
                            }
                            await BookingService.joinWaitingList({
                              residentId: currentUser.id,
                              hostelId: hostel.id,
                              roomType: room.type,
                              periodId: selectedPeriod?.id ?? "",
                            });
                            await refreshData();
                            toast.success("Added to waiting list.");
                          }}
                        >
                          Join waitlist
                        </Button>
                      ) : null}
                      <Button variant="emerald" size="sm" className="w-full sm:w-auto" onClick={() => navigate(getRoomPath(currentUser, room.id, buildPublicPath))}>
                        Book bed
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl border-0 bg-black/95 p-4 text-white sm:rounded-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>{hostel.name} photo gallery</DialogTitle>
          </DialogHeader>
          <Carousel setApi={setCarouselApi} className="mx-auto w-full max-w-4xl">
            <CarouselContent>
              {gallery.map((image, index) => (
                <CarouselItem key={`${image}-${index}`}>
                  <div className="flex h-[70vh] items-center justify-center">
                    <img src={image} alt={`${hostel.name} preview ${index + 1}`} className="max-h-[70vh] w-full rounded-xl object-contain" />
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
