import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { getLoginUrl } from "@/const";

/**
 * All content in this page are only for example, replace with your own feature implementation
 * When building pages, remember your instructions in Frontend Workflow, Frontend Best Practices, Design Guide and Common Pitfalls
 */
export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  // If theme is switchable in App.tsx, we can implement theme toggling like this:
  // const { theme, toggleTheme } = useTheme();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin w-8 h-8" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <h1 className="text-4xl font-bold text-indigo-600">🗺️ TreasureHunt</h1>
          <p className="text-gray-600">Smart Sale Navigator</p>
        </div>
      </header>

      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {isAuthenticated ? (
            <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.name || 'User'}!</h2>
                <p className="text-gray-600">Ready to find some amazing deals?</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button className="w-full" size="lg">
                  View Sales Map
                </Button>
                <Button variant="outline" onClick={logout} className="w-full" size="lg">
                  Logout
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-3xl font-bold mb-4">Find the Best Sales Near You</h2>
                <p className="text-lg text-gray-600 mb-6">
                  Discover garage sales, yard sales, and estate sales in your area. Our smart algorithm helps you plan the perfect route to maximize your shopping.
                </p>
                <a href={getLoginUrl()}>
                  <Button className="w-full md:w-auto" size="lg">
                    Sign In to Get Started
                  </Button>
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-xl font-bold mb-2">📍 Smart Mapping</h3>
                  <p className="text-gray-600">See all nearby sales on an interactive map</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-xl font-bold mb-2">🔍 Auto-Scraping</h3>
                  <p className="text-gray-600">Automatically finds sales from Craigslist and Facebook</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-xl font-bold mb-2">🛣️ Route Optimization</h3>
                  <p className="text-gray-600">Plan the most efficient route to visit multiple sales</p>
                </div>
              </div>

              <div className="bg-indigo-600 text-white rounded-lg shadow-lg p-8">
                <h3 className="text-2xl font-bold mb-2">Pricing</h3>
                <p className="text-lg mb-4">7-day free trial, then $9.99/month</p>
                <p className="text-sm opacity-90">Cancel anytime. No credit card required for trial.</p>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-gray-800 text-white text-center py-6">
        <p>&copy; 2026 TreasureHunt. All rights reserved.</p>
      </footer>
    </div>
  );
}
