import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2, MapPin, Clock, Navigation, Share2, Save } from "lucide-react";
import { toast } from "sonner";

interface RouteOptimizerProps {
  latitude: number;
  longitude: number;
  radiusMiles?: number;
  clusterRadiusMiles?: number;
}

export function RouteOptimizer({
  latitude,
  longitude,
  radiusMiles = 10,
  clusterRadiusMiles = 2,
}: RouteOptimizerProps) {
  const { t } = useLanguage();
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number | null>(null);

  // Generate routes
  const { data: routeData, isLoading, refetch } = trpc.routes.generateRoutes.useQuery({
    latitude,
    longitude,
    radiusMiles,
    clusterRadiusMiles,
  });

  // Save route mutation
  const saveRouteMutation = trpc.routes.saveRoute.useMutation({
    onSuccess: () => {
      toast.success(t("routes.saved"));
    },
    onError: () => {
      toast.error(t("routes.saveFailed"));
    },
  });

  const handleSaveRoute = async (routeIndex: number) => {
    if (!routeData?.routes || !routeData.routes[routeIndex]) return;

    const route = routeData.routes[routeIndex];
    try {
      await saveRouteMutation.mutateAsync({
        name: `Route ${routeIndex + 1} - ${new Date().toLocaleDateString()}`,
        description: `${route.listingIds.length} stops, ${route.totalDistance.toFixed(1)} miles`,
        listingIds: route.listingIds,
        optimizedOrder: route.optimizedOrder,
        totalDistance: route.totalDistance,
        estimatedTime: route.estimatedTime,
      });
    } catch (error) {
      console.error("Failed to save route:", error);
    }
  };

  const handleShareRoute = (routeIndex: number) => {
    if (!routeData?.routes || !routeData.routes[routeIndex]) return;

    const route = routeData.routes[routeIndex];
    const shareText = `Check out this optimized garage sale route: ${route.listingIds.length} stops, ${route.totalDistance.toFixed(1)} miles, ~${route.estimatedTime} minutes!`;

    if (navigator.share) {
      navigator.share({
        title: "Optimized Garage Sale Route",
        text: shareText,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText);
      toast.success(t("routes.copiedToClipboard"));
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>{t("routes.generating")}</span>
        </div>
      </Card>
    );
  }

  if (!routeData || routeData.routes.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-gray-600">{t("routes.noRoutesFound")}</p>
        <Button onClick={() => refetch()} className="w-full mt-4">
          {t("routes.tryAgain")}
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">{t("routes.routesFound")}</p>
            <p className="text-2xl font-bold text-blue-600">{routeData.routesCount}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">{t("routes.totalListings")}</p>
            <p className="text-2xl font-bold text-indigo-600">{routeData.listingsCount}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">{t("routes.searchRadius")}</p>
            <p className="text-2xl font-bold text-purple-600">{radiusMiles} mi</p>
          </div>
        </div>
      </Card>

      {/* Routes List */}
      <div className="space-y-3">
        {routeData.routes.map((route: any, index: number) => (
          <Card
            key={index}
            className={`p-4 cursor-pointer transition-all ${
              selectedRouteIndex === index
                ? "ring-2 ring-blue-500 bg-blue-50"
                : "hover:shadow-md"
            }`}
            onClick={() => setSelectedRouteIndex(selectedRouteIndex === index ? null : index)}
          >
            <div className="space-y-3">
              {/* Route Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-600">{t("routes.route")} {index + 1}</Badge>
                  <span className="font-semibold text-gray-900">
                    {route.listingIds.length} {t("routes.stops")}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{t("routes.cluster")} {route.clusterIndex + 1}</p>
                </div>
              </div>

              {/* Route Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Navigation className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-600">{t("routes.distance")}</p>
                    <p className="font-semibold">{route.totalDistance.toFixed(1)} mi</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-600">{t("routes.time")}</p>
                    <p className="font-semibold">~{route.estimatedTime} min</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-red-600" />
                  <div>
                    <p className="text-xs text-gray-600">{t("routes.center")}</p>
                    <p className="font-semibold text-xs">
                      {route.centerPoint.lat.toFixed(2)}, {route.centerPoint.lng.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedRouteIndex === index && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-2">
                      {t("routes.stopSequence")}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {route.optimizedOrder.map((id: number, idx: number) => (
                        <Badge key={idx} variant="outline">
                          {idx + 1}. ID: {id}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => handleSaveRoute(index)}
                      disabled={saveRouteMutation.isPending}
                      className="flex-1 gap-2"
                    >
                      {saveRouteMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t("routes.saving")}
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          {t("routes.save")}
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleShareRoute(index)}
                      className="flex-1 gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      {t("routes.share")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Refresh Button */}
      <Button
        onClick={() => refetch()}
        variant="outline"
        className="w-full"
      >
        {t("routes.refreshRoutes")}
      </Button>
    </div>
  );
}
