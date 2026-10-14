import { createFileRoute } from "@tanstack/react-router";
import { Bell, RotateCcw, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/_customer/profile")({
  head: () => ({
    meta: [
      { title: "Profile - BigBrew" },
      { name: "description", content: "Manage demo profile settings for BigBrew." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { currentUser, state, actions } = useStore();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <section className="rounded-3xl border bg-card p-5 shadow-card">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold">{currentUser.name}</h1>
            <p className="text-sm text-muted-foreground">
              {currentUser.email} · {currentUser.phone}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-4 shadow-card">
        <h2 className="font-bold">Demo preferences</h2>
        <label className="mt-4 flex items-center justify-between gap-3 rounded-xl border p-3">
          <span>
            <span className="flex items-center gap-2 font-semibold">
              <Bell className="h-4 w-4" /> Sound alerts
            </span>
            <span className="block text-xs text-muted-foreground">
              Used by staff boards in this prototype.
            </span>
          </span>
          <input
            type="checkbox"
            checked={state.settings.sound}
            onChange={(e) => actions.setSettings({ sound: e.target.checked })}
            className="h-5 w-5 accent-primary"
          />
        </label>
        <label className="mt-2 flex items-center justify-between gap-3 rounded-xl border p-3">
          <span>
            <span className="font-semibold">Ignore branch hours</span>
            <span className="block text-xs text-muted-foreground">
              Keeps demo checkout open while testing.
            </span>
          </span>
          <input
            type="checkbox"
            checked={state.settings.ignoreHours}
            onChange={(e) => actions.setSettings({ ignoreHours: e.target.checked })}
            className="h-5 w-5 accent-primary"
          />
        </label>
      </section>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          actions.resetDemo();
          toast.success("Demo data reset");
        }}
      >
        <RotateCcw /> Reset demo data
      </Button>
    </div>
  );
}
