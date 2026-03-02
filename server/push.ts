import webpush from "web-push";
import * as storage from "./storage.js";

let vapidInitialized = false;

export async function initVapid() {
  if (vapidInitialized) return;

  let publicKey = await storage.getSetting("vapid_public_key");
  let privateKey = await storage.getSetting("vapid_private_key");

  if (!publicKey || !privateKey) {
    const keys = webpush.generateVAPIDKeys();
    publicKey = keys.publicKey;
    privateKey = keys.privateKey;
    await storage.setSetting("vapid_public_key", publicKey);
    await storage.setSetting("vapid_private_key", privateKey);
  }

  webpush.setVapidDetails(
    "mailto:admin@evd.co.il",
    publicKey,
    privateKey
  );

  vapidInitialized = true;
}

export async function getVapidPublicKey(): Promise<string> {
  const key = await storage.getSetting("vapid_public_key");
  if (!key) throw new Error("VAPID keys not initialized");
  return key;
}

export async function sendPushToSubscriptions(
  subscriptions: any[],
  payload: { title: string; body: string; url?: string }
) {
  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(sub.subscription as any, JSON.stringify(payload))
    )
  );
  return results;
}
