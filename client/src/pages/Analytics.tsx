import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Award, Star } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function Analytics() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Fetch trending listings
  const { data: trendingListings = [] } = trpc.analytics.getTrendingListings.useQuery({
    days: 30,
    limit: 10,
  });

  // Fetch best deals
  const { data: bestDeals = [] } = trpc.analytics.getBestDeals.useQuery({
    limit: 10,
  });

  // Fetch monthly report
  const { data: monthlyReport } = trpc.analytics.getMonthlyReport.useQuery({
    year: selectedYear,
    month: selectedMonth,
  });

  // Fetch category insights
  const { data: categoryInsights = [] } = trpc.analytics.getCategoryInsights.useQuery();

  // Prepare chart data
  const categoryChartData = categoryInsights.map((cat: any) => ({
    name: cat.category.replace(/_/g, " "),
    value: cat.count,
  }));

  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Insights</h1>
          <p className="text-gray-600 mt-1">Discover trends and popular sales in your area</p>
        </div>

        {/* Monthly Report */}
        {monthlyReport && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Monthly Report - {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Listings</p>
                  <p className="text-2xl font-bold text-blue-600">{monthlyReport.totalListings}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Reviews</p>
                  <p className="text-2xl font-bold text-green-600">{monthlyReport.totalReviews}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Average Rating</p>
                  <p className="text-2xl font-bold text-yellow-600">{monthlyReport.averageRating}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Top Category</p>
                  <p className="text-lg font-bold text-purple-600">
                    {Object.entries(monthlyReport.listingsByCategory).sort(
                      ([, a]: any, [, b]: any) => b - a
                    )[0]?.[0]?.replace(/_/g, " ") || "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Sales by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryChartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Rated Sales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                Best Rated Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bestDeals.slice(0, 5).map((deal: any, index: number) => (
                  <div key={deal.id} className="flex items-center justify-between pb-3 border-b last:border-b-0">
                    <div>
                      <p className="font-semibold text-gray-900">{deal.title}</p>
                      <p className="text-sm text-gray-600">{deal.category.replace(/_/g, " ")}</p>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.round(deal.averageRating || 0)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trending Listings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Trending Sales (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trendingListings.slice(0, 6).map((listing: any) => (
                <div key={listing.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                  <p className="font-semibold text-gray-900 truncate">{listing.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{listing.address}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {listing.category.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(listing.saleDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
