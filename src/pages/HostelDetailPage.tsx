import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Mail, MapPin, Phone, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { Container } from "@/components/shared/Container";
import { Grid } from "@/components/shared/Grid";
import { Section } from "@/components/shared/Section";
import { SurfacePanel } from "@/components/shared/SurfacePanel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useApp } from "@/contexts/AppContext";
import { useSiteContext } from "@/contexts/SiteContext";
import { formatCurrency, getHostelCurrency } from "@/lib/currency";
import { getBrowsePath, getPropertyPath, getRoomPath, shouldUseAccountShell } from "@/lib/app-shell";
import { resolveRoomGallery } from "@/lib/media";
import { getHostelView } from "@/modules/catalog/selectors";
import { getSiteHostels } from "@/modules/site/selectors";

function resolveRoomPrice(periodType: "semester" | "year" | "vacation" | undefined, semester: number, year: number, nightly: number) {
  if (periodType === "year") return year;
  if (periodType === "vacation") return nightly * 45;
  return semester;
}

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
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  const roomPrices = rooms.map((room) => resolveRoomPrice(selectedPeriod?.type, room.pricePerSemester, room.pricePerYear, room.pricePerNight));
  const minPrice = roomPrices.length ? Math.min(...roomPrices) : 0;
  const maxPrice = roomPrices.length ? Math.max(...roomPrices) : 10000;

  useEffect(() => {
    if (!selectedPeriodId && selectedPeriod?.id) {
      setSelectedPeriodId(selectedPeriod.id);
    }
  }, [selectedPeriod?.id, selectedPeriodId]);

  useEffect(() => {
    setPriceRange((current) => {
      if (current[0] === 0 && current[1] === 0) return [minPrice, maxPrice];
      return current;
    });
  }, [maxPrice, minPrice]);

  const filteredRooms = useMemo(
    () =>
      [...rooms]
        .filter((room) => {
          const price = resolveRoomPrice(selectedPeriod?.type, room.pricePerSemester, room.pricePerYear, room.pricePerNight);
          const matchesType = roomType === "all" || room.type === roomType;
          const matchesPrice = price >= priceRange[0] && price <= priceRange[1];
          return matchesType && matchesPrice;
        })
        .sort((left, right) => {
          const leftAvailable = database?.beds.filter((bed) => bed.roomId === left.id && bed.status === "available").length ?? 0;
          const rightAvailable = database?.beds.filter((bed) => bed.roomId === right.id && bed.status === "available").length ?? 0;
          if (rightAvailable !== leftAvailable) return rightAvailable - leftAvailable;
          return resolveRoomPrice(selectedPeriod?.type, left.pricePerSemester, left.pricePerYear, left.pricePerNight)
            - resolveRoomPrice(selectedPeriod?.type, right.pricePerSemester, right.pricePerYear, right.pricePerNight);
        }),
    [database?.beds, priceRange, roomType, rooms, selectedPeriod?.type],
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
    <div className="pb-16 pt-4 md:pb-20 md:pt-6">
      <Container className="space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <Button variant="outline" className="rounded-full" onClick={() => navigate(browsePath)}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="font-display text-[2.2rem] font-semibold leading-[1.02] tracking-tight text-foreground sm:text-[2.8rem]">
                {hostel.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
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

        <div className={`${filtersOpen ? "block" : "hidden"} md:block`}>
          <SurfacePanel className="p-4 sm:p-5">
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.2fr] lg:items-end">
              <div className="space-y-2.5">
                <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Room type</p>
                <Select value={roomType} onValueChange={(value) => setRoomType(value as typeof roomType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All room types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All room types</SelectItem>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="double">Double</SelectItem>
                    <SelectItem value="triple">Triple</SelectItem>
                    <SelectItem value="quad">Quad</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Price range</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatCurrency(priceRange[0], currency)} - {formatCurrency(priceRange[1], currency)}
                  </p>
                </div>
                <Slider
                  min={minPrice}
                  max={maxPrice}
                  step={50}
                  value={priceRange}
                  onValueChange={(value) => setPriceRange([value[0], value[1]])}
                  className="py-2"
                />
              </div>
            </div>
          </SurfacePanel>
        </div>

        <Section title="Available rooms" description="Choose the room type and stay period that fits best.">
          {filteredRooms.length === 0 ? (
            <EmptyState title="No rooms match this view" description="Try another room type or widen the price range." />
          ) : null}

          {filteredRooms.length ? (
            <Grid className="md:grid-cols-2 xl:grid-cols-3">
              {filteredRooms.map((room) => {
                const availableBeds = database.beds.filter((bed) => bed.roomId === room.id && bed.status === "available").length;
                const displayedPrice = resolveRoomPrice(selectedPeriod?.type, room.pricePerSemester, room.pricePerYear, room.pricePerNight);
                return (
                  <article key={room.id} className="surface-card flex h-full flex-col overflow-hidden">
                    <button
                      type="button"
                      className="block overflow-hidden rounded-[16px]"
                      onClick={() => navigate(getRoomPath(currentUser, room.id, buildPublicPath))}
                    >
                      <img
                        src={resolveRoomGallery(room.images)[0]}
                        alt={room.name}
                        className="h-60 w-full object-cover transition duration-300 hover:scale-[1.02]"
                      />
                    </button>

                    <div className="flex flex-1 flex-col gap-5 p-6 pt-5">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h2 className="text-lg font-semibold tracking-tight text-foreground capitalize">
                              {formatRoomType(room.type)} room
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Room {room.name} · Floor {room.floor} · {room.capacity} beds
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-muted-foreground">From</p>
                            <p className="mt-1 text-lg font-semibold tracking-tight text-foreground">
                              {formatCurrency(displayedPrice, currency)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">{availableBeds > 0 ? `${availableBeds} beds open` : "Waitlist open"}</Badge>
                          <Badge variant="outline">{selectedPeriod?.name ?? "Current stay"}</Badge>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {room.amenities.slice(0, 3).map((amenity) => (
                            <Badge key={amenity} variant="outline">
                              {amenity}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        className="mt-auto w-full"
                        onClick={() => navigate(getRoomPath(currentUser, room.id, buildPublicPath))}
                      >
                        View room
                      </Button>
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
