// components/MapView.web.tsx
import React, { useState } from "react";
import { View, Text, Switch, TouchableOpacity, Linking } from "react-native";
import { MapPin } from "lucide-react-native";

export default function WebMapFallback() {
  const [showDataLayer, setShowDataLayer] = useState(true);
  const [showLineLayer, setShowLineLayer] = useState(true);
  const [showLineStrings, setShowLineStrings] = useState(true);
  const [showMainLayer, setShowMainLayer] = useState(true);

  const handleOpenWebApp = () => {
    Linking.openURL("/");
  };

  return (
    <View className="flex-1">
      <View className="flex-1 items-center justify-center px-4 bg-gray-50">
        <Text className="text-lg font-semibold mb-1.5">Map preview is not available in this app on web</Text>
        <Text className="text-gray-600 text-center mb-3">
          This Mobile project uses native maps which aren't supported on web here.
        </Text>
        <TouchableOpacity onPress={handleOpenWebApp} className="bg-gray-900 px-3 py-2 rounded-md">
          <Text className="text-white">Open the dedicated Web App</Text>
        </TouchableOpacity>
      </View>

      <View className="absolute top-4 right-4 bg-white/95 p-3 rounded-lg gap-2 shadow-lg">
        <TouchableOpacity className="py-0.5">
          <Text className="font-semibold mb-1">Layers ▾</Text>
        </TouchableOpacity>
        <View className="flex-row items-center justify-between gap-2">
          <Text className="text-xs text-gray-900">Digital Boundaries</Text>
          <Switch value={showDataLayer} onValueChange={setShowDataLayer} />
        </View>
        <View className="flex-row items-center justify-between gap-2">
          <Text className="text-xs text-gray-900">Lines</Text>
          <Switch value={showLineLayer} onValueChange={setShowLineLayer} />
        </View>
        <View className="flex-row items-center justify-between gap-2">
          <Text className="text-xs text-gray-900">Strings</Text>
          <Switch value={showLineStrings} onValueChange={setShowLineStrings} />
        </View>
        <View className="flex-row items-center justify-between gap-2">
          <Text className="text-xs text-gray-900">Main Layer</Text>
          <Switch value={showMainLayer} onValueChange={setShowMainLayer} />
        </View>
      </View>

      <View className="absolute bottom-4 right-4 mb-24">
        <TouchableOpacity className="bg-white border border-gray-300 py-2 px-2.5 rounded-md items-center">
          <Text className="text-sm"><MapPin className="w-4 h-4"/> Locate me (native only)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}