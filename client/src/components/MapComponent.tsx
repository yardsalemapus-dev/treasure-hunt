import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Listing {
  id: number;
  title: string;
  address: string;
  latitude: string;
  longitude: string;
  category: string;
  source: string;
  sourceUrl?: string;
}

interface MapComponentProps {
  listings: Listing[];
  userLocation?: { lat: number; lng: number };
  selectedCategories?: string[];
  onListingClick?: (listing: Listing) => void;
}

// Custom icons for different sale types
const getIconForCategory = (category: string) => {
  const colors: Record<string, string> = {
    garage_sale: "#3b82f6", // blue
    yard_sale: "#10b981", // green
    estate_sale: "#f59e0b", // amber
    multi_family_sale: "#8b5cf6", // purple
    block_sale: "#ec4899", // pink
    free_stuff: "#06b6d4", // cyan
  };

  const color = colors[category] || "#6b7280";

  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">📍</div>`,
    className: "custom-marker",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    garage_sale: "Garage Sale",
    yard_sale: "Yard Sale",
    estate_sale: "Estate Sale",
    multi_family_sale: "Multi-Family Sale",
    block_sale: "Block Sale",
    free_stuff: "Free Stuff",
  };
  return labels[category] || category;
};

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    garage_sale: "bg-blue-100 text-blue-800",
    yard_sale: "bg-green-100 text-green-800",
    estate_sale: "bg-amber-100 text-amber-800",
    multi_family_sale: "bg-purple-100 text-purple-800",
    block_sale: "bg-pink-100 text-pink-800",
    free_stuff: "bg-cyan-100 text-cyan-800",
  };
  return colors[category] || "bg-gray-100 text-gray-800";
};

export const MapComponent: React.FC<MapComponentProps> = ({
  listings,
  userLocation,
  selectedCategories = [],
  onListingClick,
}) => {
  const [filteredListings, setFilteredListings] = useState<Listing[]>(listings);

  useEffect(() => {
    if (selectedCategories.length === 0) {
      setFilteredListings(listings);
    } else {
      setFilteredListings(
        listings.filter((listing) => selectedCategories.includes(listing.category))
      );
    }
  }, [listings, selectedCategories]);

  // Default center (San Francisco)
  const defaultCenter: [number, number] = [37.7749, -122.4194];
  const centerLat = userLocation ? userLocation.lat : defaultCenter[0];
  const centerLng = userLocation ? userLocation.lng : defaultCenter[1];

  return (
    <div className="w-full h-full flex flex-col">
      <MapContainer
        center={[centerLat, centerLng] as [number, number]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        className="rounded-lg"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution={"&copy; OpenStreetMap contributors" as any}
        />

        {/* User location marker */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]}>
            <Popup>
              <div className="text-sm font-semibold">Your Location</div>
            </Popup>
          </Marker>
        )}

        {/* Listing markers */}
        {filteredListings.map((listing) => (
          <Marker
            key={listing.id}
            position={[
              parseFloat(listing.latitude),
              parseFloat(listing.longitude),
            ] as [number, number]}
            icon={getIconForCategory(listing.category) as any}
            eventHandlers={{
              click: () => onListingClick?.(listing),
            }}
          >
            <Popup>
              <Card className="w-64 p-3">
                <div className="space-y-2">
                  <h3 className="font-bold text-sm line-clamp-2">
                    {listing.title}
                  </h3>
                  <p className="text-xs text-gray-600">{listing.address}</p>
                  <div className="flex gap-2 flex-wrap">
                    <Badge className={getCategoryColor(listing.category)}>
                      {getCategoryLabel(listing.category)}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {listing.source}
                    </Badge>
                  </div>
                  {listing.sourceUrl && (
                    <a
                      href={listing.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      View on {listing.source}
                    </a>
                  )}
                </div>
              </Card>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Summary */}
      <div className="bg-white border-t p-3 text-sm text-gray-600">
        Showing {filteredListings.length} of {listings.length} sales
      </div>
    </div>
  );
};

export default MapComponent;
