import { Platform, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

import { ProfileProvider } from './src/context/ProfileContext';
import { StudySpotsProvider } from './src/context/StudySpotsContext';
import { CheckInsProvider } from './src/hooks/useCheckIns';
import { COLORS } from './src/theme';
import HomeScreen from './src/screens/HomeScreen';
import MapScreen from './src/screens/MapScreen';
import DiscoverScreen from './src/screens/DiscoverScreen';
import FavouritesScreen from './src/screens/FavouritesScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<
  string,
  {
    active: keyof typeof Ionicons.glyphMap;
    inactive: keyof typeof Ionicons.glyphMap;
  }
> = {
  Home: {
    active: 'home',
    inactive: 'home-outline',
  },
  Map: {
    active: 'map',
    inactive: 'map-outline',
  },
  Discover: {
    active: 'compass',
    inactive: 'compass-outline',
  },
  Favourites: {
    active: 'heart',
    inactive: 'heart-outline',
  },
  Profile: {
    active: 'person',
    inactive: 'person-outline',
  },
};

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return <View style={styles.loading} />;
  }

  return (
    <SafeAreaProvider>
      <StudySpotsProvider>
        <ProfileProvider>
          <CheckInsProvider>
            <StatusBar style="dark" />

            <NavigationContainer>
              <Tab.Navigator
                screenOptions={({ route }) => ({
                  headerShown: false,

                  tabBarActiveTintColor: COLORS.purple,
                  tabBarInactiveTintColor: COLORS.textSecondary,

                  tabBarStyle: styles.tabBar,
                  tabBarItemStyle: styles.tabItem,
                  tabBarLabelStyle: styles.tabLabel,

                  tabBarIcon: ({ color, size, focused }) => {
                    const icons = TAB_ICONS[route.name];

                    return (
                      <View
                        style={[
                          styles.iconWrap,
                          focused && styles.iconWrapActive,
                        ]}
                      >
                        <Ionicons
                          name={focused ? icons.active : icons.inactive}
                          size={focused ? size + 1 : size}
                          color={color}
                        />
                      </View>
                    );
                  },
                })}
              >
                <Tab.Screen name="Home" component={HomeScreen} />
                <Tab.Screen name="Map" component={MapScreen} />
                <Tab.Screen name="Discover" component={DiscoverScreen} />
                <Tab.Screen name="Favourites" component={FavouritesScreen} />
                <Tab.Screen name="Profile" component={ProfileScreen} />
              </Tab.Navigator>
            </NavigationContainer>
          </CheckInsProvider>
        </ProfileProvider>
      </StudySpotsProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  tabBar: {
    backgroundColor: COLORS.glassStrong,

    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorder,

    height: 72,

    paddingTop: 7,
    paddingBottom: 9,

    shadowColor: COLORS.shadowStrong,
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: -6,
    },

    elevation: 12,

    ...(Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(18px)',
        }
      : {}),
  },

  tabItem: {
    paddingTop: 1,
  },

  tabLabel: {
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
    marginTop: 2,
  },

  iconWrap: {
    width: 38,
    height: 30,

    borderRadius: 12,

    alignItems: 'center',
    justifyContent: 'center',
  },

  iconWrapActive: {
    backgroundColor: COLORS.purpleVerySoft,
  },
});