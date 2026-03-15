import type { ReactNode } from "react";
import { useState } from "react";
import { Ellipsis, Eye } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface ActionItem {
  label: string;
  onSelect: () => void;
  icon?: ReactNode;
  destructive?: boolean;
}

interface ActionMenuSheetProps {
  title: string;
  description?: string;
  details?: ReactNode;
  onViewDetails?: () => void;
  actions: ActionItem[];
}

export function ActionMenuSheet({ title, description, details, onViewDetails, actions }: ActionMenuSheetProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const handleSelect = (action: ActionItem) => {
    setOpen(false);
    action.onSelect();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Ellipsis className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn(isMobile ? "rounded-t-2xl" : "w-full max-w-md", "overflow-y-auto")}
      >
        <SheetHeader className="text-left">
          <SheetTitle>{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>

        <div className="mt-5 space-y-3">
          {onViewDetails ? (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                setOpen(false);
                onViewDetails();
              }}
            >
              <Eye className="h-4 w-4" />
              View details
            </Button>
          ) : null}

          {actions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className={cn(
                "w-full justify-start",
                action.destructive && "border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive",
              )}
              onClick={() => handleSelect(action)}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>

        {details ? (
          <div className="mt-6 rounded-xl border bg-muted/40 p-4">
            <p className="mb-3 text-sm font-medium text-muted-foreground">Details</p>
            <div className="space-y-3 text-sm">{details}</div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
