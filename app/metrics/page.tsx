import { redirect } from "next/navigation";
import { ADMIN_METRICS_PATH } from "../../lib/admin";

export default function MetricsRedirectPage() {
  redirect(ADMIN_METRICS_PATH);
}
