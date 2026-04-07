import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SMSNotifications() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { data: preferences, isLoading: isLoadingPrefs } = trpc.sms.getSMSPreferences.useQuery();
  const subscribeMutation = trpc.sms.subscribeSMS.useMutation();
  const unsubscribeMutation = trpc.sms.unsubscribeSMS.useMutation();

  const handleSubscribe = async () => {
    if (!phoneNumber.trim()) {
      alert("Please enter a valid phone number");
      return;
    }

    setIsLoading(true);
    try {
      await subscribeMutation.mutateAsync({ phoneNumber });
      alert("SMS notifications enabled! You'll receive alerts for new sales.");
      setPhoneNumber("");
    } catch (error) {
      alert("Failed to enable SMS notifications");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    try {
      await unsubscribeMutation.mutateAsync();
      alert("SMS notifications disabled");
    } catch (error) {
      alert("Failed to disable SMS notifications");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingPrefs) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>SMS Notifications</CardTitle>
        <CardDescription>Get alerts for new sales near you via text message</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {preferences?.smsEnabled ? (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm font-medium text-green-900">
                SMS notifications active
              </p>
              <p className="text-sm text-green-700 mt-1">
                Phone: {preferences.phoneNumber}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleUnsubscribe}
              disabled={isLoading}
            >
              Disable SMS Notifications
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number</label>
              <Input
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                We'll send you SMS alerts when new sales appear within 5 miles of your location
              </p>
            </div>
            <Button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Enabling..." : "Enable SMS Notifications"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
