import clsx from "clsx";
import { STATUS_META } from "@/src/domain/promotions/promotion-status";

export function StatusPill({ status }) {
  const meta = STATUS_META[status] || { label: status || "Sin estado", tone: "neutral" };

  return (
    <span className={clsx("status-pill", `status-pill--${meta.tone}`)} title={status || "Sin estado"}>
      <span aria-hidden="true" />
      {meta.label}
    </span>
  );
}
