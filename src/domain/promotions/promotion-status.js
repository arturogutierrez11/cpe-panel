export const PROMOTION_STATUSES = [
  "ACTIVE",
  "SYNC",
  "SYNCED",
  "DELETED",
  "PAUSED",
  "PENDING",
  "FINISHED",
  "FAILED_SYNC",
  "FAILED_ACTIVATION",
  "FAILED_DEACTIVATION"
];

export const STATUS_META = {
  ACTIVE: { label: "Active", tone: "active" },
  SYNC: { label: "Synced", tone: "synced" },
  SYNCED: { label: "Synced", tone: "synced" },
  DELETED: { label: "Deleted", tone: "deleted" },
  PAUSED: { label: "Paused", tone: "paused" },
  PENDING: { label: "Pending", tone: "pending" },
  FINISHED: { label: "Finished", tone: "finished" },
  FAILED_SYNC: { label: "Failed sync", tone: "failed" },
  FAILED_ACTIVATION: { label: "Failed activation", tone: "failed" },
  FAILED_DEACTIVATION: { label: "Failed deactivation", tone: "critical" }
};

export function normalizeStatus(status) {
  if (!status) return "ACTIVE";
  return status === "SYNCED" ? "SYNC" : status;
}
