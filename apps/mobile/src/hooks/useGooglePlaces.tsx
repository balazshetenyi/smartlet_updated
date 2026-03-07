import { useState, useCallback } from "react";
import { supabase } from "@kiado/shared";

export type PlacePrediction = {
  description: string;
  place_id: string;
};

export const useGooglePlaces = () => {
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPredictions = useCallback(async (input: string) => {
    if (!input.trim() || input.length < 2) {
      setPredictions([]);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("google-places", {
        body: { action: "autocomplete", input },
      });

      if (error) throw error;

      if (data.status === "OK") {
        setPredictions(data.predictions);
      } else {
        setPredictions([]);
      }
    } catch (error) {
      console.error("Places API Proxy Error:", error);
    }
  }, []);

  const getPlaceDetails = async (placeId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-places", {
        body: { action: "details", placeId },
      });

      if (error) throw error;

      if (data.status === "OK") {
        return {
          lat: data.result.geometry.location.lat,
          lng: data.result.geometry.location.lng,
          name: data.result.name,
        };
      }
    } catch (error) {
      console.error("Place Details Proxy Error:", error);
    } finally {
      setLoading(false);
    }
    return null;
  };

  return {
    predictions,
    fetchPredictions,
    getPlaceDetails,
    setPredictions,
    loading,
  };
};
