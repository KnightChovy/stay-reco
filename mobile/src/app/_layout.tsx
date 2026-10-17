import { useEffect } from "react";
import { Stack } from "expo-router";
import {
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
  useFonts,
} from "@expo-google-fonts/be-vietnam-pro";
import { QueryProvider } from "../provider/query-provider";
import { colors } from "@/constants/theme";
import { useAuthStore } from "@/stores/auth.store";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
  });

  useEffect(() => {
    void useAuthStore.getState().hydrate();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <QueryProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: colors.surface } }} />
    </QueryProvider>
  );
}
