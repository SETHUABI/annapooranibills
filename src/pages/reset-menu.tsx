import { useEffect } from "react";
import { resetMenuItems } from "@/lib/db";

export default function ResetMenuPage() {
  useEffect(() => {
    async function run() {
      await resetMenuItems();
      alert("Menu Reset Completed! Now reload Billing page.");
      window.location.href = "/billing";
    }
    run();
  }, []);

  return (
    <div style={{ padding: 40, fontSize: 22 }}>
      Resetting menu items… please wait.
    </div>
  );
}
