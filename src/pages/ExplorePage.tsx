import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Building2, RotateCcw, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { SelectField } from "@/components/shared/SelectField";
import { Section } from "@/components/shared/Section";
import { RevealTransition } from "@/components/shared/motion";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useApp } from "@/contexts/AppContext";
import { useSiteContext } from "@/contexts/SiteContext";
import { formatCurrency, getTenantCurrency } from "@/lib/currency";
import { getBrowsePath, getPropertyPath, shouldUseAccountShell } from "@/lib/app-shell";
import { filterHostels } from "@/modules/catalog/selectors";
import { getSiteHostels } from "@/modules/site/selectors";
import { defaultExploreFilters } from "@/services/mock-data";
import { getRoomStartingPrice } from "@/services/store";
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
  const allRoomPrices = siteHostels.flatMap((hostel) =>
    database.rooms
      .filter((room) => room.hostelId === hostel.id)
      .map((room) => getRoomStartingPrice(database, room)),
  );
  const minPrice = allRoomPrices.length ? Math.min(...allRoomPrices) : 0;
  const maxPrice = allRoomPrices.length ? Math.max(...allRoomPrices) : 10000;
  const universityOptions = Array.from(new Set(siteHostels.map((hostel) => hostel.university)));
  const [priceDraft, setPriceDraft] = useState<[number, number]>(filters.priceRange);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const roomTypeOptions = [
    { value: "all", label: "All room types" },
    { value: "single", label: "Single" },
    { value: "double", label: "Double" },
    { value: "triple", label: "Triple" },
    { value: "quad", label: "Quad" },
  ];
  const policyOptions = [
    { value: "all", label: "Any policy" },
    { value: "mixed", label: "Mixed" },
    { value: "female_only", label: "Female only" },
    { value: "male_only", label: "Male only" },
  ];
  const universityFieldOptions = [
    { value: "All Universities", label: "All universities" },
    ...universityOptions.map((item) => ({ value: item, label: item })),
  ];

  useEffect(() => {
    setPriceDraft(filters.priceRange);
  }, [filters.priceRange]);

  const filterPanel = (
    <div className="surface-card p-5 sm:p-6">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1.2fr_auto] xl:items-end">
        <SelectField
          label="Room type"
          value={filters.roomType}
          onValueChange={(value) => updateFilters({ roomType: value as typeof filters.roomType })}
          options={roomTypeOptions}
          placeholder="All room types"
        />

        <SelectField
          label="Policy type"
          value={filters.genderPolicy}
          onValueChange={(value) => updateFilters({ genderPolicy: value as typeof filters.genderPolicy })}
          options={policyOptions}
          placeholder="Any policy"
        />

        <SelectField
          label="University"
          value={filters.university}
          onValueChange={(value) => updateFilters({ university: value })}
          options={universityFieldOptions}
          placeholder="All universities"
        />

        <div className="min-w-0 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Price range</p>
            <p className="text-sm font-medium text-foreground">
              {priceLabel(priceDraft[0], currency)} - {priceLabel(priceDraft[1], currency)}
            </p>
          </div>
          <Slider
            min={minPrice}
            max={maxPrice}
            step={50}
            value={priceDraft}
            onValueChange={(value) => setPriceDraft([value[0], value[1]])}
            onValueCommit={(value) => updateFilters({ priceRange: [value[0], value[1]] })}
            className="py-2"
          />
        </div>

        <div className="flex h-11 min-w-0 items-center justify-between gap-3 xl:justify-end">
          <label
            htmlFor="availability-only"
            className="text-sm font-medium text-foreground"
          >
            Available Only
          </label>
          <Switch
            id="availability-only"
            checked={filters.availabilityOnly}
            onCheckedChange={(checked) => updateFilters({ availabilityOnly: checked })}
            aria-label="Toggle available rooms only"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="container space-y-10 py-6 md:space-y-12 md:py-8">
      <Section
        title="Properties"
        description="Browse the hostels available within this portal."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-full md:hidden" onClick={() => setFiltersOpen((open) => !open)}>
              <SlidersHorizontal className="h-4 w-4" />
              {filtersOpen ? "Hide filters" : "Show filters"}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() => {
                setPriceDraft(defaultExploreFilters.priceRange);
                setExploreFilters(defaultExploreFilters);
              }}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        }
      >
        <RevealTransition show={filtersOpen} className="md:hidden">
          {filterPanel}
        </RevealTransition>
        <div className="hidden md:block">
          {filterPanel}
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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {results.map(({ hostel, availableBeds, lowestPrice }, index) => (
            <Link key={hostel.id} to={getPropertyPath(currentUser, hostel.id, buildPublicPath)} className="group block">
              <article className="surface-card flex h-full flex-col overflow-hidden">
                <div className="relative overflow-hidden bg-muted">
                  <img
                    src={index % 2 === 0 ? roomImage : roomDouble}
                    alt={hostel.name}
                    className="aspect-[16/11] h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                  <div className="absolute left-4 top-4">
                    <Badge variant="secondary">{availableBeds} beds open</Badge>
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-6 p-6 sm:p-7">
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">{hostel.name}</h2>
                    <p className="text-sm text-muted-foreground">{hostel.university}</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{hostel.genderPolicy.replace(/_/g, " ")}</Badge>
                      <Badge variant="secondary">{availableBeds} beds open</Badge>
                    </div>
                  </div>

                  <div className="mt-auto flex items-end justify-between gap-4 border-t border-border/70 pt-5">
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
