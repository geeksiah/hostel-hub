import { Link } from "react-router-dom";
import { ArrowRight, Globe2, Palette, ShieldCheck, Wallet } from "lucide-react";
import heroImage from "@/assets/hostel-hero.jpg";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";

const pillars = [
  { icon: Globe2, title: "Whitelabel sites", copy: "Launch tenant and hostel websites with custom domains, multi-page content, and local preview URLs." },
  { icon: Palette, title: "Tenant branding", copy: "Apply tenant themes across public pages, admin dashboards, and resident dashboards without splitting the product." },
  { icon: Wallet, title: "Tenant-owned payments", copy: "Each tenant chooses one provider stack, enables supported methods, and keeps manual verification where needed." },
  { icon: ShieldCheck, title: "Shared operations", copy: "Bookings, residents, tickets, reporting, and QR flows stay intact behind the new site entry points." },
];

export default function LandingPage() {
  const { database } = useApp();
  const demoSites = database?.sites.filter((site) => site.status === "published").slice(0, 3) ?? [];

  return (
    <div className="pb-12">
      <section
        className="border-b text-primary-foreground"
        style={{ background: "linear-gradient(135deg, hsl(var(--primary)), var(--brand-hero-to, hsl(var(--primary))))" }}
      >
        <div className="container grid gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-16">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
              <Globe2 className="h-3.5 w-3.5" />
              HostelHub Whitelabel
            </div>
            <div className="space-y-4">
              <h1 className="max-w-3xl font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                Tenant-hosted booking websites with one shared operations product underneath.
              </h1>
              <p className="max-w-2xl text-base text-white/80 sm:text-lg">
                Each tenant gets its own site, domain setup, brand theme, payment configuration, and resident booking funnel while admin, resident, and support flows stay unified.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/register">
                <Button variant="hero" size="lg">Start tenant setup</Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white">
                  Open platform demo
                </Button>
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/15 bg-white/10 p-4 shadow-2xl shadow-black/20 backdrop-blur">
            <img src={heroImage} alt="Whitelabel hostel platform" className="h-72 w-full rounded-[1.6rem] object-cover" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/70">Mode</p>
                <p className="mt-2 font-display text-xl font-semibold">Whitelabel tenant sites</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/70">Payments</p>
                <p className="mt-2 font-display text-xl font-semibold">Tenant-owned gateway setup</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {pillars.map((item) => (
          <article key={item.title} className="rounded-2xl border bg-card p-5">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-secondary/10 text-secondary">
              <item.icon className="h-5 w-5" />
            </div>
            <h2 className="font-display text-lg font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{item.copy}</p>
          </article>
        ))}
      </section>

      <section className="container mt-10 space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold">Published demo sites</h2>
            <p className="text-sm text-muted-foreground">Local previews use the `/:siteSlug/*` fallback so each tenant can still be tested on localhost.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {demoSites.map((site) => (
            <Link key={site.id} to={`/${site.slug}`} className="rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">{site.renderMode === "custom_code" ? "Custom code" : "Template"}</p>
              <h3 className="mt-3 font-display text-xl font-semibold">{site.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">Slug preview: /{site.slug}</p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-secondary">
                Open site
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
