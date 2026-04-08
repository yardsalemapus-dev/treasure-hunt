import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AdminDashboard() {
  const { data: user } = trpc.auth.me.useQuery();
  const [selectedScraper, setSelectedScraper] = useState<string>("craigslist");
  const [region, setRegion] = useState<string>("nyc");

  const { data: stats } = trpc.scrapers.getStats.useQuery();
  const { data: jobs } = trpc.scrapers.getJobs.useQuery({ source: selectedScraper as any, limit: 20 });
  const { data: logs } = trpc.scrapers.getLogs.useQuery({ source: selectedScraper as any, limit: 20 });
  const { data: config } = trpc.scrapers.getConfig.useQuery();

  const triggerMutation = trpc.scrapers.triggerScraper.useMutation();
  const updateConfigMutation = trpc.scrapers.updateConfig.useMutation();

  if (!user || user.role !== "admin") {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-semibold">Access Denied</p>
          <p className="text-red-700 text-sm">You must be an admin to access this page.</p>
        </div>
      </div>
    );
  }

  const handleTriggerScraper = async () => {
    try {
      await triggerMutation.mutateAsync({
        source: selectedScraper as any,
        region,
      });
      alert("Scraper triggered successfully!");
    } catch (error) {
      alert("Failed to trigger scraper");
    }
  };

  const handleToggleConfig = async (source: string, isEnabled: boolean) => {
    try {
      await updateConfigMutation.mutateAsync({
        source: source as any,
        isEnabled: !isEnabled,
      });
      alert("Configuration updated!");
    } catch (error) {
      alert("Failed to update configuration");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-600 mb-6">Manage scrapers and monitor system health</p>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.totalJobs}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{stats.completedJobs}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Failed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">{stats.failedJobs}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Listings Found</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.totalListingsFound}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scraper Control */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Trigger Scraper</CardTitle>
              <CardDescription>Manually run a scraper</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Source</label>
                <select
                  value={selectedScraper}
                  onChange={(e) => setSelectedScraper(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md"
                >
                  <option value="craigslist">Craigslist</option>
                  <option value="facebook">Facebook</option>
                  <option value="ebay">eBay</option>
                  <option value="nextdoor">Nextdoor</option>
                  <option value="estatesales">Estate Sales</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Region</label>
                <input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="e.g., nyc, sf, la"
                  className="w-full mt-1 p-2 border rounded-md"
                />
              </div>
              <Button
                onClick={handleTriggerScraper}
                disabled={triggerMutation.isPending}
                className="w-full"
              >
                {triggerMutation.isPending ? "Running..." : "Trigger Scraper"}
              </Button>
            </CardContent>
          </Card>

          {/* Recent Jobs */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Jobs</CardTitle>
              <CardDescription>{selectedScraper} scraper</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {jobs && jobs.length > 0 ? (
                  jobs.map((job: any) => (
                    <div key={job.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">Job #{job.id}</p>
                          <p className="text-sm text-gray-600">{job.region}</p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            job.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : job.status === "failed"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {job.status}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <p>Found: {job.listingsFound} | Added: {job.listingsAdded}</p>
                        <p className="text-xs mt-1">
                          {new Date(job.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No jobs found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scraper Configuration */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Scraper Configuration</CardTitle>
            <CardDescription>Manage scraper settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {config && config.length > 0 ? (
                config.map((cfg: any) => (
                  <div key={cfg.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium capitalize">{cfg.source}</p>
                      <p className="text-sm text-gray-600">
                        Frequency: {cfg.runFrequency} | Max: {cfg.maxListingsPerRun} listings
                      </p>
                    </div>
                    <Button
                      variant={cfg.isEnabled ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleToggleConfig(cfg.source, cfg.isEnabled)}
                    >
                      {cfg.isEnabled ? "Enabled" : "Disabled"}
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No configuration found</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Logs */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Scraper Logs</CardTitle>
            <CardDescription>Recent activity for {selectedScraper}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {logs && logs.length > 0 ? (
                logs.map((log: any) => (
                  <div key={log.id} className="p-2 border-b text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium capitalize">{log.status}</span>
                      <span className="text-gray-600">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-600">
                      Found: {log.listingsFound} | Added: {log.listingsAdded}
                    </p>
                    {log.errorMessage && (
                      <p className="text-red-600 text-xs mt-1">{log.errorMessage}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No logs found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
