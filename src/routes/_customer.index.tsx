import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock, CupSoda, MapPin, PackageCheck, Timer, Wallet } from "lucide-react";
import hero from "@/assets/hero-drinks.jpg";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { useMenu } from "@/lib/hooks";
import { BranchStatus, ProductImage } from "@/components/shared";
import { ProductCard } from "@/components/customer/ProductCard";

export const Route = createFileRoute("/_customer/")({
  head: () => ({
    meta: [
      { title: "BigBrew — Big cravings. Zero waiting in line." },
      {
        name: "description",
        content:
          "Order your favorite BigBrew drinks ahead and pick them up fresh at your chosen branch.",
      },
      { property: "og:title", content: "BigBrew — Big cravings. Zero waiting in line." },
      {
        property: "og:description",
        content: "Order ahead and pick up fresh at your chosen BigBrew branch.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { state } = useStore();
  const { products, fromPrice, soldOut, catName } = useMenu();
  const branch = state.branches.find((b) => b.id === state.selectedBranchId);
  const popular = products.filter((p) => p.popular).slice(0, 8);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-hero text-primary-foreground">
        <div className="grid items-center md:grid-cols-2">
          <div className="relative z-10 p-6 sm:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-90">
              Order ahead · Pay at pickup
            </p>
            <h1 className="mt-2 text-4xl font-extrabold leading-[1.02] sm:text-5xl lg:text-6xl">
              Big cravings.
              <br />
              Zero waiting in line.
            </h1>
            <p className="mt-3 max-w-md text-sm opacity-90 sm:text-base">
              Order your favorite drinks ahead and pick them up fresh at your chosen BigBrew branch.
            </p>
            <Button asChild variant="hero" size="lg" className="mt-5">
              <Link to="/menu" search={{}}>
                Order now <ArrowRight />
              </Link>
            </Button>
          </div>
          <img
            src={hero}
            alt="Iced milk tea and coffee drinks"
            width={1280}
            height={960}
            className="h-44 w-full object-cover sm:h-64 md:h-full md:max-h-[420px]"
          />
        </div>
      </section>

      {branch && (
        <section className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4 shadow-card">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold">{branch.name}</h2>
              <BranchStatus branch={branch} ignoreHours={state.settings.ignoreHours} />
            </div>
            <p className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {branch.openTime}–{branch.closeTime}
              </span>
              <span className="inline-flex items-center gap-1">
                <Timer className="h-3.5 w-3.5" />~{branch.prepMinutes} min prep
              </span>
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/branches">Change</Link>
          </Button>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-xl font-bold">Browse categories</h2>
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 md:grid md:grid-cols-7 md:overflow-visible">
          {state.categories.map((c) => (
            <Link
              key={c.id}
              to="/menu"
              search={{ category: c.id }}
              className="group w-24 shrink-0 text-center md:w-auto"
            >
              <ProductImage
                image={c.image}
                alt=""
                className="aspect-square rounded-2xl border transition group-hover:border-primary"
              />
              <span className="mt-1.5 block text-xs font-semibold">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-xl font-bold">Popular right now</h2>
          <Link
            to="/menu"
            search={{}}
            className="text-sm font-semibold text-primary hover:underline"
          >
            See all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {popular.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              price={fromPrice(p)}
              soldOut={soldOut(p)}
              categoryName={catName(p.categoryId)}
            />
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-ink p-5 text-ink-foreground">
        <h2 className="text-lg font-bold">How ordering works</h2>
        <ol className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            [CupSoda, "Choose your drinks"],
            [ArrowRight, "Place your order"],
            [Timer, "Track preparation"],
            [Wallet, "Pay & pick up"],
          ].map(([Icon, label], i) => {
            const I = Icon as typeof CupSoda;
            return (
              <li
                key={i}
                className="flex items-center gap-2 rounded-xl bg-sidebar-accent p-3 text-sm font-semibold"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                  <I className="h-4 w-4" />
                </span>
                <span>
                  <span className="opacity-60">{i + 1}.</span> {label as string}
                </span>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 flex items-center gap-1.5 text-xs opacity-70">
          <PackageCheck className="h-3.5 w-3.5" /> Payment is cash at the store. No online payment
          needed.
        </p>
      </section>
    </div>
  );
}
