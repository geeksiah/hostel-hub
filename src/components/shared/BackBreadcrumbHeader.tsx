import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

interface HeaderBreadcrumb {
  label: string;
  href?: string;
}

interface BackBreadcrumbHeaderProps {
  title: string;
  backHref: string;
  backLabel?: string;
  breadcrumbs: HeaderBreadcrumb[];
  mobileStickyOffsetClass?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function BackBreadcrumbHeader({
  title,
  backHref,
  backLabel = "Back",
  breadcrumbs,
  mobileStickyOffsetClass = "top-0",
  actions,
  className,
}: BackBreadcrumbHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className={cn("sticky z-30 -mx-4 border-b bg-background/95 px-4 py-3 backdrop-blur md:hidden", mobileStickyOffsetClass)}>
        <div className="flex items-center gap-3">
          <Link to={backHref} className="inline-flex h-9 w-9 items-center justify-center rounded-full border bg-card">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-base font-semibold">{title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {breadcrumbs.map((item) => item.label).join(" / ")}
            </p>
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      </div>

      <div className="hidden md:block">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <Link to={backHref} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
              {backLabel}
            </Link>
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((item, index) => (
                  <div key={`${item.label}-${index}`} className="contents">
                    <BreadcrumbItem>
                      {item.href ? (
                        <BreadcrumbLink asChild>
                          <Link to={item.href}>{item.label}</Link>
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{item.label}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                    {index < breadcrumbs.length - 1 ? <BreadcrumbSeparator /> : null}
                  </div>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
            <h1 className="font-display text-2xl font-bold">{title}</h1>
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      </div>
    </div>
  );
}
