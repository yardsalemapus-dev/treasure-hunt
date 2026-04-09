import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MapView } from "@/components/Map";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import {
  Loader2,
  MapPin,
  Filter,
  LogOut,
  Clock,
  Route,
  Share2,
  Bookmark,
  Navigation,
  Copy,
  Facebook,
  Twitter,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type SaleCategory =
  | "garage_sale"
  | "yard_sale"
  | "estate_sale"
  | "multi_family_sale"
  | "block_sale"
  | "free_stuff"
  | "thrift_store"
  | "antique_store";

const CATEGORY_LABELS: Record<SaleCategory, string> = {
  garage_sale: "Garage Sale",
  yard_sale: "Yard Sale",
  estate_sale: "Estate Sale",
  multi_family_sale: "Multi-Family",
  block_sale: "Block Sale",
  free_stuff: "Free Stuff",
  thrift_store: "Thrift Store",
  antique_store: "Antique Store",
};

interface RouteData {
  listings: any[];
  totalDistance: number;
  estimatedTime: number;
  waypoints: any[];
}

export default function TrialDashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<SaleCategory[]>([
    "garage_sale",
    "yard_sale",
    "estate_sale",
  ]);
  const [radius, setRadius] = useState(5);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [selectedListings, setSelectedListings] = useState<Set<number>>(new Set());
  const [optimizedRoute, setOptimizedRoute] = useState<RouteData | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [savedRoutes, setSavedRoutes] = useState<any[]>([]);
  const [showSavedRoutes, setShowSavedRoutes] = useState(false);

  // Get subscription status
  const { data: subscriptionStatus } = trpc.stripe.getSubscriptionStatus.useQuery();

  // Fetch nearby listings
  const { data: nearbyListings, isLoading: listingsLoading } = trpc.listings.getNearby.useQuery(
    userLocation
      ? {
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          radiusMiles: radius,
          categories: selectedCategories,
        }
      : (undefined as any),
    {
      enabled: !!userLocation,
    }
  );

  // Fetch saved routes
  const { data: userSavedRoutes } = trpc.routes.getSavedRoutes.useQuery();

  const logoutMutation = trpc.auth.logout.useMutation();
  const optimizeRouteMutation = trpc.routes.optimizeRoute.useMutation();
  const saveRouteMutation = trpc.routes.saveRoute.useMutation();

  // Calculate trial days left
  useEffect(() => {
    if (subscriptionStatus?.trialEndDate) {
      const now = new Date();
      const trialEnd = new Date(subscriptionStatus.trialEndDate);
      const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      setTrialDaysLeft(Math.max(0, daysLeft));
    }
  }, [subscriptionStatus]);

  // Update saved routes
  useEffect(() => {
    if (userSavedRoutes) {
      setSavedRoutes(userSavedRoutes);
    }
  }, [userSavedRoutes]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  const requestLocation = () => {
    setLocationLoading(true);

    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setLocationLoading(false);

        if (mapRef.current) {
          mapRef.current.setCenter({ lat: latitude, lng: longitude });
          mapRef.current.setZoom(14);
        }
      },
      () => {
        toast.error("Unable to get your location");
        setLocationLoading(false);
      }
    );
  };

  // Plot markers on map
  useEffect(() => {
    if (!mapRef.current || !nearbyListings) return;

    markersRef.current.forEach((marker) => {
      marker.map = null;
    });
    markersRef.current = [];

    nearbyListings.forEach((listing) => {
      const isSelected = selectedListings.has(listing.id);
      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapRef.current,
        position: {
          lat: parseFloat(listing.latitude as any),
          lng: parseFloat(listing.longitude as any),
        },
        title: listing.title,
      });

      // Style marker based on selection
      const markerDiv = document.createElement("div");
      markerDiv.style.width = isSelected ? "40px" : "30px";
      markerDiv.style.height = isSelected ? "40px" : "30px";
      markerDiv.style.borderRadius = "50%";
      markerDiv.style.backgroundColor = isSelected ? "#3b82f6" : "#ef4444";
      markerDiv.style.border = "3px solid white";
      markerDiv.style.cursor = "pointer";
      marker.content = markerDiv;

      marker.addListener("click", () => {
        toggleListingSelection(listing.id);
      });

      markersRef.current.push(marker);
    });
  }, [nearbyListings, selectedListings]);

  const toggleListingSelection = (listingId: number) => {
    const newSelected = new Set(selectedListings);
    if (newSelected.has(listingId)) {
      newSelected.delete(listingId);
    } else {
      newSelected.add(listingId);
    }
    setSelectedListings(newSelected);
  };

  const handleOptimizeRoute = async () => {
    if (selectedListings.size === 0) {
      toast.error("Please select at least one sale");
      return;
    }

    const selectedListingObjects = nearbyListings?.filter((l) =>
      selectedListings.has(l.id)
    ) || [];

    try {
      const result = await optimizeRouteMutation.mutateAsync({
        listings: selectedListingObjects.map((l) => ({
          id: l.id,
          latitude: parseFloat(l.latitude as any),
          longitude: parseFloat(l.longitude as any),
          title: l.title,
        })),
        startPoint: userLocation!,
      });

      setOptimizedRoute(result);
      toast.success("Route optimized!");

      // Draw route on map
      if (mapRef.current && result.waypoints.length > 0) {
        const directionsService = new google.maps.DirectionsService();
        const waypoints = result.waypoints.slice(1, -1).map((point: any) => ({
          location: new google.maps.LatLng(point.lat, point.lng),
          stopover: true,
        }));

        const firstPoint = result.waypoints[0] as any;
        const lastPoint = result.waypoints[result.waypoints.length - 1] as any;

        directionsService.route(
          {
            origin: new google.maps.LatLng(firstPoint.lat, firstPoint.lng),
            destination: new google.maps.LatLng(lastPoint.lat, lastPoint.lng),
            waypoints: waypoints,
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && directionsRendererRef.current) {
              directionsRendererRef.current.setDirections(result);
            }
          }
        );
      }
    } catch (error) {
      toast.error("Failed to optimize route");
    }
  };

  const handleSaveRoute = async () => {
    if (!optimizedRoute) {
      toast.error("No route to save");
      return;
    }

    try {
      await saveRouteMutation.mutateAsync({
        name: `Route - ${new Date().toLocaleDateString()}`,
        listingIds: optimizedRoute.listings.map((l) => l.id),
        optimizedOrder: optimizedRoute.listings.map((l) => l.id),
        totalDistance: optimizedRoute.totalDistance,
        estimatedTime: optimizedRoute.estimatedTime,
      });

      toast.success("Route saved!");
    } catch (error) {
      toast.error("Failed to save route");
    }
  };

  const handleShareRoute = (platform: "link" | "facebook" | "twitter") => {
    if (!optimizedRoute) {
      toast.error("No route to share");
      return;
    }

    const routeText = `Check out my optimized garage sale route! ${optimizedRoute.listings.length} stops, ${optimizedRoute.totalDistance.toFixed(1)} miles, ~${Math.round(optimizedRoute.estimatedTime)} minutes.`;
    const shareUrl = `${window.location.origin}/shared-route/${optimizedRoute.listings.map((l) => l.id).join(",")}`;

    if (platform === "link") {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    } else if (platform === "facebook") {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(routeText)}`,
        "_blank"
      );
    } else if (platform === "twitter") {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(routeText)}&url=${encodeURIComponent(shareUrl)}`,
        "_blank"
      );
    }

    setShowShareMenu(false);
  };

  const handleCategoryToggle = (category: SaleCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate("/");
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-96 bg-white shadow-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-800">🗺️ TreasureHunt</h1>
          <p className="text-sm text-gray-600 mt-1">Route Explorer</p>
        </div>

        {/* User Info */}
        <div className="p-6 border-b bg-blue-50">
          <p className="text-sm font-medium text-gray-700">Welcome back!</p>
          <p className="text-lg font-semibold text-gray-900">{user.name || user.email}</p>
          {trialDaysLeft > 0 && (
            <div className="mt-3 flex items-center gap-2 text-sm text-blue-700 bg-blue-100 px-3 py-2 rounded">
              <Clock className="w-4 h-4" />
              <span>{trialDaysLeft} days left in trial</span>
            </div>
          )}
        </div>

        {/* Location Button */}
        <div className="p-6 border-b">
          {!userLocation ? (
            <Button
              onClick={requestLocation}
              disabled={locationLoading}
              className="w-full"
              size="lg"
            >
              {locationLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Getting Location...
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4 mr-2" />
                  Use My Location
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{nearbyListings?.length || 0}</p>
                <p className="text-sm text-gray-600">Sales within {radius} miles</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRadius(Math.max(1, radius - 1))}
                >
                  -
                </Button>
                <input
                  type="range"
                  min="1"
                  max="25"
                  value={radius}
                  onChange={(e) => setRadius(parseInt(e.target.value))}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRadius(Math.min(25, radius + 1))}
                >
                  +
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="p-6 border-b flex-1 overflow-y-auto">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full mb-4"
          >
            <Filter className="w-4 h-4 mr-2" />
            {showFilters ? "Hide" : "Show"} Filters
          </Button>

          {showFilters && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">Sale Types & Stores</h3>
              <div className="space-y-2">
                {(Object.entries(CATEGORY_LABELS) as [SaleCategory, string][]).map(
                  ([category, label]) => (
                    <button
                      key={category}
                      onClick={() => handleCategoryToggle(category)}
                      className={`w-full p-2 rounded text-sm font-medium transition text-left ${
                        selectedCategories.includes(category)
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {label}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Selected Listings */}
          {selectedListings.size > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold text-gray-800 mb-3">
                Selected ({selectedListings.size})
              </h3>
              <Button
                onClick={handleOptimizeRoute}
                disabled={optimizeRouteMutation.isPending}
                className="w-full mb-3 bg-green-600 hover:bg-green-700"
              >
                <Route className="w-4 h-4 mr-2" />
                {optimizeRouteMutation.isPending ? "Optimizing..." : "Optimize Route"}
              </Button>
            </div>
          )}

          {/* Route Results */}
          {optimizedRoute && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold text-gray-800 mb-3">Route Summary</h3>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Distance:</span>
                  <span className="font-semibold">{optimizedRoute.totalDistance.toFixed(1)} mi</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Est. Time:</span>
                  <span className="font-semibold">
                    {Math.round(optimizedRoute.estimatedTime)} min
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Stops:</span>
                  <span className="font-semibold">{optimizedRoute.listings.length}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handleSaveRoute}
                  disabled={saveRouteMutation.isPending}
                  className="w-full"
                  variant="outline"
                >
                  <Bookmark className="w-4 h-4 mr-2" />
                  {saveRouteMutation.isPending ? "Saving..." : "Save Route"}
                </Button>

                <div className="relative">
                  <Button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="w-full"
                    variant="outline"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Route
                  </Button>

                  {showShareMenu && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg z-10">
                      <button
                        onClick={() => handleShareRoute("link")}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Copy Link
                      </button>
                      <button
                        onClick={() => handleShareRoute("facebook")}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Facebook className="w-4 h-4" />
                        Share on Facebook
                      </button>
                      <button
                        onClick={() => handleShareRoute("twitter")}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Twitter className="w-4 h-4" />
                        Share on Twitter
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Saved Routes */}
          {savedRoutes.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <Button
                onClick={() => setShowSavedRoutes(!showSavedRoutes)}
                variant="outline"
                className="w-full"
              >
                <Bookmark className="w-4 h-4 mr-2" />
                Saved Routes ({savedRoutes.length})
              </Button>

              {showSavedRoutes && (
                <div className="mt-3 space-y-2">
                  {savedRoutes.map((route) => (
                    <div key={route.id} className="p-3 bg-gray-100 rounded">
                      <p className="font-semibold text-sm">{route.name}</p>
                      <p className="text-xs text-gray-600">
                        {route.totalDistance.toFixed(1)} mi • {route.estimatedTime} min
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Logout */}
        <div className="p-6 border-t">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full text-red-600 hover:text-red-700"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapView
          initialCenter={{ lat: 37.7749, lng: -122.4194 }}
          initialZoom={12}
          className="w-full h-full"
          onMapReady={(map) => {
            mapRef.current = map;
            directionsRendererRef.current = new google.maps.DirectionsRenderer({
              map: map,
              polylineOptions: {
                strokeColor: "#3b82f6",
                strokeWeight: 4,
              },
            });
          }}
        />

        {/* Loading Indicator */}
        {listingsLoading && (
          <div className="absolute top-4 right-4 bg-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm text-gray-600">Finding sales...</span>
          </div>
        )}

        {/* Instructions */}
        {!optimizedRoute && selectedListings.size === 0 && (
          <div className="absolute bottom-4 left-4 bg-white px-4 py-3 rounded-lg shadow-lg max-w-xs">
            <p className="text-sm text-gray-700">
              💡 <strong>Click on markers</strong> to select sales, then tap{" "}
              <strong>Optimize Route</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
