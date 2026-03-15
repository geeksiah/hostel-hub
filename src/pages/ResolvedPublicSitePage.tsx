import { Link } from "react-router-dom";
import { ArrowRight, Globe2, ShieldCheck } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { useSiteContext } from "@/contexts/SiteContext";
import { getAppHomePath, getBrowsePath, getPropertyPath } from "@/lib/app-shell";
import { getSiteHostels } from "@/modules/site/selectors";
import LandingPage from "@/pages/LandingPage";
import roomImage from "@/assets/room-single.jpg";

export default function ResolvedPublicSitePage() {
  const { database, currentUser } = useApp();
  const { publicSite, activeTenant, activeVersion, buildPublicPath, publicPathname } = useSiteContext();

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

  if (page.kind === "about") {
    return (
      <div className="container max-w-4xl space-y-6 py-10">
        <div className="rounded-3xl border bg-card p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary">{content.eyebrow}</p>
          <h1 className="mt-3 font-display text-4xl font-bold">{content.aboutTitle ?? `About ${publicSite.name}`}</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">{content.aboutBody}</p>
        </div>
      </div>
    );
  }

  if (page.kind === "faq") {
    return (
      <div className="container max-w-4xl space-y-6 py-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary">{content.eyebrow}</p>
          <h1 className="mt-2 font-display text-4xl font-bold">Frequently asked questions</h1>
        </div>
        <div className="grid gap-4">
          {content.faq.map((item) => (
            <article key={item.question} className="rounded-2xl border bg-card p-6">
              <h2 className="font-display text-xl font-semibold">{item.question}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.answer}</p>
            </article>
          ))}
        </div>
      </div>
    );
  }

  if (page.kind === "contact") {
    return (
      <div className="container max-w-5xl space-y-6 py-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary">{content.eyebrow}</p>
          <h1 className="mt-2 font-display text-4xl font-bold">{content.contactTitle ?? "Contact the team"}</h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">{content.contactBody}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {hostels.map((hostel) => (
            <article key={hostel.id} className="rounded-2xl border bg-card p-6">
              <h2 className="font-display text-xl font-semibold">{hostel.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{hostel.location}</p>
              <div className="mt-4 space-y-2 text-sm">
                <p><span className="text-muted-foreground">Phone:</span> {hostel.contact.phone}</p>
                <p><span className="text-muted-foreground">Email:</span> {hostel.contact.email}</p>
                <p><span className="text-muted-foreground">Check-in:</span> {hostel.checkInTime}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-12">
      <section
        className="border-b text-primary-foreground"
        style={{ background: `linear-gradient(135deg, var(--brand-hero-from), var(--brand-hero-to))` }}
      >
        <div className="container py-12 md:py-16">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
                <Globe2 className="h-3.5 w-3.5" />
                {activeTenant?.name ?? publicSite.name}
              </div>
              <div className="space-y-4">
                <h1 className="max-w-3xl font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">{content.headline}</h1>
                <p className="max-w-2xl text-base text-white/80 sm:text-lg">{content.subheadline}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to={content.primaryCtaHref === "/properties" ? browsePath : buildPublicPath(content.primaryCtaHref)}>
                  <Button variant="hero" size="lg">
                    {content.primaryCtaLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                {content.secondaryCtaLabel ? (
                  <Link to={content.secondaryCtaHref ?? "/login"}>
                    <Button size="lg" variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white">
                      {content.secondaryCtaLabel}
                    </Button>
                  </Link>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {content.stats.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/15 bg-white/10 p-4">
                    <p className="text-2xl font-bold">{item.value}</p>
                    <p className="text-sm text-white/75">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[2rem] border border-white/15 bg-white/10 p-4 shadow-2xl shadow-black/20 backdrop-blur">
                <img src={roomImage} alt={publicSite.name} className="h-64 w-full rounded-[1.5rem] object-cover" />
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-display text-xl font-semibold text-white">{hostels[0]?.name ?? publicSite.name}</p>
                      <p className="text-sm text-white/75">{hostels[0]?.location ?? activeTenant?.name}</p>
                    </div>
                    <div className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                      Direct booking
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {content.trustPoints.slice(0, 2).map((item) => (
                      <div key={item} className="rounded-2xl bg-white/10 p-4 text-sm text-white/80">{item}</div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {content.featureBullets.map((item) => (
                  <div key={item} className="rounded-2xl border border-white/15 bg-white/10 p-4">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <p className="text-sm text-white/80">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mt-10 space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold">{publicSite.type === "hostel_microsite" ? "Rooms and availability" : "Featured properties"}</h2>
            <p className="text-sm text-muted-foreground">
              {publicSite.type === "hostel_microsite" ? "Book directly into this property's available rooms." : "Move residents into the correct hostel flow without marketplace browsing."}
            </p>
          </div>
          <Link to={browsePath} className="text-sm font-medium text-secondary">
            {publicSite.type === "hostel_microsite" ? "Open rooms" : "View all"}
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {hostels.slice(0, 3).map((hostel) => (
            <Link key={hostel.id} to={getPropertyPath(currentUser, hostel.id, buildPublicPath)} className="overflow-hidden rounded-2xl border bg-card transition hover:-translate-y-0.5 hover:shadow-lg">
              <img src={roomImage} alt={hostel.name} className="h-48 w-full object-cover" />
              <div className="space-y-3 p-4">
                <div>
                  <h3 className="font-display text-lg font-semibold">{hostel.name}</h3>
                  <p className="text-sm text-muted-foreground">{hostel.location}</p>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-secondary">{hostel.availableBeds} beds open</span>
                  <span className="text-muted-foreground">{hostel.university}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {currentUser ? (
          <div className="rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">
              Signed in as <span className="font-medium text-foreground">{currentUser.name}</span>. You can keep browsing public pages or jump straight into your dashboard.
            </p>
            <div className="mt-4">
              <Link to={getAppHomePath(currentUser)}>
                <Button variant="outline">Open dashboard</Button>
              </Link>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
