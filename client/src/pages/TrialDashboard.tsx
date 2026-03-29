import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MapView } from "@/components/Map";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Loader2, MapPin, Filter, LogOut, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";

type SaleCategory = "garage_sale" | "yard_sale" | "estate_sale" | "multi_family_sale" | "block_sale" | "free_stuff";

const CATEGORY_LABELS: Record<SaleCategory, string> = {
  garage_sale: "Garage Sale",
  yard_sale: "Yard Sale",
  estate_sale: "Estate Sale",
  multi_family_sale: "Multi-Family",
  block_sale: "Block Sale",
  free_stuff: "Free Stuff",
};

export default function TrialDashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

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

  const logoutMutation = trpc.auth.logout.useMutation();

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Calculate trial days left
  useEffect(() => {
    if (subscriptionStatus?.trialEndDate) {
      const now = new Date();
      const trialEnd = new Date(subscriptionStatus.trialEndDate);
      const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      setTrialDaysLeft(Math.max(0, daysLeft));
    }
  }, [subscriptionStatus]);

  const requestLocation = () => {
    setLocationLoading(true);

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
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
        alert("Unable to get your location");
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
      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapRef.current,
        position: {
          lat: parseFloat(listing.latitude as any),
          lng: parseFloat(listing.longitude as any),
        },
        title: listing.title,
      });

      marker.addListener("click", () => {
        const infoWindow = new google.maps.InfoWindow({
          content: `<div class="p-2"><strong>${listing.title}</strong><br/>${listing.address}</div>`,
        });
        infoWindow.open(mapRef.current, marker);
      });

      markersRef.current.push(marker);
    });
  }, [nearbyListings]);

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
      <div className="w-80 bg-white shadow-lg flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-800">🗺️ TreasureHunt</h1>
          <p className="text-sm text-gray-600 mt-1">Premium Explorer</p>
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
          {subscriptionStatus?.isActive && subscriptionStatus?.status === "active" && (
            <div className="mt-3 text-sm text-green-700 bg-green-100 px-3 py-2 rounded font-medium">
              ✓ Premium Active
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
              <h3 className="font-semibold text-gray-800">Sale Types</h3>
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
          }}
        />

        {/* Loading Indicator */}
        {listingsLoading && (
          <div className="absolute top-4 right-4 bg-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm text-gray-600">Finding sales...</span>
          </div>
        )}
      </div>
    </div>
  );
}
