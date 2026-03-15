import { useMemo } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { BedDouble, Building2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { Input } from "@/components/ui/input";
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

  const results = useMemo(() => {
    if (!database || !site) return [];
    const scopedHostels = new Set(getSiteHostels(database, site).map((hostel) => hostel.id));
    return filterHostels(database, session.exploreFilters).filter(({ hostel }) => scopedHostels.has(hostel.id));
  }, [database, session.exploreFilters, site]);

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

  return (
    <div className="container space-y-5 py-6">
      <div className="space-y-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Browse properties</h1>
          <p className="text-sm text-muted-foreground">
            Show only properties that belong to {site.name}, so residents stay inside the correct tenant site.
          </p>
        </div>

        <div className="rounded-lg border bg-card p-3">
          <div className="grid gap-3 xl:grid-cols-[2fr_repeat(4,minmax(0,1fr))]">
            <div className="xl:col-span-2">
              <Input
                value={filters.search}
                onChange={(event) => updateFilters({ search: event.target.value })}
                placeholder="Search property, location, university"
              />
            </div>
            <div>
              <select
                value={filters.university}
                onChange={(event) => updateFilters({ university: event.target.value })}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                {database.marketConfig.universities.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={filters.roomType}
                onChange={(event) => updateFilters({ roomType: event.target.value as typeof filters.roomType })}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="all">All rooms</option>
                <option value="single">Single</option>
                <option value="double">Double</option>
                <option value="triple">Triple</option>
                <option value="quad">Quad</option>
              </select>
            </div>
            <div>
              <select
                value={filters.duration}
                onChange={(event) => updateFilters({ duration: event.target.value as typeof filters.duration })}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="all">Any stay</option>
                <option value="semester">Semester</option>
                <option value="year">Year</option>
                <option value="vacation">Vacation</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="w-full" onClick={() => setExploreFilters(defaultExploreFilters)}>
                <Filter className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>

          <div className="mt-3 grid gap-3 xl:grid-cols-[repeat(2,minmax(0,1fr))_auto]">
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                value={filters.priceRange[0]}
                onChange={(event) => updateFilters({ priceRange: [Number(event.target.value || 0), filters.priceRange[1]] })}
                placeholder="Min price"
              />
              <Input
                type="number"
                value={filters.priceRange[1]}
                onChange={(event) => updateFilters({ priceRange: [filters.priceRange[0], Number(event.target.value || 0)] })}
                placeholder="Max price"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={filters.genderPolicy}
                onChange={(event) => updateFilters({ genderPolicy: event.target.value as typeof filters.genderPolicy })}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="all">Any policy</option>
                <option value="mixed">Mixed</option>
                <option value="female_only">Female only</option>
                <option value="male_only">Male only</option>
              </select>
              <select
                value={filters.sort}
                onChange={(event) => updateFilters({ sort: event.target.value as typeof filters.sort })}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="recommended">Recommended</option>
                <option value="price_asc">Lowest price</option>
                <option value="price_desc">Highest price</option>
                <option value="beds_desc">Most beds</option>
              </select>
            </div>
            <div className="flex items-center justify-between rounded-md border px-3">
              <span className="text-sm">Available only</span>
              <input
                type="checkbox"
                checked={filters.availabilityOnly}
                onChange={(event) => updateFilters({ availabilityOnly: event.target.checked })}
              />
            </div>
          </div>

          <div className="mt-3 text-xs text-muted-foreground">{results.length} matching properties.</div>
        </div>
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-8 w-8" />}
          title="No properties match these filters"
          description="Try a wider price range or reset the current filter set."
          action={<Button variant="emerald" onClick={() => setExploreFilters(defaultExploreFilters)}>Reset filters</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {results.map(({ hostel, rooms, availableBeds, lowestPrice }, index) => (
            <Link key={hostel.id} to={getPropertyPath(currentUser, hostel.id, buildPublicPath)} className="group block">
              <div className="overflow-hidden rounded-xl border bg-card transition hover:shadow-lg">
                <div className="relative aspect-[16/11] overflow-hidden bg-muted">
                  <img
                    src={index % 2 === 0 ? roomImage : roomDouble}
                    alt={hostel.name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute bottom-3 left-3 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    {availableBeds} beds open
                  </div>
                </div>

                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-lg font-semibold">{hostel.name}</h2>
                      <p className="mt-1 text-xs text-muted-foreground">{hostel.location}</p>
                    </div>
                    <span className="rounded-full bg-secondary/10 px-2.5 py-1 text-xs font-semibold text-secondary">
                      {hostel.rating.toFixed(1)}
                    </span>
                  </div>

                  <p className="line-clamp-2 text-sm text-muted-foreground">{hostel.university}</p>

                  <div className="space-y-2">
                    {rooms.slice(0, 2).map((room) => (
                      <div key={room.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <BedDouble className="h-4 w-4 text-muted-foreground" />
                          <span className="capitalize">{room.type} room</span>
                        </div>
                        <span className="font-semibold text-secondary">{priceLabel(room.pricePerSemester, currency)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between border-t pt-3">
                    <div>
                      <p className="text-xs text-muted-foreground">From</p>
                      <p className="font-display text-lg font-semibold">{priceLabel(lowestPrice, currency)}</p>
                    </div>
                    <Button variant="emerald" size="sm">View property</Button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
