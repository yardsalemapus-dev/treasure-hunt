import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Heart, TrendingUp, Settings, LogOut } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";

export function UserDashboard() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch user's saved routes
  const { data: savedRoutes = [] } = trpc.routes.getSavedRoutes.useQuery(
    undefined,
    { enabled: !!user }
  );

  // Fetch user's subscription info
  const { data: subscription } = trpc.stripe.getSubscriptionStatus?.useQuery?.(
    undefined,
    { enabled: !!user }
  );

  // Mock user reviews for now
  const userReviews: any[] = [];

  const handleLogout = async () => {
    await logout();
  };

  const trialDaysRemaining = subscription?.trialEndDate
    ? Math.ceil(
        (new Date(subscription.trialEndDate).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t("userDashboard.title")}</h1>
            <p className="text-gray-600 mt-1">{t("home.welcome")}, {user?.name}!</p>
          </div>
          <div className="flex gap-2">
            <LanguageToggle />
            <Button onClick={handleLogout} variant="outline" className="gap-2">
              <LogOut className="w-4 h-4" />
              {t("common.logout")}
            </Button>
          </div>
        </div>

        {/* Subscription Status Card */}
        {subscription && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                {t("userDashboard.myProfile")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {subscription.status === "trial" ? t("common.loading") : t("common.success")}
                  </p>
                </div>
                {subscription.status === "trial" && (
                  <div>
                    <p className="text-sm text-gray-600">Days Remaining</p>
                    <p className="text-lg font-semibold text-blue-600">
                      {Math.max(0, trialDaysRemaining)} days
                    </p>
                  </div>
                )}
                {subscription.status === "active" && subscription.currentPeriodEnd && (
                  <div>
                    <p className="text-sm text-gray-600">Next Billing</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="routes">Saved Routes</TabsTrigger>
            <TabsTrigger value="reviews">My Reviews</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Routes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-gray-900">
                    {savedRoutes.length}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Reviews Left
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-gray-900">
                    {userReviews?.length || 0}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Account Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
              <p className="text-lg font-bold text-blue-600">
                {subscription?.status === "trial" ? "Trial" : subscription?.status === "active" ? "Premium" : "Inactive"}
              </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" variant="outline">
                  <MapPin className="w-4 h-4 mr-2" />
                  Explore New Sales
                </Button>
                <Button className="w-full" variant="outline">
                  <Heart className="w-4 h-4 mr-2" />
                  View Favorites
                </Button>
                <Button className="w-full" variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Account Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Saved Routes Tab */}
          <TabsContent value="routes" className="space-y-4">
            {savedRoutes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedRoutes.map((route: any) => (
                  <Card key={route.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{route.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-600">Stops</p>
                        <p className="font-semibold">{route.waypoints?.length || 0} sales</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Distance</p>
                        <p className="font-semibold">
                          {route.totalDistance?.toFixed(1) || 0} miles
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Created</p>
                        <p className="font-semibold">
                          {new Date(route.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button className="w-full mt-4">View Route</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No saved routes yet</p>
                  <Button className="mt-4">Create Your First Route</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-4">
            {userReviews && userReviews.length > 0 ? (
              <div className="space-y-4">
                {userReviews.map((review: any) => (
                  <Card key={review.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">
                            Sale #{review.listingId}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-lg ${
                                i < review.rating
                                  ? "text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-gray-700">{review.comment}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No reviews yet</p>
                  <Button className="mt-4">Leave Your First Review</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
