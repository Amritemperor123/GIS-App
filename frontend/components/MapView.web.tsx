// components/MapView.web.tsx
import React, { useState } from "react";
import { View, Text, Switch, TouchableOpacity, Linking } from "react-native";
import { MapPin } from "lucide-react-native";
import { useAuth } from "../contexts/AuthContext";
import { useColorScheme } from "../hooks/use-color-scheme";

export default function WebMapFallback() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const [showDataLayer, setShowDataLayer] = useState(true);
  const [mapDarkMode] = useState<boolean>(colorScheme === 'dark');

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

      {/* Dark mode toggle moved to sidebar (web fallback) */}

      <View className="absolute bottom-4 right-4 mb-24 items-end gap-2">
        {/* Toggle removed here as well */}
        <TouchableOpacity className="bg-white border border-gray-300 py-2 px-2.5 rounded-md items-center">
          <Text className="text-sm"><MapPin className="w-4 h-4"/> Locate me (native only)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}