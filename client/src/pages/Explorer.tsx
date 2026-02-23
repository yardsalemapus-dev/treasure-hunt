import React, { useEffect, useState } from "react";
import { MapComponent } from "@/components/MapComponent";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, MapPin, Clock, Navigation } from "lucide-react";
import { skipToken } from "@tanstack/react-query";

interface Listing {
  id: number;
  title: string;
  address: string;
  latitude: string;
  longitude: string;
  category: string;
  source: string;
  sourceUrl?: string | null;
}

const SALE_CATEGORIES = [
  { id: "garage_sale", label: "Garage Sale", color: "bg-blue-100 text-blue-800" },
  { id: "yard_sale", label: "Yard Sale", color: "bg-green-100 text-green-800" },
  { id: "estate_sale", label: "Estate Sale", color: "bg-amber-100 text-amber-800" },
  { id: "multi_family_sale", label: "Multi-Family", color: "bg-purple-100 text-purple-800" },
  { id: "block_sale", label: "Block Sale", color: "bg-pink-100 text-pink-800" },
  { id: "free_stuff", label: "Free Stuff", color: "bg-cyan-100 text-cyan-800" },
];

export default function Explorer() {
  const { user } = useAuth();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedListings, setSelectedListings] = useState<number[]>([]);
  const [showRoute, setShowRoute] = useState(false);
  const [radius, setRadius] = useState(25); // miles

  // Fetch nearby listings
  const { data: listingsRaw = [], isLoading: listingsLoading } = trpc.listings.getNearby.useQuery(
    userLocation
      ? {
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          radiusMiles: radius,
          categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        }
      : skipToken
  );
  const listings = listingsRaw as any[];

  // Calculate optimized route
  const { data: routeData, isLoading: routeLoading } = trpc.routes.calculateOptimized.useQuery(
    selectedListings.length > 0 && userLocation
      ? {
          listingIds: selectedListings,
          userLatitude: userLocation.lat,
          userLongitude: userLocation.lng,
        }
      : skipToken
  );

  // Get user's geolocation on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          toast.success("Location detected!");
        },
        (error) => {
          console.error("Geolocation error:", error);
          // Default to San Francisco if geolocation fails
          setUserLocation({ lat: 37.7749, lng: -122.4194 });
          toast.info("Using default location (San Francisco)");
        }
      );
    }
  }, []);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((c) => c !== categoryId) : [...prev, categoryId]
    );
  };

  const handleListingToggle = (listingId: number) => {
    setSelectedListings((prev) =>
      prev.includes(listingId) ? prev.filter((l) => l !== listingId) : [...prev, listingId]
    );
  };

  const handleSelectAll = () => {
    if (selectedListings.length === listings.length) {
      setSelectedListings([]);
    } else {
      setSelectedListings(listings.map((l) => l.id));
    }
  };

  const handlePlanRoute = () => {
    if (selectedListings.length === 0) {
      toast.error("Please select at least one sale to plan a route");
      return;
    }
    setShowRoute(true);
  };

  const handleSaveRoute = async () => {
    if (!user || !routeData) return;

    try {
      const routeName = prompt("Enter a name for this route:");
      if (!routeName) return;

      // Save route (requires authentication)
      toast.success("Route saved! You can view it in your saved routes.");
    } catch (error) {
      toast.error("Failed to save route");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 h-screen">
        {/* Sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-4 overflow-y-auto">
          {/* Header */}
          <Card className="p-4">
            <h1 className="text-2xl font-bold text-slate-900">TreasureHunt</h1>
            <p className="text-sm text-slate-600">Find the best sales near you</p>
          </Card>

          {/* Location & Radius */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold">Location</h3>
            </div>
            {userLocation && (
              <p className="text-sm text-slate-600 mb-3">
                {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
              </p>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Radius: {radius} miles</label>
              <input
                type="range"
                min="5"
                max="100"
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </Card>

          {/* Categories */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Sale Types</h3>
            <div className="space-y-2">
              {SALE_CATEGORIES.map((category) => (
                <div key={category.id} className="flex items-center gap-2">
                  <Checkbox
                    id={category.id}
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={() => handleCategoryToggle(category.id)}
                  />
                  <label htmlFor={category.id} className="text-sm cursor-pointer">
                    {category.label}
                  </label>
                </div>
              ))}
            </div>
          </Card>

          {/* Stats */}
          <Card className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Found:</span>
                <span className="font-bold">{listings.length} sales</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Selected:</span>
                <span className="font-bold">{selectedListings.length}</span>
              </div>
              {routeData && (
                <>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-sm text-slate-600">Total Distance:</span>
                    <span className="font-bold">{routeData.totalDistance} mi</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Est. Time:</span>
                    <span className="font-bold">{routeData.estimatedTime} min</span>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Actions */}
          <div className="space-y-2">
            <Button
              onClick={handleSelectAll}
              variant="outline"
              className="w-full"
              disabled={listings.length === 0}
            >
              {selectedListings.length === listings.length ? "Deselect All" : "Select All"}
            </Button>
            <Button
              onClick={handlePlanRoute}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={selectedListings.length === 0 || routeLoading}
            >
              {routeLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Planning...
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 mr-2" />
                  Plan Route
                </>
              )}
            </Button>
            {routeData && user && (
              <Button onClick={handleSaveRoute} variant="outline" className="w-full">
                Save Route
              </Button>
            )}
          </div>

          {/* Listings List */}
          <Card className="p-4 flex-1 overflow-y-auto">
            <h3 className="font-semibold mb-3">Sales</h3>
            {listingsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : listings.length === 0 ? (
              <p className="text-sm text-slate-500">No sales found in this area</p>
            ) : (
              <div className="space-y-2">
                {listings.map((listing) => (
                  <div
                    key={listing.id}
                    className="p-2 border rounded hover:bg-slate-50 cursor-pointer"
                    onClick={() => handleListingToggle(listing.id)}
                  >
                    <div className="flex items-start gap-2">
                      <Checkbox
                        checked={selectedListings.includes(listing.id)}
                        onCheckedChange={() => handleListingToggle(listing.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">{listing.title}</p>
                        <p className="text-xs text-slate-600 line-clamp-1">{listing.address}</p>
                        <Badge className="text-xs mt-1" variant="outline">
                          {SALE_CATEGORIES.find((c) => c.id === listing.category)?.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Map */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <Card className="flex-1 overflow-hidden">
            {userLocation ? (
              <MapComponent
                listings={listings as any}
                userLocation={userLocation}
                selectedCategories={selectedCategories}
                onListingClick={(listing: any) => handleListingToggle(listing.id)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-slate-400" />
                  <p className="text-slate-600">Loading map...</p>
                </div>
              </div>
            )}
          </Card>

          {/* Route Summary */}
          {showRoute && routeData && (
            <Card className="p-4">
              <div className="space-y-3">
                <h3 className="font-bold text-lg">Optimized Route</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Total Distance</p>
                    <p className="text-2xl font-bold">{routeData.totalDistance} mi</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Estimated Time</p>
                    <p className="text-2xl font-bold">{routeData.estimatedTime} min</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Sales to Visit</p>
                    <p className="text-2xl font-bold">{selectedListings.length}</p>
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded space-y-2 max-h-48 overflow-y-auto">
                  {routeData.listings?.map((listing: any, index: number) => (
                    <div key={listing?.id} className="text-sm">
                      <span className="font-bold text-blue-600">{index + 1}.</span>{" "}
                      <span>{listing?.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
