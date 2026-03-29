import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MapView } from "@/components/Map";
import { Loader2, MapPin, Filter } from "lucide-react";
import { trpc } from "@/lib/trpc";

type SaleCategory = "garage_sale" | "yard_sale" | "estate_sale" | "multi_family_sale" | "block_sale" | "free_stuff";

const CATEGORY_COLORS: Record<SaleCategory, string> = {
  garage_sale: "#ef4444",
  yard_sale: "#eab308",
  estate_sale: "#8b5cf6",
  multi_family_sale: "#06b6d4",
  block_sale: "#ec4899",
  free_stuff: "#10b981",
};

const CATEGORY_LABELS: Record<SaleCategory, string> = {
  garage_sale: "Garage Sale",
  yard_sale: "Yard Sale",
  estate_sale: "Estate Sale",
  multi_family_sale: "Multi-Family",
  block_sale: "Block Sale",
  free_stuff: "Free Stuff",
};

export default function Landing() {
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<SaleCategory[]>([
    "garage_sale",
    "yard_sale",
    "estate_sale",
  ]);
  const [filters, setFilters] = useState({
    bathrooms: false,
    refreshments: false,
  });
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  const [nearbyCount, setNearbyCount] = useState(0);
  const [radius] = useState(5);

  const createCheckoutMutation = trpc.stripe.createCheckoutSession.useMutation();

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

  const requestLocation = () => {
    setLocationLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
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
      (error) => {
        let errorMsg = "Unable to get your location";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Location permission denied. Please enable location access.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = "Location information is unavailable.";
        }
        setLocationError(errorMsg);
        setLocationLoading(false);
      }
    );
  };

  useEffect(() => {
    if (nearbyListings) {
      setNearbyCount(nearbyListings.length);
    }
  }, [nearbyListings]);

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

  const validateEmail = (emailStr: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(emailStr);
  };

  const handleStartTrial = () => {
    setShowEmailForm(true);
    setEmailError(null);
  };

  const handleCheckout = async () => {
    if (!email || !validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    if (!name.trim()) {
      setEmailError("Please enter your name");
      return;
    }

    setCheckoutLoading(true);
    setEmailError(null);
    try {
      const result = await createCheckoutMutation.mutateAsync({
        email,
        name,
        returnUrl: window.location.origin,
      });

      if (result.url) {
        // Redirect to dashboard after successful checkout
        window.location.href = result.url;
        // After Stripe redirects back, the user will be logged in and can access /dashboard
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setEmailError("Failed to start checkout. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Map Background */}
      <div className="absolute inset-0 z-0">
        <MapView
          initialCenter={{ lat: 37.7749, lng: -122.4194 }}
          initialZoom={12}
          className="w-full h-full"
          onMapReady={(map) => {
            mapRef.current = map;
          }}
        />
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40 z-10" />

      {/* Content Overlay */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-6">
          {/* Header */}
          <div className="text-center text-white space-y-2">
            <h1 className="text-5xl font-bold">🗺️ TreasureHunt</h1>
            <p className="text-xl opacity-90">Find Amazing Sales Near You</p>
          </div>

          {/* Location Request */}
          {!userLocation ? (
            <div className="bg-white/95 backdrop-blur rounded-lg shadow-lg p-8 space-y-4">
              <div className="flex items-center justify-center gap-2 text-lg font-semibold text-gray-800">
                <MapPin className="w-6 h-6 text-blue-600" />
                Enable Location Access
              </div>
              <p className="text-gray-600 text-center">
                We need your location to show sales near you
              </p>
              <Button
                onClick={requestLocation}
                disabled={locationLoading}
                className="w-full h-12 text-lg"
                size="lg"
              >
                {locationLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Getting Location...
                  </>
                ) : (
                  <>
                    <MapPin className="w-5 h-5 mr-2" />
                    Use My Location
                  </>
                )}
              </Button>
              {locationError && (
                <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">
                  {locationError}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Sales Count Display */}
              <div className="bg-white/95 backdrop-blur rounded-lg shadow-lg p-8 space-y-4">
                <div className="text-center space-y-2">
                  {listingsLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-gray-600">Finding sales...</span>
                    </div>
                  ) : (
                    <>
                      <div className="text-4xl font-bold text-blue-600">{nearbyCount}</div>
                      <p className="text-gray-600">
                        Sales within {radius} miles of your location
                      </p>
                    </>
                  )}
                </div>

                {/* Filter Button */}
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="w-full"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {showFilters ? "Hide" : "Show"} Filters
                </Button>

                {/* Filters Panel */}
                {showFilters && (
                  <div className="space-y-4 border-t pt-4">
                    {/* Categories */}
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3">Sale Types</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {(Object.entries(CATEGORY_LABELS) as [SaleCategory, string][]).map(
                          ([category, label]) => (
                            <button
                              key={category}
                              onClick={() => handleCategoryToggle(category)}
                              className={`p-2 rounded text-sm font-medium transition ${
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

                    {/* Amenities */}
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3">Amenities</h3>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.bathrooms}
                            onChange={(e) =>
                              setFilters((prev) => ({
                                ...prev,
                                bathrooms: e.target.checked,
                              }))
                            }
                            className="w-4 h-4"
                          />
                          <span className="text-gray-700">Show Bathrooms Nearby</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.refreshments}
                            onChange={(e) =>
                              setFilters((prev) => ({
                                ...prev,
                                refreshments: e.target.checked,
                              }))
                            }
                            className="w-4 h-4"
                          />
                          <span className="text-gray-700">Show Refreshments Nearby</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Email Form or CTA Button */}
                {!showEmailForm ? (
                  <>
                    <Button
                      onClick={handleStartTrial}
                      className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    >
                      Start 3-Day Free Trial
                    </Button>
                    <p className="text-center text-sm text-gray-600">
                      Then $7.99/month. Cancel anytime.
                    </p>
                  </>
                ) : (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-semibold text-gray-800">Complete Your Profile</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          setEmailError(null);
                        }}
                        placeholder="John Doe"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setEmailError(null);
                        }}
                        placeholder="john@example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    {emailError && (
                      <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">
                        {emailError}
                      </div>
                    )}
                    <Button
                      onClick={handleCheckout}
                      disabled={checkoutLoading}
                      className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    >
                      {checkoutLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        "Continue to Checkout"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowEmailForm(false);
                        setEmail("");
                        setName("");
                        setEmailError(null);
                      }}
                      className="w-full"
                    >
                      Back
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
