import { useMemo } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Building2, RotateCcw, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { Section } from "@/components/shared/Section";
import { Slider } from "@/components/ui/slider";
import { useApp } from "@/contexts/AppContext";
import { useSiteContext } from "@/contexts/SiteContext";
import { formatCurrency, getTenantCurrency } from "@/lib/currency";
import { getBrowsePath, getPropertyPath, shouldUseAccountShell } from "@/lib/app-shell";
import { filterHostels } from "@/modules/catalog/selectors";
import { getSiteHostels } from "@/modules/site/selectors";
import { defaultExploreFilters } from "@/services/mock-data";
import roomImage from "@/assets/room-single.jpg";
import roomDouble from "@/assets/room-double.jpg";

function priceLabel(value: number, currency: string) {
  return formatCurrency(value, currency);
}

export default function ExplorePage() {
  const location = useLocation();
  const { database, session, setExploreFilters, currentUser } = useApp();
  const { publicSite, preferredSite, buildPublicPath } = useSiteContext();

  const site = publicSite ?? preferredSite;
  const siteHostels = useMemo(
    () => (database && site ? getSiteHostels(database, site) : []),
    [database, site],
  );
  const normalizedFilters = useMemo(
    () => ({
      ...session.exploreFilters,
      search: "",
      duration: "all" as const,
      sort: "recommended" as const,
    }),
    [session.exploreFilters],
  );

  const results = useMemo(() => {
    if (!database || !site) return [];
    const scopedHostels = new Set(siteHostels.map((hostel) => hostel.id));
    return filterHostels(database, normalizedFilters).filter(({ hostel }) => scopedHostels.has(hostel.id));
  }, [database, normalizedFilters, site, siteHostels]);

  if (!database || !site) return <div className="container py-10">Loading properties...</div>;

  const browsePath = getBrowsePath(currentUser, buildPublicPath);
  if (shouldUseAccountShell(currentUser) && location.pathname !== browsePath) {
    return <Navigate to={browsePath} replace />;
  }

  if (site.type === "hostel_microsite" && site.hostelId) {
    return <Navigate to={getPropertyPath(currentUser, site.hostelId, buildPublicPath)} replace />;
  }

  const filters = session.exploreFilters;
  const updateFilters = (next: Partial<typeof filters>) => setExploreFilters({ ...filters, ...next });
  const currency = getTenantCurrency(database, site.tenantId);
  const allRoomPrices = siteHostels.flatMap((hostel) => database.rooms.filter((room) => room.hostelId === hostel.id).map((room) => room.pricePerSemester));
  const minPrice = allRoomPrices.length ? Math.min(...allRoomPrices) : 0;
  const maxPrice = allRoomPrices.length ? Math.max(...allRoomPrices) : 10000;
  const universityOptions = Array.from(new Set(siteHostels.map((hostel) => hostel.university)));

  return (
    <div className="container space-y-8 py-6 md:py-8">
      <Section
        title="Properties"
        description="Browse the hostels available within this portal."
        actions={
          <Button variant="outline" size="icon" className="rounded-full" onClick={() => setExploreFilters(defaultExploreFilters)}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        }
      >
        <div className="surface-card p-4 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_1.2fr_auto] lg:items-end">
            <div className="space-y-2.5">
              <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Room type</p>
              <select
                value={filters.roomType}
                onChange={(event) => updateFilters({ roomType: event.target.value as typeof filters.roomType })}
                className="h-11 w-full rounded-[10px] border border-border bg-card px-4 text-sm shadow-[0_1px_2px_rgba(16,24,40,0.02)]"
              >
                <option value="all">All room types</option>
                <option value="single">Single</option>
                <option value="double">Double</option>
                <option value="triple">Triple</option>
                <option value="quad">Quad</option>
              </select>
            </div>

            <div className="space-y-2.5">
              <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Policy type</p>
              <select
                value={filters.genderPolicy}
                onChange={(event) => updateFilters({ genderPolicy: event.target.value as typeof filters.genderPolicy })}
                className="h-11 w-full rounded-[10px] border border-border bg-card px-4 text-sm shadow-[0_1px_2px_rgba(16,24,40,0.02)]"
              >
                <option value="all">Any policy</option>
                <option value="mixed">Mixed</option>
                <option value="female_only">Female only</option>
                <option value="male_only">Male only</option>
              </select>
            </div>

            <div className="space-y-2.5">
              <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-muted-foreground">University</p>
              <select
                value={filters.university}
                onChange={(event) => updateFilters({ university: event.target.value })}
                className="h-11 w-full rounded-[10px] border border-border bg-card px-4 text-sm shadow-[0_1px_2px_rgba(16,24,40,0.02)]"
              >
                <option value="All Universities">All universities</option>
                {universityOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Price range</p>
                <p className="text-sm font-medium text-foreground">
                  {priceLabel(filters.priceRange[0], currency)} - {priceLabel(filters.priceRange[1], currency)}
                </p>
              </div>
              <Slider
                min={minPrice}
                max={maxPrice}
                step={50}
                value={filters.priceRange}
                onValueChange={(value) => updateFilters({ priceRange: [value[0], value[1]] })}
                className="py-2"
              />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-[14px] border border-border/70 bg-muted/35 px-4 py-3">
              <div className="space-y-0.5">
                <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Availability</p>
                <p className="text-sm text-foreground">{filters.availabilityOnly ? "Available only" : "All rooms"}</p>
              </div>
              <Button
                type="button"
                variant={filters.availabilityOnly ? "emerald" : "outline"}
                size="sm"
                className="rounded-full"
                onClick={() => updateFilters({ availabilityOnly: !filters.availabilityOnly })}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {results.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-8 w-8" />}
          title="No properties match these filters"
          description="Try a wider price range or reset the current filter set."
          action={<Button variant="emerald" onClick={() => setExploreFilters(defaultExploreFilters)}>Reset filters</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {results.map(({ hostel, availableBeds, lowestPrice }, index) => (
            <Link key={hostel.id} to={getPropertyPath(currentUser, hostel.id, buildPublicPath)} className="group block">
              <article className="surface-card flex h-full flex-col overflow-hidden">
                <div className="relative overflow-hidden rounded-[16px] bg-muted">
                  <img
                    src={index % 2 === 0 ? roomImage : roomDouble}
                    alt={hostel.name}
                    className="aspect-[16/11] h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                  <div className="absolute left-4 top-4">
                    <Badge variant="secondary">{availableBeds} beds open</Badge>
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-5 p-6 pt-5">
                  <div className="space-y-2">
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">{hostel.name}</h2>
                    <p className="text-sm text-muted-foreground">{hostel.university}</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{hostel.genderPolicy.replace(/_/g, " ")}</Badge>
                    </div>
                  </div>

                  <div className="mt-auto flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-muted-foreground">From</p>
                      <p className="mt-2 text-xl font-semibold tracking-tight text-foreground">{priceLabel(lowestPrice, currency)}</p>
                    </div>
                    <Button variant="outline">View property</Button>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
