import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Clock, ExternalLink, Share2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ListingDetailsModalProps {
  listing: any;
  isOpen: boolean;
  onClose: () => void;
}

export function ListingDetailsModal({ listing, isOpen, onClose }: ListingDetailsModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Fetch reviews for this listing
  const { data: reviews = [] } = trpc.reviews.getByListing.useQuery(
    { listingId: listing?.id },
    { enabled: !!listing?.id }
  );

  // Submit review mutation
  const submitReview = trpc.reviews.create.useMutation({
    onSuccess: () => {
      setRating(0);
      setComment("");
      setIsSubmittingReview(false);
      toast.success("Review submitted!");
    },
    onError: () => {
      toast.error("Failed to submit review");
      setIsSubmittingReview(false);
    },
  });

  const handleSubmitReview = async () => {
    if (!rating) {
      toast.error("Please select a rating");
      return;
    }
    setIsSubmittingReview(true);
    await submitReview.mutateAsync({
      listingId: listing.id,
      rating,
      comment: comment || undefined,
    });
  };

  const handleGetDirections = () => {
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${listing.latitude},${listing.longitude}`;
    window.open(mapsUrl, "_blank");
  };

  const handleShare = () => {
    const text = `Check out this ${listing.category.replace(/_/g, " ")} sale: ${listing.title} at ${listing.address}`;
    if (navigator.share) {
      navigator.share({
        title: listing.title,
        text: text,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(`${text} - ${window.location.href}`);
      toast.success("Link copied to clipboard!");
    }
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{listing?.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Listing Image */}
          {listing?.imageUrl && (
            <img
              src={listing.imageUrl}
              alt={listing.title}
              className="w-full h-64 object-cover rounded-lg"
            />
          )}

          {/* Basic Info */}
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <MapPin className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold">Address</p>
                <p className="text-gray-600">{listing?.address}</p>
              </div>
            </div>

            {listing?.saleDate && (
              <div className="flex items-start gap-2">
                <Clock className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Sale Date & Time</p>
                  <p className="text-gray-600">
                    {new Date(listing.saleDate).toLocaleDateString()} {listing.startTime && `• ${listing.startTime}`}
                    {listing.endTime && ` - ${listing.endTime}`}
                  </p>
                </div>
              </div>
            )}

            {listing?.description && (
              <div>
                <p className="font-semibold mb-2">Description</p>
                <p className="text-gray-600">{listing.description}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={handleGetDirections} className="flex-1 gap-2">
              <MapPin className="w-4 h-4" />
              Get Directions
            </Button>
            <Button onClick={handleShare} variant="outline" className="flex-1 gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
            {listing?.sourceUrl && (
              <Button
                onClick={() => window.open(listing.sourceUrl, "_blank")}
                variant="outline"
                className="flex-1 gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                View Original
              </Button>
            )}
          </div>

          {/* Reviews Section */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Reviews & Ratings</h3>
              {reviews.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.round(parseFloat(averageRating as string))
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {averageRating} ({reviews.length} reviews)
                  </span>
                </div>
              )}
            </div>

            {/* Existing Reviews */}
            <div className="space-y-3 mb-6 max-h-48 overflow-y-auto">
              {reviews.map((review: any) => (
                <div key={review.id} className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && <p className="text-sm text-gray-700">{review.comment}</p>}
                </div>
              ))}
            </div>

            {/* Submit Review Form */}
            <div className="border-t pt-4">
              <p className="font-semibold mb-3">Leave a Review</p>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Rating</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Comment (optional)</p>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience at this sale..."
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleSubmitReview}
                  disabled={isSubmittingReview || !rating}
                  className="w-full"
                >
                  {isSubmittingReview ? "Submitting..." : "Submit Review"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
