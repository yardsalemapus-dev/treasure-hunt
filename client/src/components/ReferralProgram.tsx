import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Share2 } from "lucide-react";

export function ReferralProgram() {
  const [copied, setCopied] = useState(false);

  const { data: stats, isLoading } = trpc.referrals.getReferralStats.useQuery();
  const generateCodeMutation = trpc.referrals.generateReferralCode.useMutation();
  const claimCreditsMutation = trpc.referrals.claimReferralCredits.useMutation();

  const handleGenerateCode = async () => {
    try {
      await generateCodeMutation.mutateAsync();
      alert("Referral code generated!");
    } catch (error) {
      alert("Failed to generate referral code");
    }
  };

  const handleCopyLink = () => {
    if (stats?.referralCode) {
      const url = `${window.location.origin}/signup?ref=${stats.referralCode}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClaimCredits = async () => {
    try {
      const result = await claimCreditsMutation.mutateAsync();
      if (result.claimedAmount) {
        alert(`Successfully claimed $${result.claimedAmount.toFixed(2)} in credits!`);
      }
    } catch (error) {
      alert("Failed to claim credits");
    }
  };

  const handleShareFacebook = () => {
    if (stats?.referralCode) {
      const url = `${window.location.origin}/signup?ref=${stats.referralCode}`;
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        "_blank"
      );
    }
  };

  const handleShareTwitter = () => {
    if (stats?.referralCode) {
      const url = `${window.location.origin}/signup?ref=${stats.referralCode}`;
      window.open(
        `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=Check%20out%20TreasureHunt%20-%20find%20garage%20sales%20near%20you!`,
        "_blank"
      );
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Referral Program</CardTitle>
          <CardDescription>Earn $5 in credits for each friend you refer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!stats?.referralCode ? (
            <Button onClick={handleGenerateCode} className="w-full">
              Generate Referral Code
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">Your Referral Code</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-white border rounded font-mono text-sm">
                    {stats.referralCode}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyLink}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                {copied && <p className="text-xs text-blue-600 mt-2">Link copied!</p>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShareFacebook}
                  className="w-full"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Facebook
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShareTwitter}
                  className="w-full"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Twitter
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Referral Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Referrals</span>
            <span className="font-semibold">{stats?.totalReferrals || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Completed Referrals</span>
            <span className="font-semibold">{stats?.completedReferrals || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Available Credits</span>
            <span className="font-semibold text-green-600">
              ${stats?.referralCredits.toFixed(2) || "0.00"}
            </span>
          </div>
          {stats && stats.completedReferrals > 0 && stats.referralCredits > 0 && (
            <Button
              onClick={handleClaimCredits}
              className="w-full mt-4"
              disabled={claimCreditsMutation.isPending}
            >
              {claimCreditsMutation.isPending ? "Claiming..." : "Claim Credits"}
            </Button>
          )}
        </CardContent>
      </Card>

      {stats?.referralHistory && stats.referralHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.referralHistory.map((referral) => (
                <div
                  key={referral.id}
                  className="flex justify-between items-center p-2 border-b last:border-b-0"
                >
                  <div>
                    <p className="text-sm font-medium">User #{referral.referredUserId}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(referral.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      +${referral.creditAmount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{referral.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
