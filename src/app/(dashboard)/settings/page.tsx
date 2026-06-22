"use client";

import { useTheme } from "next-themes";
import { Card, CardHeader } from "@/components/common/Card";
import { Select } from "@/components/common/Select";
import { Button } from "@/components/common/Button";
import { toast } from "sonner";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted">Configure your application preferences</p>
      </div>

      <Card>
        <CardHeader title="Appearance" subtitle="Customize the look and feel" />
        <div className="max-w-sm space-y-4">
          <Select
            label="Theme"
            options={[
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
              { value: "system", label: "System" },
            ]}
            value={theme || "light"}
            onChange={(e) => {
              setTheme(e.target.value);
              toast.success("Theme updated");
            }}
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="Notifications" subtitle="Manage notification preferences" />
        <div className="space-y-3">
          {["Email notifications", "Transaction alerts", "Request approvals", "Login alerts"].map(
            (item) => (
              <label key={item} className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-border text-primary"
                />
                {item}
              </label>
            )
          )}
        </div>
        <Button className="mt-4" onClick={() => toast.success("Settings saved")}>
          Save Settings
        </Button>
      </Card>

      <Card>
        <CardHeader title="Security" subtitle="Account security settings" />
        <div className="space-y-3 text-sm text-muted">
          <p>Two-factor authentication: <span className="text-foreground font-medium">Disabled</span></p>
          <p>Last login: <span className="text-foreground font-medium">Today</span></p>
          <p>Session timeout: <span className="text-foreground font-medium">30 minutes</span></p>
        </div>
      </Card>
    </div>
  );
}
