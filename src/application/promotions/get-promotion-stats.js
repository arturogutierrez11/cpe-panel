import { CpeClient } from "@/src/infrastructure/http/cpe-client";

const emptyStats = {
  total: 0,
  smart: { total: 0, active: 0, synced: 0, deleted: 0, finished: 0, failedActivation: 0 },
  deal: { total: 0, active: 0, synced: 0, deleted: 0, finished: 0, failedActivation: 0 },
  preNegotiated: { total: 0, active: 0, synced: 0, deleted: 0, finished: 0, failedActivation: 0 }
};

export async function getPromotionStats({ token }) {
  const client = new CpeClient({ token });

  try {
    return normalizeStats(await client.get("/promotions/stats"));
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      throw error;
    }

    return emptyStats;
  }
}

function normalizeStats(response) {
  return {
    total: Number(response.total || 0),
    smart: normalizeGroup(response.smart),
    deal: normalizeGroup(response.deal),
    preNegotiated: normalizeGroup(response.preNegotiated)
  };
}

function normalizeGroup(group = {}) {
  return {
    total: Number(group.total || 0),
    active: Number(group.active || 0),
    synced: Number(group.synced || 0),
    deleted: Number(group.deleted || 0),
    finished: Number(group.finished || 0),
    failedActivation: Number(group.failedActivation || 0)
  };
}
