import { Link } from "react-router-dom";
import { ArrowRight, Clock3, MapPin, Star } from "lucide-react";
import hostelHero from "@/assets/hostel-hero.jpg";
import { Container } from "@/components/shared/Container";
import { EmptyState } from "@/components/shared/EmptyState";
import { Grid } from "@/components/shared/Grid";
import { Section } from "@/components/shared/Section";
import { SurfacePanel } from "@/components/shared/SurfacePanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { useSiteContext } from "@/contexts/SiteContext";
import { formatCurrency, getHostelCurrency } from "@/lib/currency";
import { getBrowsePath, getPropertyPath, getRoomPath } from "@/lib/app-shell";
import { resolveImageSource, resolveRoomGallery } from "@/lib/media";
import { getSiteHostels } from "@/modules/site/selectors";
import LandingPage from "@/pages/LandingPage";

function formatRoomType(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

export default function ResolvedPublicSitePage() {
  const { database, currentUser } = useApp();
  const { publicSite, activeVersion, buildPublicPath, publicPathname } = useSiteContext();

  if (!database) return <div className="container py-12">Loading site...</div>;

  if (!publicSite) {
    if (publicPathname !== "/") {
      return (
        <div className="container py-12">
          <EmptyState title="Page not found" description="This public page does not exist." />
        </div>
      );
    }
    return <LandingPage />;
  }

  if (publicSite.renderMode === "custom_code" && activeVersion?.customCode) {
    const doc = `<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><style>${activeVersion.customCode.css}</style></head><body>${activeVersion.customCode.html}<script>${activeVersion.customCode.js}<\/script></body></html>`;
    return (
      <iframe
        title={publicSite.name}
        srcDoc={doc}
        className="h-screen w-full border-0"
        sandbox="allow-scripts allow-forms allow-popups"
      />
    );
  }

  const pathKey = publicPathname === "/" ? "" : publicPathname.replace(/^\//, "");
  const page = publicSite.pageManifest.find((item) => item.slug === pathKey || (pathKey === "" && item.slug === ""));
  const hostels = getSiteHostels(database, publicSite);

  if (!page || !activeVersion) {
    return (
      <div className="container py-12">
        <EmptyState title="Page not found" description="This site page is not available yet." />
      </div>
    );
  }

  const content = activeVersion.templateContent;
  const browsePath = getBrowsePath(currentUser, buildPublicPath);
  const primaryHostel = hostels[0];
  const roomsPath = primaryHostel ? getPropertyPath(currentUser, primaryHostel.id, buildPublicPath) : browsePath;
  const loginHref = buildPublicPath("/login");
  const fallbackHero = primaryHostel?.coverImages?.length ? resolveRoomGallery(primaryHostel.coverImages)[0] : hostelHero;
  const heroImage = resolveImageSource(publicSite.heroMediaUrl, fallbackHero);
  const hostelRooms = primaryHostel ? database.rooms.filter((room) => room.hostelId === primaryHostel.id) : [];
  const featuredRooms = hostelRooms.slice(0, 6);
  const currency = primaryHostel ? getHostelCurrency(database, primaryHostel.id) : database.marketConfig.currency;
  const steps = [
    { title: "Choose room", detail: "View live room types and available beds." },
    { title: "Reserve", detail: "Select your stay period and complete payment." },
    { title: "Move in", detail: "Use your resident profile and QR ID at check-in." },
  ];

  if (page.kind === "about") {
    return (
      <Container className="py-8 md:py-12">
        <SurfacePanel className="max-w-4xl">
          <p className="text-[12px] font-medium uppercase tracking-[0.22em] text-muted-foreground">{content.eyebrow}</p>
          <h1 className="mt-3 font-display text-[2.4rem] font-semibold tracking-tight text-foreground">
            {content.aboutTitle ?? `About ${publicSite.name}`}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">{content.aboutBody}</p>
        </SurfacePanel>
      </Container>
    );
  }

  if (page.kind === "faq") {
    return (
      <Container className="space-y-6 py-8 md:py-12">
        <Section title="Frequently asked questions" description="Everything residents usually ask before booking.">
          <Grid>
            {content.faq.map((item) => (
              <SurfacePanel key={item.question}>
                <h2 className="text-base font-semibold tracking-tight text-foreground">{item.question}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.answer}</p>
              </SurfacePanel>
            ))}
          </Grid>
        </Section>
      </Container>
    );
  }

  if (page.kind === "contact") {
    return (
      <Container className="space-y-6 py-8 md:py-12">
        <Section
          title={content.contactTitle ?? "Contact the hostel"}
          description={content.contactBody ?? "Reach the front desk for room availability, payments, or move-in support."}
        >
          <Grid className="md:grid-cols-2">
            {hostels.map((hostel) => (
              <SurfacePanel key={hostel.id}>
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">{hostel.name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{hostel.location}</p>
                  </div>
                  <div className="grid gap-3 text-sm text-foreground/90">
                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted/40 px-4 py-3">
                      <span className="text-muted-foreground">Phone</span>
                      <span className="font-medium">{hostel.contact.phone}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted/40 px-4 py-3">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-medium">{hostel.contact.email}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted/40 px-4 py-3">
                      <span className="text-muted-foreground">Check-in</span>
                      <span className="font-medium">{hostel.checkInTime}</span>
                    </div>
                  </div>
                </div>
              </SurfacePanel>
            ))}
          </Grid>
        </Section>
      </Container>
    );
  }

  return (
    <div className="pb-16 pt-4 md:pb-20 md:pt-6">
      <Container className="space-y-12 md:space-y-16">
        <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="surface-card flex flex-col justify-center p-6 sm:p-8 lg:p-10">
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-[12px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
                  {primaryHostel?.location ?? publicSite.name}
                </p>
                <h1 className="font-display text-[2.6rem] font-semibold leading-[0.96] tracking-tight text-foreground sm:text-[3.2rem] lg:text-[4rem]">
                  Stay closer.
                  <br />
                  Book smarter.
                </h1>
                <p className="max-w-lg text-sm leading-7 text-muted-foreground">
                  Cozy student and guest rooms, direct and easy booking process, and a seamless portal.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild variant="emerald" size="lg">
                  <Link to={roomsPath}>
                    Browse rooms
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="hero-surface relative min-h-[420px] overflow-hidden lg:min-h-[620px]">
            <img src={heroImage} alt={publicSite.name} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/62 via-slate-950/18 to-transparent" />
            <div className="relative flex h-full flex-col justify-between p-5 sm:p-6 lg:p-8">
              <div className="self-start rounded-full border border-white/18 bg-white/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-white backdrop-blur">
                {content.eyebrow}
              </div>

              <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                <div className="rounded-[20px] border border-white/14 bg-white/10 p-4 text-white backdrop-blur">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
                    {primaryHostel?.location ? (
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {primaryHostel.location}
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-2">
                      <Star className="h-4 w-4 fill-current text-amber" />
                      {primaryHostel?.rating?.toFixed(1) ?? "4.8"}
                    </span>
                    {primaryHostel?.checkInTime ? (
                      <span className="inline-flex items-center gap-2">
                        <Clock3 className="h-4 w-4" />
                        Check-in {primaryHostel.checkInTime}
                      </span>
                    ) : null}
                  </div>
                </div>

                {featuredRooms[0] ? (
                  <Link
                    to={getRoomPath(currentUser, featuredRooms[0].id, buildPublicPath)}
                    className="rounded-[20px] border border-white/14 bg-white px-4 py-4 text-foreground shadow-[0_12px_36px_rgba(15,23,42,0.14)]"
                  >
                    <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Featured</p>
                    <p className="mt-2 text-base font-semibold tracking-tight capitalize">
                      {formatRoomType(featuredRooms[0].type)} room
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatCurrency(featuredRooms[0].pricePerSemester, currency)}
                    </p>
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <Section
          title="Room picks"
          description="Clear room types, direct pricing, and a fast booking path."
          actions={
            <Link to={roomsPath} className="text-sm font-medium text-secondary transition-colors hover:text-secondary/80">
              View all rooms
            </Link>
          }
        >
          <Grid className="md:grid-cols-2 xl:grid-cols-3">
            {featuredRooms.map((room) => {
              const roomBeds = database.beds.filter((bed) => bed.roomId === room.id && bed.status === "available").length;
              return (
                <article key={room.id} className="surface-card flex h-full flex-col overflow-hidden">
                  <Link to={getRoomPath(currentUser, room.id, buildPublicPath)} className="block overflow-hidden rounded-[16px]">
                    <img
                      src={resolveRoomGallery(room.images)[0]}
                      alt={room.name}
                      className="h-60 w-full object-cover transition duration-300 hover:scale-[1.02]"
                    />
                  </Link>

                  <div className="flex flex-1 flex-col gap-5 p-6 pt-5">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold tracking-tight text-foreground capitalize">
                            {formatRoomType(room.type)} room
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Room {room.name} · Floor {room.floor} · {room.capacity} beds
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-muted-foreground">From</p>
                          <p className="mt-1 text-lg font-semibold tracking-tight text-foreground">
                            {formatCurrency(room.pricePerSemester, currency)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{roomBeds > 0 ? `${roomBeds} beds open` : "Waitlist open"}</Badge>
                        {room.amenities.slice(0, 2).map((amenity) => (
                          <Badge key={amenity} variant="outline">
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="mt-auto">
                      <Button asChild variant="outline" className="w-full">
                        <Link to={getRoomPath(currentUser, room.id, buildPublicPath)}>View room</Link>
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </Grid>
        </Section>

        <Section title="How booking works" description="The resident journey stays short and predictable.">
          <Grid className="md:grid-cols-3">
            {steps.map((step, index) => (
              <SurfacePanel key={step.title} className="h-full">
                <div className="space-y-4">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-light text-sm font-semibold text-secondary">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold tracking-tight text-foreground">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.detail}</p>
                  </div>
                </div>
              </SurfacePanel>
            ))}
          </Grid>
        </Section>

        <section className="hero-surface relative overflow-hidden p-6 text-white sm:p-8 lg:p-10">
          <img src={heroImage} alt={publicSite.name} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-slate-950/42" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/94 via-slate-950/82 to-slate-950/64" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[12px] font-medium uppercase tracking-[0.22em] text-white/60">Ready to move</p>
              <h2 className="mt-3 font-display text-[2.2rem] font-semibold leading-[1.02] tracking-tight sm:text-[2.8rem]">
                Book your room and keep the rest simple.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-white/78">
                Availability, payments, support, and resident access stay connected from the same hostel account.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline" size="lg" className="border-white/18 bg-white/10 text-white hover:bg-white/18 hover:text-white">
                <Link to={loginHref}>Resident portal</Link>
              </Button>
              <Button asChild variant="hero" size="lg">
                <Link to={roomsPath}>
                  Browse rooms
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </Container>
    </div>
  );
}
