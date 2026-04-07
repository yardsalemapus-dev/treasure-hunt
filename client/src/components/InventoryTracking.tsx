import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Check } from "lucide-react";

interface InventoryItem {
  id: number;
  itemName: string;
  category?: string;
  quantity: number;
  price?: number | null;
  status: string;
  createdAt: Date;
}

export function InventoryTracking({ listingId }: { listingId: number }) {
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState("");

  const { data: inventory = [], isLoading, refetch } = trpc.inventory.getListingInventory.useQuery({
    listingId,
  });

  const { data: stats } = trpc.inventory.getInventoryStats.useQuery({ listingId });

  const addItemMutation = trpc.inventory.addItem.useMutation();
  const markSoldMutation = trpc.inventory.markItemSold.useMutation();
  const generateReportMutation = trpc.inventory.generateSalesReport.useMutation();

  const handleAddItem = async () => {
    if (!itemName.trim()) {
      alert("Please enter an item name");
      return;
    }

    try {
      await addItemMutation.mutateAsync({
        listingId,
        itemName,
        category: category || undefined,
        quantity,
        price: price ? parseFloat(price) : undefined,
      });

      setItemName("");
      setCategory("");
      setQuantity(1);
      setPrice("");
      refetch();
      alert("Item added successfully!");
    } catch (error) {
      alert("Failed to add item");
    }
  };

  const handleMarkSold = async (itemId: number) => {
    try {
      await markSoldMutation.mutateAsync({ itemId });
      refetch();
      alert("Item marked as sold!");
    } catch (error) {
      alert("Failed to mark item as sold");
    }
  };

  const handleGenerateReport = async () => {
    try {
      const result = await generateReportMutation.mutateAsync({ listingId });
      alert(
        `Report generated: ${result.totalItemsSold} items sold, $${result.totalRevenue.toFixed(2)} revenue`
      );
    } catch (error) {
      alert("Failed to generate report");
    }
  };

  if (isLoading) {
    return <div>Loading inventory...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Add Item to Inventory</CardTitle>
          <CardDescription>Track items you're selling at this event</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Item name"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
            <Input
              placeholder="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              min="1"
            />
            <Input
              type="number"
              placeholder="Price ($)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              step="0.01"
            />
          </div>
          <Button onClick={handleAddItem} className="w-full">
            Add Item
          </Button>
        </CardContent>
      </Card>

      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Inventory Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold">{stats.totalItems}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Sold</p>
                <p className="text-2xl font-bold text-green-600">{stats.soldItems}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Available</p>
                <p className="text-2xl font-bold">{stats.availableItems}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Sell-Through Rate</p>
                <p className="text-2xl font-bold">
                  {stats.sellThroughRate.toFixed(0)}%
                </p>
              </div>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Total Value</span>
                <span className="font-semibold">${stats.totalValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Revenue from Sales</span>
                <span className="font-semibold text-green-600">
                  ${stats.soldValue.toFixed(2)}
                </span>
              </div>
            </div>
            <Button onClick={handleGenerateReport} className="w-full mt-4">
              Generate Sales Report
            </Button>
          </CardContent>
        </Card>
      )}

      {inventory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Inventory Items</CardTitle>
            <CardDescription>{inventory.length} items in inventory</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {inventory.map((item: InventoryItem) => (
                <div
                  key={item.id}
                  className={`p-3 border rounded-lg flex justify-between items-center ${
                    item.status === "sold" ? "bg-gray-50 opacity-60" : ""
                  }`}
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.itemName}</p>
                    <div className="text-sm text-gray-600">
                      {item.category && <span>{item.category} • </span>}
                      <span>Qty: {item.quantity}</span>
                      {item.price && <span> • ${item.price.toFixed(2)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        item.status === "sold"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {item.status === "sold" ? "Sold" : "Available"}
                    </span>
                    {item.status === "available" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMarkSold(item.id)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
