import { useState, useEffect } from "react";
import { MapView } from "@/components/Map";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { toast } from "sonner";
import { Loader2, MapPin, Clock, Navigation } from "lucide-react";
import { skipToken } from "@tanstack/react-query";

interface Listing {
  id: number;
  title: string;
  address: string;
  latitude: string;
  longitude: string;
  saleDate: string;
  startTime?: string;
  category: string;
  source: string;
}

export function Explorer() {
  const { t } = useLanguage();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedListings, setSelectedListings] = useState<number[]>([]);
  const [showRoute, setShowRoute] = useState(false);

  // Fetch nearby listings
  const { data: listingsRaw, isLoading: listingsLoading } = trpc.listings.getNearby.useQuery(
    userLocation
      ? {
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          radiusMiles: 10,
        }
      : skipToken
  );
  const listings = listingsRaw as any[];

  // Generate optimized routes
  const { data: routeData, isLoading: routeLoading } = trpc.routes.generateRoutes.useQuery(
    userLocation
      ? {
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          radiusMiles: 10,
          clusterRadiusMiles: 2,
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
        },
        () => {
          // Default to NYC if geolocation fails
          setUserLocation({ lat: 40.7128, lng: -74.006 });
        }
      );
    }
  }, []);

  const handleSelectListing = (id: number) => {
    setSelectedListings((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  };

  const handleGenerateRoute = () => {
    if (selectedListings.length === 0) {
      toast.error("Please select at least one sale");
      return;
    }
    setShowRoute(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t("explorer.title")}</h1>
            <p className="text-gray-600 mt-1">{t("explorer.findSales")}</p>
          </div>
          <LanguageToggle />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <Card className="h-96 overflow-hidden">
              {userLocation ? (
                <MapView initialCenter={{ lat: userLocation.lat, lng: userLocation.lng }} initialZoom={13} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Listings List */}
            <Card className="p-4">
              <h2 className="font-bold text-lg mb-3">{t("explorer.nearbyListings")}</h2>
              {listingsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : listings && listings.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {listings.map((listing: Listing) => (
                    <div
                      key={listing.id}
                      className="flex items-start gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer"
                      onClick={() => handleSelectListing(listing.id)}
                    >
                      <Checkbox
                        checked={selectedListings.includes(listing.id)}
                        onCheckedChange={() => handleSelectListing(listing.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{listing.title}</p>
                        <p className="text-xs text-gray-500 truncate">{listing.address}</p>
                        <Badge className="text-xs mt-1">{listing.category}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">{t("explorer.noListings")}</p>
              )}
            </Card>

            {/* Route Generation */}
            <Card className="p-4">
              <Button
                onClick={handleGenerateRoute}
                disabled={selectedListings.length === 0 || routeLoading}
                className="w-full gap-2"
              >
                {routeLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("explorer.generating")}
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4" />
                    {t("explorer.generateRoute")}
                  </>
                )}
              </Button>
            </Card>

            {/* Route Summary */}
            {showRoute && routeData && (
              <Card className="p-4">
                <h3 className="font-bold text-lg mb-3">{t("explorer.optimizedRoutes")}</h3>
                {routeData.routes && routeData.routes.length > 0 ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-600">{t("explorer.routesFound")}</p>
                        <p className="text-2xl font-bold">{routeData.routesCount}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">{t("explorer.listings")}</p>
                        <p className="text-2xl font-bold">{routeData.listingsCount}</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded space-y-2 max-h-48 overflow-y-auto">
                      {routeData.routes.map((route: any, routeIndex: number) => (
                        <div key={routeIndex} className="text-sm border-b pb-2">
                          <p className="font-bold text-blue-600">
                            {t("explorer.route")} {routeIndex + 1}
                          </p>
                          <div className="flex gap-2 text-xs text-gray-600 mt-1">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {route.listingIds.length} {t("explorer.stops")}
                            </span>
                            <span className="flex items-center gap-1">
                              <Navigation className="w-3 h-3" />
                              {route.totalDistance.toFixed(1)} mi
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {route.estimatedTime} min
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">{t("explorer.noRoutes")}</p>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
