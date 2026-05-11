export const PROMOTION_STATUSES = ["ACTIVE", "SYNC", "SYNCED", "DELETED", "PAUSED"];

export const STATUS_META = {
  ACTIVE: { label: "Activas", tone: "success" },
  SYNC: { label: "Sincronizadas", tone: "info" },
  SYNCED: { label: "Sincronizadas", tone: "info" },
  DELETED: { label: "Desparticipadas", tone: "danger" },
  PAUSED: { label: "Pausadas", tone: "warning" }
};

export function normalizeStatus(status) {
  if (!status) return "ACTIVE";
  return status === "SYNCED" ? "SYNC" : status;
}
