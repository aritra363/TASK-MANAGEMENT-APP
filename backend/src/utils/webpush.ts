import webpush from "web-push";
import dotenv from "dotenv";
import prisma from "../db/client";
dotenv.config();

const publicKey = process.env.VAPID_PUBLIC_KEY || "";
const privateKey = process.env.VAPID_PRIVATE_KEY || "";
const contact = process.env.VAPID_CONTACT || "mailto:admin@example.com";

webpush.setVapidDetails(contact, publicKey, privateKey);

/**
 * Sends a web push and if the push endpoint is stale (410/404 etc),
 * removes the subscription from DB to keep it clean.
 */
export const sendPush = async (subscription: any, payload: any) => {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (err: any) {
    const status = err?.statusCode;
    if (status === 410 || status === 404) {
      try {
        const endpoint = subscription.endpoint ?? subscription?.endpoint;
        if (endpoint) {
          await prisma.pushSubscription.deleteMany({ where: { endpoint } });
          console.log("Deleted stale push subscription:", endpoint);
        }
      } catch (delErr) {
        console.warn("Failed to delete stale subscription:", delErr);
      }
    } else {
      console.error("webpush error:", err);
    }
    throw err;
  }
};

export const getVapidPublicKey = () => publicKey;
