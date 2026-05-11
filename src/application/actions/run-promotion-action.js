import { CpeClient } from "@/src/infrastructure/http/cpe-client";

const ACTION_PATHS = {
  activateCampaign: "/promotions/actions/activate-campaign",
  activateAll: "/promotions/actions/activate-all",
  deactivateAll: "/promotions/actions/deactivate-all",
  resync: "/promotions/actions/sync"
};

export async function runPromotionAction({ token, action, payload }) {
  const client = new CpeClient({ token });
  const path = ACTION_PATHS[action];

  if (!path) {
    const error = new Error("Accion no soportada");
    error.status = 400;
    throw error;
  }

  return client.post(path, payload);
}
