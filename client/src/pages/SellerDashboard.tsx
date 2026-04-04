import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, BarChart3, MapPin, Users, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function SellerDashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    address: "",
    category: "garage_sale",
    saleDate: "",
    saleTime: "",
  });

  // Fetch seller's listings
  const { data: sellerListings = [] } = trpc.seller.getMyListings.useQuery();

  // Fetch seller analytics
  const { data: sellerAnalytics } = trpc.seller.getAnalytics.useQuery();

  // Create listing mutation
  const createListing = trpc.seller.createListing.useMutation({
    onSuccess: () => {
      setFormData({ title: "", description: "", address: "", category: "garage_sale", saleDate: "", saleTime: "" });
      setIsOpen(false);
    },
  });

  const handleSubmit = () => {
    createListing.mutate({
      title: formData.title,
      description: formData.description,
      address: formData.address,
      category: formData.category as any,
      saleDate: new Date(formData.saleDate),
      saleTime: formData.saleTime,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your garage sales and track visitor engagement</p>
        </div>

        {/* Stats */}
        {sellerAnalytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Listings</p>
                    <p className="text-2xl font-bold text-green-600">{sellerAnalytics.totalListings}</p>
                  </div>
                  <MapPin className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Visitors</p>
                    <p className="text-2xl font-bold text-blue-600">{sellerAnalytics.totalVisitors}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Rating</p>
                    <p className="text-2xl font-bold text-yellow-600">{sellerAnalytics.averageRating || "N/A"}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Reviews</p>
                    <p className="text-2xl font-bold text-purple-600">{sellerAnalytics.totalReviews}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Create New Listing */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="mb-6 bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Create New Sale Listing
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Sale Listing</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Sale Title</label>
                <Input
                  placeholder="e.g., Estate Sale - Vintage Furniture"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <Textarea
                  placeholder="Describe what you're selling..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Address</label>
                <Input
                  placeholder="123 Main St, City, State"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Category</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="garage_sale">Garage Sale</option>
                  <option value="estate_sale">Estate Sale</option>
                  <option value="yard_sale">Yard Sale</option>
                  <option value="multi_family">Multi-Family Sale</option>
                  <option value="block_sale">Block Sale</option>
                  <option value="antique_store">Antique Store</option>
                  <option value="thrift_store">Thrift Store</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">Sale Date</label>
                  <Input
                    type="date"
                    value={formData.saleDate}
                    onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Sale Time</label>
                  <Input
                    type="time"
                    value={formData.saleTime}
                    onChange={(e) => setFormData({ ...formData, saleTime: e.target.value })}
                  />
                </div>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={createListing.isPending}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {createListing.isPending ? "Creating..." : "Create Listing"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* My Listings */}
        <Card>
          <CardHeader>
            <CardTitle>My Active Listings</CardTitle>
          </CardHeader>
          <CardContent>
            {sellerListings.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No listings yet. Create your first sale!</p>
            ) : (
              <div className="space-y-4">
                {sellerListings.map((listing: any) => (
                  <div key={listing.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{listing.title}</h3>
                        <p className="text-sm text-gray-600">{listing.address}</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        {listing.category.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{listing.description}</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-blue-50 p-2 rounded">
                        <p className="text-xs text-gray-600">Views</p>
                        <p className="font-semibold text-blue-600">{listing.viewCount || 0}</p>
                      </div>
                      <div className="bg-green-50 p-2 rounded">
                        <p className="text-xs text-gray-600">Clicks</p>
                        <p className="font-semibold text-green-600">{listing.clickCount || 0}</p>
                      </div>
                      <div className="bg-yellow-50 p-2 rounded">
                        <p className="text-xs text-gray-600">Rating</p>
                        <p className="font-semibold text-yellow-600">{listing.averageRating || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
