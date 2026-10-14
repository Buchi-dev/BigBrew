import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORY_IMAGES } from "@/mocks/data";
import { STATUS_LABEL } from "@/lib/logic";
import type { Branch, OrderStatus } from "@/types";
import { branchIsOpen } from "@/lib/logic";

const STATUS_STYLE: Record<OrderStatus, string> = {
  pending: "bg-warning-soft text-foreground",
  accepted: "bg-accent text-accent-foreground",
  preparing: "bg-primary-soft text-primary-hover",
  ready: "bg-success-soft text-success",
  completed: "bg-muted text-muted-foreground",
  rejected: "bg-danger-soft text-destructive",
  cancelled: "bg-danger-soft text-destructive",
  expired: "bg-muted text-muted-foreground",
  noshow: "bg-danger-soft text-destructive",
};

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        STATUS_STYLE[status],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function PayBadge({ paid }: { paid: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        paid ? "bg-success-soft text-success" : "bg-muted text-muted-foreground",
      )}
    >
      {paid ? "Paid" : "Unpaid"}
    </span>
  );
}

export function ProductImage({
  image,
  alt,
  className,
  eager,
}: {
  image: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  const src = CATEGORY_IMAGES[image] ?? image;
  return (
    <div className={cn("relative overflow-hidden bg-beige", className)}>
      {src ? (
        <img
          src={src}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          width={816}
          height={816}
          className="h-full w-full object-cover"
        />
      ) : null}
    </div>
  );
}

export function DemoTag({
  children = "Demo",
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-dashed border-caramel bg-warning-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent-foreground",
        className,
      )}
    >
      <FlaskConical className="h-3 w-3" aria-hidden /> {children}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card px-6 py-12 text-center">
      <div className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary">
        {icon}
      </div>
      <h3 className="text-lg font-bold">{title}</h3>
      {body && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function BranchStatus({ branch, ignoreHours }: { branch: Branch; ignoreHours: boolean }) {
  const open = branchIsOpen(branch, ignoreHours);
  const label = !open ? "Closed" : branch.accepting ? "Accepting orders" : "Orders paused";
  const tone = !open
    ? "bg-danger-soft text-destructive"
    : branch.accepting
      ? "bg-success-soft text-success"
      : "bg-warning-soft text-foreground";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tone,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {label}
    </span>
  );
}

export function Logo({ to = "/", dark }: { to?: string; dark?: boolean }) {
  return (
    <Link to={to} className="flex items-center gap-2" aria-label="BigBrew home">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary font-display text-lg font-extrabold text-primary-foreground">
        B
      </span>
      <span
        className={cn(
          "font-display text-xl font-extrabold tracking-tight",
          dark ? "text-sidebar-accent-foreground" : "text-foreground",
        )}
      >
        Big<span className="text-primary">Brew</span>
      </span>
    </Link>
  );
}

export function PageLoader() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 p-6" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

export function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });
}
export function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
