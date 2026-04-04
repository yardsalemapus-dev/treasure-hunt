import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import * as Location from "expo-location";
import { MapScreen } from "./screens/MapScreen";
import { SearchScreen } from "./screens/SearchScreen";
import { SavedRoutesScreen } from "./screens/SavedRoutesScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { AppRouter } from "../server/routers";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Initialize tRPC client
export const trpc = createTRPCReact<AppRouter>();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "https://treasurehunt-d4uu6hut.manus.space/api/trpc",
      async headers() {
        return {
          // Add auth headers here
        };
      },
    }),
  ],
});

function MapNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MapMain"
        component={MapScreen}
        options={{ title: "Find Sales Near You" }}
      />
    </Stack.Navigator>
  );
}

function SearchNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SearchMain"
        component={SearchScreen}
        options={{ title: "Search Sales" }}
      />
    </Stack.Navigator>
  );
}

function SavedRoutesNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SavedRoutesMain"
        component={SavedRoutesScreen}
        options={{ title: "Saved Routes" }}
      />
    </Stack.Navigator>
  );
}

function ProfileNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ title: "Profile" }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={{
              headerShown: true,
              tabBarActiveTintColor: "#3b82f6",
              tabBarInactiveTintColor: "#9ca3af",
            }}
          >
            <Tab.Screen
              name="Map"
              component={MapNavigator}
              options={{
                title: "Map",
                tabBarLabel: "Map",
              }}
            />
            <Tab.Screen
              name="Search"
              component={SearchNavigator}
              options={{
                title: "Search",
                tabBarLabel: "Search",
              }}
            />
            <Tab.Screen
              name="SavedRoutes"
              component={SavedRoutesNavigator}
              options={{
                title: "Routes",
                tabBarLabel: "Routes",
              }}
            />
            <Tab.Screen
              name="Profile"
              component={ProfileNavigator}
              options={{
                title: "Profile",
                tabBarLabel: "Profile",
              }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
