import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import {
  Loader2,
  MapPin,
  Clock,
  Navigation,
  ChevronRight,
  Volume2,
  Pause,
  Play,
  X,
} from "lucide-react";

interface NavigationStep {
  instruction: string;
  distance: number;
  duration: number;
  startLocation: { lat: number; lng: number };
  endLocation: { lat: number; lng: number };
  polyline: string;
  maneuver?: string;
}

interface NavigationRoute {
  summary: string;
  distance: number;
  duration: number;
  steps: NavigationStep[];
  polyline: string;
  startAddress: string;
  endAddress: string;
  warnings: string[];
}

interface TurnByTurnNavProps {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  waypoints?: Array<{ lat: number; lng: number }>;
  onClose?: () => void;
}

export function TurnByTurnNav({
  origin,
  destination,
  waypoints = [],
  onClose,
}: TurnByTurnNavProps) {
  const { t, language } = useLanguage();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [routes, setRoutes] = useState<NavigationRoute[]>([]);
  const [loading, setLoading] = useState(false);

  // Get directions query
  const { data: directionsData, isLoading: isLoadingDirections } = trpc.navigation.getDirections.useQuery(
    {
      origin,
      destination,
      waypoints,
      language,
    }
  );

  // Initialize navigation
  useEffect(() => {
    setLoading(isLoadingDirections);
  }, [isLoadingDirections]);

  // Handle loading state
  useEffect(() => {
    if (!isLoadingDirections) {
      setLoading(false);
    }
  }, [isLoadingDirections]);

  // Handle directions data
  useEffect(() => {
    if (directionsData?.routes) {
      setRoutes(directionsData.routes);
    }
  }, [directionsData]);

  // Text-to-speech for current instruction

  const speakInstruction = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === "es" ? "es-ES" : "en-US";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleNextStep = () => {
    if (currentStepIndex < (routes[0]?.steps.length || 0) - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);

      if (voiceEnabled && routes[0]) {
        speakInstruction(routes[0].steps[nextIndex].instruction);
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const toggleVoiceGuidance = () => {
    setVoiceEnabled(!voiceEnabled);
    if (!voiceEnabled && routes[0]) {
      speakInstruction(routes[0].steps[currentStepIndex].instruction);
    } else {
      window.speechSynthesis.cancel();
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>{t("routes.generating")}</span>
        </div>
      </Card>
    );
  }

  if (!routes || routes.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-gray-600">{t("routes.noRoutesFound")}</p>
      </Card>
    );
  }

  const currentRoute = routes[0];
  const currentStep = currentRoute.steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / currentRoute.steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50">
      <Card className="w-full rounded-t-2xl rounded-b-none shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-blue-600" />
            <span className="font-semibold">{t("navigation.turnByTurn")}</span>
          </div>
          {onClose && (
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Main Navigation Display */}
        <div className="p-6 space-y-4 bg-gradient-to-b from-blue-50 to-white">
          {/* Current Instruction */}
          <div className="space-y-2">
            <p className="text-sm text-gray-600">{t("navigation.nextInstruction")}</p>
            <p className="text-2xl font-bold text-gray-900">{currentStep.instruction}</p>
          </div>

          {/* Distance and Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 bg-white p-3 rounded-lg border">
              <MapPin className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-xs text-gray-600">{t("navigation.distance")}</p>
                <p className="font-semibold">
                  {(currentStep.distance / 1000).toFixed(1)} km
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white p-3 rounded-lg border">
              <Clock className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-xs text-gray-600">{t("navigation.time")}</p>
                <p className="font-semibold">
                  {Math.round(currentStep.duration / 60)} min
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {t("navigation.step")} {currentStepIndex + 1} of {currentRoute.steps.length}
              </span>
              <span className="text-gray-600">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Route Summary */}
          <div className="bg-white p-3 rounded-lg border space-y-1">
            <p className="text-sm text-gray-600">{t("navigation.totalRoute")}</p>
            <p className="font-semibold">
              {(currentRoute.distance / 1000).toFixed(1)} km • ~{Math.round(currentRoute.duration / 60)} min
            </p>
          </div>

          {/* Warnings */}
          {currentRoute.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                ⚠️ {currentRoute.warnings.join(", ")}
              </p>
            </div>
          )}
        </div>

        {/* Next Steps Preview */}
        <div className="px-6 py-4 bg-gray-50 border-t">
          <p className="text-xs font-semibold text-gray-600 mb-3">{t("navigation.upcomingSteps")}</p>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {currentRoute.steps
              .slice(currentStepIndex + 1, currentStepIndex + 3)
              .map((step, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <ChevronRight className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{step.instruction}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2 p-4 border-t bg-white">
          <Button
            size="sm"
            variant="outline"
            onClick={handlePreviousStep}
            disabled={currentStepIndex === 0}
            className="flex-1"
          >
            {t("navigation.previous")}
          </Button>

          <Button
            size="sm"
            variant={voiceEnabled ? "default" : "outline"}
            onClick={toggleVoiceGuidance}
            className="flex-1 gap-2"
          >
            <Volume2 className="w-4 h-4" />
            {voiceEnabled ? t("navigation.voiceOn") : t("navigation.voiceOff")}
          </Button>

          <Button
            size="sm"
            onClick={handleNextStep}
            disabled={currentStepIndex === currentRoute.steps.length - 1}
            className="flex-1"
          >
            {t("navigation.next")}
          </Button>
        </div>

        {/* Navigation Status */}
        {isNavigating && (
          <div className="px-4 py-2 bg-green-50 border-t text-center text-sm text-green-700">
            ✓ {t("navigation.navigating")}
          </div>
        )}
      </Card>
    </div>
  );
}
