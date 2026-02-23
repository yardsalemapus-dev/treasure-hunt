import { describe, it, expect, beforeEach, vi } from "vitest";
import { isInTrialPeriod, hasActiveSubscription, hasAccess } from "./stripe";
import { getDb } from "./db";

// Mock the database
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

describe("Stripe Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isInTrialPeriod", () => {
    it("should return true if user is within 7-day trial", async () => {
      const now = new Date();
      const trialStart = new Date(now);
      trialStart.setDate(trialStart.getDate() - 3); // 3 days into trial
      const trialEnd = new Date(trialStart);
      trialEnd.setDate(trialEnd.getDate() + 7);

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([
          {
            id: 1,
            trialStartDate: trialStart,
            trialEndDate: trialEnd,
          },
        ]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const result = await isInTrialPeriod(1);
      expect(result).toBe(true);
    });

    it("should return false if trial period has expired", async () => {
      const now = new Date();
      const trialStart = new Date(now);
      trialStart.setDate(trialStart.getDate() - 10); // 10 days ago
      const trialEnd = new Date(trialStart);
      trialEnd.setDate(trialEnd.getDate() + 7); // 3 days ago

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([
          {
            id: 1,
            trialStartDate: trialStart,
            trialEndDate: trialEnd,
          },
        ]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const result = await isInTrialPeriod(1);
      expect(result).toBe(false);
    });

    it("should return false if database is unavailable", async () => {
      vi.mocked(getDb).mockResolvedValue(null);

      const result = await isInTrialPeriod(1);
      expect(result).toBe(false);
    });
  });

  describe("hasActiveSubscription", () => {
    it("should return true if user has active subscription", async () => {
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setDate(periodEnd.getDate() + 30);

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([
          {
            id: 1,
            userId: 1,
            status: "active",
            currentPeriodEnd: periodEnd,
          },
        ]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const result = await hasActiveSubscription(1);
      expect(result).toBe(true);
    });

    it("should return false if subscription is canceled", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([
          {
            id: 1,
            userId: 1,
            status: "canceled",
            currentPeriodEnd: null,
          },
        ]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const result = await hasActiveSubscription(1);
      expect(result).toBe(false);
    });

    it("should return false if no subscription found", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const result = await hasActiveSubscription(1);
      expect(result).toBe(false);
    });
  });

  describe("hasAccess", () => {
    it("should return true if user is in trial period", async () => {
      const now = new Date();
      const trialStart = new Date(now);
      trialStart.setDate(trialStart.getDate() - 3);
      const trialEnd = new Date(trialStart);
      trialEnd.setDate(trialEnd.getDate() + 7);

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([
          {
            id: 1,
            trialStartDate: trialStart,
            trialEndDate: trialEnd,
          },
        ]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const result = await hasAccess(1);
      expect(result).toBe(true);
    });

    it("should return true if user has active paid subscription", async () => {
      // First call for trial check returns no trial
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi
          .fn()
          .mockResolvedValueOnce([
            {
              id: 1,
              trialStartDate: new Date(),
              trialEndDate: new Date(Date.now() - 86400000), // expired
            },
          ])
          .mockResolvedValueOnce([
            {
              id: 1,
              userId: 1,
              status: "active",
              currentPeriodEnd: new Date(Date.now() + 86400000),
            },
          ]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const result = await hasAccess(1);
      expect(result).toBe(true);
    });

    it("should return false if user has no trial and no subscription", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const result = await hasAccess(1);
      expect(result).toBe(false);
    });
  });
});
