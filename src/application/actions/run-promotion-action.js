import { CpeClient } from "@/src/infrastructure/http/cpe-client";

const ACTION_PATHS = {
  activateAll: "/promotions/activate",
  deactivateAll: "/promotions/deactivate",
  deactivateFailed: "/promotions/deactivate-failed",
  resync: "/promotions/sync",
  syncOne: "/promotions/sync-one"
};

export async function runPromotionAction({ token, action, payload }) {
  const client = new CpeClient({ token });
  const path = ACTION_PATHS[action];

  if (!path) {
    const error = new Error("Accion no soportada");
    error.status = 400;
    throw error;
  }

  const body = buildActionPayload(action, payload);

  return client.post(path, body);
}

function buildActionPayload(action, payload = {}) {
  if (action === "syncOne") {
    if (!payload.promotionId) {
      const error = new Error("Promotion ID requerido");
      error.status = 400;
      throw error;
    }

    return {
      promotionId: payload.promotionId,
      updatedBy: payload.updatedBy || "arturo"
    };
  }

  return { updatedBy: payload.updatedBy || "arturo" };
}
