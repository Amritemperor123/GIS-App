// components/MapView.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import MapView, { Marker, Polygon, Polyline, Region } from "react-native-maps";
import { View, Dimensions, TouchableOpacity, Text, Switch, Alert } from "react-native";
import { MapPin, Layers, Layers3, Route, Map } from "lucide-react-native";
import * as Location from 'expo-location';
// Import local GeoJSON
import dataLayer from "../assets/layers/data.geojson";
import lineLayer from "../assets/layers/line_layer.geojson";
import lineStrings from "../assets/layers/line_strings.geojson";
import mainLayer from "../assets/layers/main_layer.geojson";

export default function CustomMap() {
  const mapRef = useRef<MapView | null>(null);
  const DEFAULT_LOCATION = { latitude: 25.3176, longitude: 82.9739 }; // Varanasi
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<Location.LocationPermissionResponse | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // UI toggles similar to web layer control
  const [showDataLayer, setShowDataLayer] = useState(true);
  const [showLineLayer, setShowLineLayer] = useState(true);
  const [showLineStrings, setShowLineStrings] = useState(true);
  const [showMainLayer, setShowMainLayer] = useState(true);
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

  const lineLayerLines = useMemo(() => buildLinesFrom(lineLayer), []);
  const lineStringsLines = useMemo(() => buildLinesFrom(lineStrings), []);
  const mainLayerLines = useMemo(() => buildLinesFrom(mainLayer), []);

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
      >
        {showDataLayer &&
          dataPolygons.map(({ coords, key }) => (
            <Polygon key={key} coordinates={coords} strokeColor="#2563eb" fillColor="rgba(37,99,235,0.2)" />
          ))}

        {showLineLayer &&
          lineLayerLines.map(({ coords, key }) => (
            <Polyline key={key} coordinates={coords} strokeColor="#ef4444" strokeWidth={3} />
          ))}

        {showLineStrings &&
          lineStringsLines.map(({ coords, key }) => (
            <Polyline key={key} coordinates={coords} strokeColor="#f97316" strokeWidth={3} />
          ))}

        {showMainLayer &&
          mainLayerLines.map(({ coords, key }) => (
            <Polyline key={key} coordinates={coords} strokeColor="#10b981" strokeWidth={3} />
          ))}

        {userLocation && <Marker coordinate={userLocation} title="You are here" />}
      </MapView>

      <View className="absolute top-4 right-4 bg-white/95 p-3 rounded-lg gap-2 shadow-lg">
        <TouchableOpacity onPress={() => setLayersOpen((v) => !v)} className="py-0.5">
          <Text className="font-semibold mb-1">Layers {layersOpen ? "▾" : "▸"}</Text>
        </TouchableOpacity>
        {layersOpen && (
          <>
            <View className="flex-row items-center justify-between gap-2">
              <Layers color="#111827" />
              <Switch value={showDataLayer} onValueChange={setShowDataLayer} />
            </View>
            <View className="flex-row items-center justify-between gap-2">
              <Route color="#111827" />
              <Switch value={showLineLayer} onValueChange={setShowLineLayer} />
            </View>
            <View className="flex-row items-center justify-between gap-2">
              <Layers3 color="#111827" />
              <Switch value={showLineStrings} onValueChange={setShowLineStrings} />
            </View>
            <View className="flex-row items-center justify-between gap-2">
              <Map color="#111827" />
              <Switch value={showMainLayer} onValueChange={setShowMainLayer} />
            </View>
          </>
        )}
      </View>

      <View className="absolute bottom-4 right-4">
        <TouchableOpacity
          onPress={handleLocate}
          disabled={isLoadingLocation}
          accessibilityRole="button"
          accessibilityLabel="Focus on my location"
          className={`bg-white border border-gray-300 rounded-full items-center justify-center ${isLoadingLocation ? 'opacity-50' : ''}`}
          style={{ width: 44, height: 44 }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MapPin color="#111827" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

