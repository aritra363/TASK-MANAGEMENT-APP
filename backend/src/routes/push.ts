import { Router } from "express";
import prisma from "../db/client";
import { authMiddleware } from "../middleware/auth";
import { getVapidPublicKey } from "../utils/webpush";

const router = Router();

/**
 * Save subscription for logged-in user.
 * Body: { endpoint: string, keys: { p256dh, auth } }
 */
router.post("/subscribe", authMiddleware, async (req: any, res) => {
  const user = req.user;
  const { endpoint, keys } = req.body;

  if (!endpoint || !keys) {
    return res.status(400).json({ message: "Invalid subscription" });
  }

  try {
    const existing = await prisma.pushSubscription.findUnique({ where: { endpoint } });
    if (existing) {
      return res.json({ ok: true });
    }

    await prisma.pushSubscription.create({
      data: {
        userId: user.id,
        endpoint,
        keys: JSON.stringify(keys) // store as string (SQLite can't do Json)
      }
    });

    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

/**
 * Unsubscribe a given endpoint (for current user)
 */
router.post("/unsubscribe", authMiddleware, async (req: any, res) => {
  const { endpoint } = req.body;
  if (!endpoint) return res.status(400).json({ message: "Invalid" });

  try {
    await prisma.pushSubscription.deleteMany({ where: { endpoint } });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

/**
 * Expose VAPID public key for frontend
 */
router.get("/vapidPublicKey", (_req, res) => {
  res.json({ publicKey: getVapidPublicKey() });
});

export default router;
