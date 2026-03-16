import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Mail, MapPin, Phone, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { Container } from "@/components/shared/Container";
import { Grid } from "@/components/shared/Grid";
import { SelectField } from "@/components/shared/SelectField";
import { RevealTransition } from "@/components/shared/motion";
import { Section } from "@/components/shared/Section";
import { SurfacePanel } from "@/components/shared/SurfacePanel";
import { Slider } from "@/components/ui/slider";
import { useApp } from "@/contexts/AppContext";
import { useSiteContext } from "@/contexts/SiteContext";
import { formatCurrency, getHostelCurrency } from "@/lib/currency";
import { getBrowsePath, getPropertyPath, getRoomPath, shouldUseAccountShell } from "@/lib/app-shell";
import { resolveRoomGallery } from "@/lib/media";
import { getHostelView } from "@/modules/catalog/selectors";
import { getSiteHostels } from "@/modules/site/selectors";
import { getRoomPriceForPeriod, roomHasActiveRateForPeriod } from "@/services/store";

function formatRoomType(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

export default function HostelDetailPage() {
  const { hostelId = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { database, currentUser } = useApp();
  const { publicSite, preferredSite, buildPublicPath } = useSiteContext();
  const [roomType, setRoomType] = useState<"all" | "single" | "double" | "triple" | "quad">("all");
  const [selectedPeriodId, setSelectedPeriodId] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [priceDraft, setPriceDraft] = useState<[number, number]>([0, 0]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const roomTypeOptions = [
    { value: "all", label: "All room types" },
    { value: "single", label: "Single" },
    { value: "double", label: "Double" },
    { value: "triple", label: "Triple" },
    { value: "quad", label: "Quad" },
  ];

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
  const selectedPeriod = periods.find((period) => period.id === selectedPeriodId) ?? activePeriod ?? periods[0];

  const roomPrices = rooms
    .filter((room) => !selectedPeriod || roomHasActiveRateForPeriod(database, room.id, selectedPeriod.id))
    .map((room) => getRoomPriceForPeriod(database, room, selectedPeriod));
  const minPrice = roomPrices.length ? Math.min(...roomPrices) : 0;
  const maxPrice = roomPrices.length ? Math.max(...roomPrices) : 10000;

  useEffect(() => {
    if (!selectedPeriodId && selectedPeriod?.id) {
      setSelectedPeriodId(selectedPeriod.id);
    }
  }, [selectedPeriod?.id, selectedPeriodId]);

  useEffect(() => {
    const nextRange: [number, number] = [minPrice, maxPrice];
    setPriceRange((current) => (current[0] === 0 && current[1] === 0 ? nextRange : current));
    setPriceDraft((current) => (current[0] === 0 && current[1] === 0 ? nextRange : current));
  }, [maxPrice, minPrice]);

  useEffect(() => {
    setPriceDraft(priceRange);
  }, [priceRange]);

  const filterPanel = (
    <SurfacePanel className="p-5 sm:p-6">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1.2fr] xl:items-end">
        <SelectField
          label="Room type"
          value={roomType}
          onValueChange={(value) => setRoomType(value as typeof roomType)}
          options={roomTypeOptions}
          placeholder="All room types"
        />

        <SelectField
          label="Stay period"
          value={selectedPeriod?.id ?? ""}
          onValueChange={setSelectedPeriodId}
          options={periods.map((period) => ({ value: period.id, label: period.name }))}
          placeholder="Select stay period"
        />

        <div className="min-w-0 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Price range</p>
            <p className="text-sm font-medium text-foreground">
              {formatCurrency(priceDraft[0], currency)} - {formatCurrency(priceDraft[1], currency)}
            </p>
          </div>
          <Slider
            min={minPrice}
            max={maxPrice}
            step={50}
            value={priceDraft}
            onValueChange={(value) => setPriceDraft([value[0], value[1]])}
            onValueCommit={(value) => setPriceRange([value[0], value[1]])}
            className="py-2"
          />
        </div>
      </div>
    </SurfacePanel>
  );

  const filteredRooms = useMemo(
    () =>
      [...rooms]
        .filter((room) => {
          const price = getRoomPriceForPeriod(database, room, selectedPeriod);
          const matchesType = roomType === "all" || room.type === roomType;
          const matchesPrice = price >= priceRange[0] && price <= priceRange[1];
          const matchesPeriod = selectedPeriod ? roomHasActiveRateForPeriod(database, room.id, selectedPeriod.id) : true;
          return matchesType && matchesPrice && matchesPeriod;
        })
        .sort((left, right) => {
          const leftAvailable = database?.beds.filter((bed) => bed.roomId === left.id && bed.status === "available").length ?? 0;
          const rightAvailable = database?.beds.filter((bed) => bed.roomId === right.id && bed.status === "available").length ?? 0;
          if (rightAvailable !== leftAvailable) return rightAvailable - leftAvailable;
          return getRoomPriceForPeriod(database, left, selectedPeriod)
            - getRoomPriceForPeriod(database, right, selectedPeriod);
        }),
    [database, priceRange, roomType, rooms, selectedPeriod],
  );

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
    <div className="pb-20 pt-5 md:pb-24 md:pt-8">
      <Container className="space-y-12 md:space-y-14">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-4">
            <Button variant="outline" className="rounded-full" onClick={() => navigate(browsePath)}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="space-y-2">
              <h1 className="font-display text-[2.2rem] font-semibold leading-[1.02] tracking-tight text-foreground sm:text-[2.8rem]">
                {hostel.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {hostel.location}
                </span>
                <Badge variant="outline">{filteredRooms.length} rooms</Badge>
              </div>
            </div>
          </div>

          <Button variant="outline" className="rounded-full md:hidden" onClick={() => setFiltersOpen((open) => !open)}>
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </Button>
        </div>

        <RevealTransition show={filtersOpen} className="md:hidden">
          {filterPanel}
        </RevealTransition>
        <div className="hidden md:block">
          {filterPanel}
        </div>

        <Section title="Available rooms" description="Choose the room type and stay period that fits best.">
          {filteredRooms.length === 0 ? (
            <EmptyState title="No rooms match this view" description="Try another room type or widen the price range." />
          ) : null}

          {filteredRooms.length ? (
            <Grid className="gap-7 md:grid-cols-2 xl:grid-cols-3">
              {filteredRooms.map((room) => {
                const availableBeds = database.beds.filter((bed) => bed.roomId === room.id && bed.status === "available").length;
                const displayedPrice = getRoomPriceForPeriod(database, room, selectedPeriod);
                const roomImage = resolveRoomGallery(room.images)[0] ?? resolveRoomGallery(hostel.coverImages)[0] ?? hostel.image;

                return (
                  <article key={room.id} className="surface-card flex h-full flex-col overflow-hidden">
                    <button type="button" className="block overflow-hidden" onClick={() => navigate(getRoomPath(currentUser, room.id, buildPublicPath))}>
                      <img src={roomImage} alt={room.name} className="h-60 w-full object-cover transition duration-300 hover:scale-[1.02]" />
                    </button>

                    <div className="flex flex-1 flex-col gap-6 p-6 sm:p-7">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <h2 className="text-lg font-semibold tracking-tight text-foreground capitalize">{formatRoomType(room.type)} room</h2>
                          <p className="text-sm text-muted-foreground">Room {room.name} / Floor {room.floor} / {room.capacity} beds</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">{availableBeds > 0 ? `${availableBeds} beds open` : "Waitlist open"}</Badge>
                          <Badge variant="outline">{selectedPeriod?.name ?? "Current stay"}</Badge>
                          {room.amenities.slice(0, 2).map((amenity) => (
                            <Badge key={amenity} variant="outline">
                              {amenity}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="mt-auto flex items-end justify-between gap-4 border-t border-border/70 pt-5">
                        <div>
                          <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-muted-foreground">From</p>
                          <p className="mt-2 text-xl font-semibold tracking-tight text-foreground">{formatCurrency(displayedPrice, currency)}</p>
                        </div>
                        <Button variant="outline" onClick={() => navigate(getRoomPath(currentUser, room.id, buildPublicPath))}>
                          View room
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </Grid>
          ) : null}
        </Section>

        <SurfacePanel title="Contact">
          <div className="grid gap-3 text-sm text-foreground/90">
            <div className="flex items-center justify-between gap-3 rounded-[16px] bg-muted/35 px-4 py-3">
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                Phone
              </span>
              <span className="font-medium">{hostel.contact.phone}</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-[16px] bg-muted/35 px-4 py-3">
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                Email
              </span>
              <span className="font-medium">{hostel.contact.email}</span>
            </div>
          </div>
        </SurfacePanel>
      </Container>
    </div>
  );
}
