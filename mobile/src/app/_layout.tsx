import { Stack } from "expo-router";
import { QueryProvider } from "../provider/query-provider";

export default function RootLayout() {
  return (
    <QueryProvider>
      <Stack />
    </QueryProvider>
  );
}
