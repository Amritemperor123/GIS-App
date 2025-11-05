// components/MapView.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import MapView, { Marker, Polygon, Polyline, Region, Callout } from "react-native-maps";
import { View, Dimensions, TouchableOpacity, Text, Switch, Alert, Image } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Crosshair } from 'lucide-react-native';

import * as Location from 'expo-location';
import { useAuth } from "../contexts/AuthContext";
import { useJobs, Job } from "../contexts/JobsContext";
import { useColorScheme } from "../hooks/use-color-scheme";
// Import local GeoJSON
import dataLayer from "../assets/layers/data.geojson";

type MapProps = { mapDarkMode?: boolean };

export default function CustomMap({ mapDarkMode }: MapProps) {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const mapRef = useRef<MapView | null>(null);
  const insets = useSafeAreaInsets();
  const DEFAULT_LOCATION = { latitude: 25.3176, longitude: 82.9739 }; // Varanasi
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<Location.LocationPermissionResponse | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // UI toggles similar to web layer control
  const [showDataLayer, setShowDataLayer] = useState(true);
  const [layersOpen, setLayersOpen] = useState(true);

  // Request location permission and get current location
  useEffect(() => {
    getLocationPermission();
  }, []);

  const getLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission({ status } as Location.LocationPermissionResponse);
      
      if (status !== 'granted') {
        // Fallback to Varanasi when permission is denied
        setUserLocation(DEFAULT_LOCATION);
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: DEFAULT_LOCATION.latitude,
            longitude: DEFAULT_LOCATION.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }, 1000);
        }
        Alert.alert('Permission Denied', 'Showing default location (Varanasi).');
        return;
      }

      // Get current location after permission is granted
      await getCurrentLocation();
    } catch (error) {
      console.error('Error requesting location permission:', error);
      // Fallback to Varanasi on error
      setUserLocation(DEFAULT_LOCATION);
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: DEFAULT_LOCATION.latitude,
          longitude: DEFAULT_LOCATION.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }, 1000);
      }
      Alert.alert('Error', 'Failed to request location. Showing Varanasi.');
    }
  };

  const getCurrentLocation = async () => {
    try {
      setIsLoadingLocation(true);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        distanceInterval: 10,
      });
      
      const loc = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setUserLocation(loc);
      
      // Center map on user location when first obtained
      if (mapRef.current) {
        const region: Region = {
          latitude: loc.latitude,
          longitude: loc.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        mapRef.current.animateToRegion(region, 1000);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      // Fallback to Varanasi if GPS fails
      setUserLocation(DEFAULT_LOCATION);
      if (mapRef.current) {
        const region: Region = {
          latitude: DEFAULT_LOCATION.latitude,
          longitude: DEFAULT_LOCATION.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        mapRef.current.animateToRegion(region, 1000);
      }
      Alert.alert('Info', 'Using default location (Varanasi).');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleLocate = async () => {
    if (!mapRef.current) return;
    
    // If we don't have location or permission, request it
    if (!userLocation || !locationPermission || locationPermission.status !== 'granted') {
      await getLocationPermission();
      return;
    }

    // If we have location, animate to it
    if (userLocation) {
      const region: Region = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      mapRef.current.animateToRegion(region, 800);
    } else {
      // Get fresh location
      await getCurrentLocation();
    }
  };

  const toLatLng = (coord: any) => ({ latitude: coord[1], longitude: coord[0] });

  const dataPolygons = useMemo(() => {
    const features = (dataLayer as any).features ?? [];
    const nodes: { coords: { latitude: number; longitude: number }[]; key: string }[] = [];
    features.forEach((feature: any, idx: number) => {
      const geom = feature.geometry;
      if (!geom) return;
      if (geom.type === "Polygon") {
        const outer = (geom.coordinates?.[0] ?? []).map(toLatLng);
        if (outer.length) nodes.push({ coords: outer, key: `poly-${idx}` });
      } else if (geom.type === "MultiPolygon") {
        (geom.coordinates ?? []).forEach((poly: any[], pIdx: number) => {
          const outer = (poly?.[0] ?? []).map(toLatLng);
          if (outer.length) nodes.push({ coords: outer, key: `mpoly-${idx}-${pIdx}` });
        });
      }
    });
    return nodes;
  }, []);

  const buildLinesFrom = (collection: any) => {
    const features = (collection as any).features ?? [];
    const lines: { coords: { latitude: number; longitude: number }[]; key: string }[] = [];
    features.forEach((feature: any, idx: number) => {
      const geom = feature.geometry;
      if (!geom) return;
      if (geom.type === "LineString") {
        const coords = (geom.coordinates ?? []).map(toLatLng);
        if (coords.length) lines.push({ coords, key: `ls-${idx}` });
      } else if (geom.type === "MultiLineString") {
        (geom.coordinates ?? []).forEach((line: any[], lIdx: number) => {
          const coords = (line ?? []).map(toLatLng);
          if (coords.length) lines.push({ coords, key: `mls-${idx}-${lIdx}` });
        });
      }
    });
    return lines;
  };

  const isServiceProvider = user?.type === 'service_provider';
  const { jobs } = useJobs();

  const toCoordinate = (loc: any): { latitude: number; longitude: number } => {
    if (!loc) return DEFAULT_LOCATION;
    if (typeof loc === 'string') {
      try {
        const parsed = JSON.parse(loc);
        if (parsed && typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
          return { latitude: parsed.latitude, longitude: parsed.longitude };
        }
      } catch {}
      return DEFAULT_LOCATION;
    }
    if (typeof loc === 'object' && typeof loc.latitude === 'number' && typeof loc.longitude === 'number') {
      return { latitude: loc.latitude, longitude: loc.longitude };
    }
    return DEFAULT_LOCATION;
  };

  const markerColorFor = (status: string) => {
    switch (status) {
      case 'new': return '#ef4444'; // red
      case 'accepted': return '#f97316'; // orange
      case 'in_progress': return '#f59e0b'; // yellow
      case 'completed': return '#10b981'; // green
      default: return '#ef4444';
    }
  };

  const darkMapStyle = useMemo(
    () => [
      { elementType: "geometry", stylers: [{ color: "#1f2937" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#111827" }] },
      { featureType: "road", elementType: "geometry", stylers: [{ color: "#374151" }] },
      { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#d1d5db" }] },
      { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e7490" }] },
      { featureType: "poi", elementType: "geometry", stylers: [{ color: "#1f2937" }] },
      { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#4b5563" }] }
    ],
    []
  );

  const effectiveDark = typeof mapDarkMode === 'boolean' ? mapDarkMode : (colorScheme === 'dark');

  return (
    <View className="flex-1">
      <MapView
        ref={(ref) => {
          mapRef.current = ref;
        }}
        className="w-full h-full"
        style={{ width: Dimensions.get("window").width, height: Dimensions.get("window").height }}
        initialRegion={{
          latitude: 20,
          longitude: 78,
          latitudeDelta: 15,
          longitudeDelta: 15,
        }}
        showsUserLocation
        showsMyLocationButton
        showsCompass
        customMapStyle={effectiveDark ? darkMapStyle : []}
      >
        {isServiceProvider && showDataLayer &&
          dataPolygons.map(({ coords, key }) => (
            <Polygon key={key} coordinates={coords} strokeColor="#2563eb" fillColor="rgba(37,99,235,0.2)" />
          ))}

        {jobs.map((job) => (
          <Marker key={job.job_id} coordinate={toCoordinate(job.location)} title={`Job - ${job.state}`} pinColor={markerColorFor(job.status)}>
            <Callout>
              <View>
                <Text>{`Job ID: ${job.job_id}`}</Text>
                <Text>{`State: ${job.state}`}</Text>
              </View>
            </Callout>
          </Marker>
        ))}

      </MapView>

      <View className="absolute right-4 items-end" style={{ bottom: (insets.bottom || 0) + 20 }}>
        <TouchableOpacity
          onPress={handleLocate}
          disabled={isLoadingLocation}
          accessibilityRole="button"
          accessibilityLabel="Focus on my location"
          className={`bg-white border border-gray-300 rounded-full items-center justify-center ${isLoadingLocation ? 'opacity-50' : ''}`}
          style={{ width: 44, height: 44 }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Crosshair color="#111827" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

