import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { inventoryItems, salesReports } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const inventoryRouter = router({
  // Add inventory item
  addItem: protectedProcedure
    .input(
      z.object({
        listingId: z.number(),
        itemName: z.string(),
        category: z.string().optional(),
        quantity: z.number().default(1),
        price: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }

      try {
        await db.insert(inventoryItems).values({
          listingId: input.listingId,
          userId: ctx.user.id,
          itemName: input.itemName,
          category: input.category,
          quantity: input.quantity,
          price: input.price ? input.price.toString() : null,
          status: "available",
        });

        return { success: true };
      } catch (error) {
        console.error("Failed to add inventory item:", error);
        throw new Error("Failed to add inventory item");
      }
    }),

  // Get inventory for a listing
  getListingInventory: protectedProcedure
    .input(z.object({ listingId: z.number() }))
    .query(async ({ ctx, input }: any) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }

      try {
        const items = await db
          .select()
          .from(inventoryItems)
          .where(
            and(
              eq(inventoryItems.listingId, input.listingId),
              eq(inventoryItems.userId, ctx.user.id)
            )
          );

        return items.map((item: any) => ({
          id: item.id,
          itemName: item.itemName,
          category: item.category,
          quantity: item.quantity,
          price: item.price ? parseFloat(item.price.toString()) : null,
          status: item.status,
          soldAt: item.soldAt,
          createdAt: item.createdAt,
        }));
      } catch (error) {
        console.error("Failed to get inventory:", error);
        throw new Error("Failed to get inventory");
      }
    }),

  // Mark item as sold
  markItemSold: protectedProcedure
    .input(
      z.object({
        itemId: z.number(),
        quantity: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }

      try {
        const [item] = await db
          .select()
          .from(inventoryItems)
          .where(
            and(
              eq(inventoryItems.id, input.itemId),
              eq(inventoryItems.userId, ctx.user.id)
            )
          );

        if (!item) {
          throw new Error("Item not found");
        }

        const quantitySold = input.quantity || item.quantity;

        // If all items are sold, mark as sold
        if (quantitySold >= item.quantity) {
          await db
            .update(inventoryItems)
            .set({
              status: "sold",
              soldAt: new Date(),
            })
            .where(eq(inventoryItems.id, input.itemId));
        } else {
          // Update quantity if partial sale
          const newQuantity = item.quantity - quantitySold;
          await db
            .update(inventoryItems)
            .set({
              quantity: newQuantity,
            })
            .where(eq(inventoryItems.id, input.itemId));
        }

        return { success: true };
      } catch (error) {
        console.error("Failed to mark item sold:", error);
        throw new Error("Failed to mark item sold");
      }
    }),

  // Generate sales report for a listing
  generateSalesReport: protectedProcedure
    .input(z.object({ listingId: z.number() }))
    .mutation(async ({ ctx, input }: any) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }

      try {
        const items = await db
          .select()
          .from(inventoryItems)
          .where(
            and(
              eq(inventoryItems.listingId, input.listingId),
              eq(inventoryItems.userId, ctx.user.id)
            )
          );

        const soldItems = items.filter((i) => i.status === "sold");
        const totalItemsSold = soldItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        const totalRevenue = soldItems.reduce((sum, item) => {
          const price = item.price ? parseFloat(item.price.toString()) : 0;
          return sum + price * item.quantity;
        }, 0);

        // Create or update sales report
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const report = await db
          .select()
          .from(salesReports)
          .where(
            and(
              eq(salesReports.listingId, input.listingId),
              eq(salesReports.reportDate, today)
            )
          );

        if (report.length > 0) {
          await db
            .update(salesReports)
            .set({
              totalItemsSold,
              totalRevenue: totalRevenue.toString(),
            })
            .where(eq(salesReports.id, report[0].id));
        } else {
          await db.insert(salesReports).values({
            userId: ctx.user.id,
            listingId: input.listingId,
            totalItemsSold,
            totalRevenue: totalRevenue.toString(),
            reportDate: today,
          });
        }

        return {
          success: true,
          totalItemsSold,
          totalRevenue,
          reportDate: today.toISOString().split("T")[0],
        };
      } catch (error) {
        console.error("Failed to generate sales report:", error);
        throw new Error("Failed to generate sales report");
      }
    }),

  // Get sales reports for a user
  getSalesReports: protectedProcedure
    .input(
      z.object({
        listingId: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }: any) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }

      try {
        let query = db
          .select()
          .from(salesReports)
          .where(eq(salesReports.userId, ctx.user.id));

        // This is a simplified version - in production, use proper date filtering
        const reports = await query;

        return reports.map((r) => ({
          id: r.id,
          listingId: r.listingId,
          totalItemsSold: r.totalItemsSold,
          totalRevenue: parseFloat(r.totalRevenue?.toString() || "0"),
          reportDate: r.reportDate,
          createdAt: r.createdAt,
        }));
      } catch (error) {
        console.error("Failed to get sales reports:", error);
        throw new Error("Failed to get sales reports");
      }
    }),

  // Get inventory statistics
  getInventoryStats: protectedProcedure
    .input(z.object({ listingId: z.number() }))
    .query(async ({ ctx, input }: any) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }

      try {
        const items = await db
          .select()
          .from(inventoryItems)
          .where(
            and(
              eq(inventoryItems.listingId, input.listingId),
              eq(inventoryItems.userId, ctx.user.id)
            )
          );

        const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
        const soldItems = items
          .filter((i) => i.status === "sold")
          .reduce((sum, i) => sum + i.quantity, 0);
        const availableItems = items
          .filter((i) => i.status === "available")
          .reduce((sum, i) => sum + i.quantity, 0);
        const totalValue = items.reduce((sum, item) => {
          const price = item.price ? parseFloat(item.price.toString()) : 0;
          return sum + price * item.quantity;
        }, 0);

        const soldValue = items
          .filter((i) => i.status === "sold")
          .reduce((sum, item) => {
            const price = item.price ? parseFloat(item.price.toString()) : 0;
            return sum + price * item.quantity;
          }, 0);

        return {
          totalItems,
          soldItems,
          availableItems,
          totalValue,
          soldValue,
          sellThroughRate: totalItems > 0 ? (soldItems / totalItems) * 100 : 0,
        };
      } catch (error) {
        console.error("Failed to get inventory stats:", error);
        throw new Error("Failed to get inventory stats");
      }
    }),
});
