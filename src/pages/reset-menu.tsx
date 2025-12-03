import { useEffect } from "react";
import { resetMenuItems } from "@/lib/db";

export default function ResetMenu() {
  useEffect(() => {
    resetMenuItems().then(() => {
      alert("Menu reset completed! Reload Billing page.");
      window.location.href = "/billing";
    });
  }, []);

  return <div style={{ padding: 30 }}>Resetting menu…</div>;
}
