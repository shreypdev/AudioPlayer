import React, {useMemo, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import {View, StyleSheet, SafeAreaView, Platform} from 'react-native';
import {MiniPlayer} from '../components/MiniPlayer';
import {useTrackPlayerEvents, Event} from 'react-native-track-player';
import {queueManager} from '../services/audioPlayer/queueManager';
import {TracksProvider} from '../contexts/TracksContext';
import {colors} from '../theme/colors';
import {PlayerProvider} from '../contexts/PlayerContext';

import ExploreScreen from '../screens/Explore';
import FavoritesScreen from '../screens/Favorites';
import PlayerScreen from '../screens/Player';
import {RootStackParamList} from '../types/navigation';
import {Track} from '../types';
import {hp, wp} from '../utils/wp-hp';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

const TabNavigator = () => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);

  useTrackPlayerEvents([Event.PlaybackTrackChanged], async event => {
    if (event.type === Event.PlaybackTrackChanged && event.nextTrack !== null) {
      const track = queueManager.getCurrentTrack();
      if (track) {
        const trackWithId: Track = {
          id: String(track.url) || String(event.nextTrack),
          title: track.title || '',
          artist: track.artist || '',
          artwork: String(track.artwork) || '',
          url: String(track.url) || String(event.nextTrack),
          duration: track.duration || 0,
        };
        setCurrentTrack(trackWithId);
      }
    }
  });

  const tabContent = useMemo(
    () => (
      <Tab.Navigator
        screenOptions={({route}) => ({
          tabBarIcon: ({focused, color, size}) => {
            let iconName;
            if (route.name === 'Explore') {
              iconName = focused ? 'compass' : 'compass-outline';
            } else if (route.name === 'Favorites') {
              iconName = focused ? 'heart' : 'heart-outline';
            }
            return <Icon name={iconName!} size={size} color={color} />;
          },
          tabBarStyle: {
            height: hp(Platform.OS === 'ios' ? 50 : 60),
            paddingBottom: hp(5),
            paddingTop: hp(5),
            backgroundColor: colors.surface,
            borderTopWidth: wp(1),
            borderTopColor: colors.border,
            elevation: 0,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.text.secondary,
        })}>
        <Tab.Screen
          name="Explore"
          component={ExploreScreen}
          options={{headerShown: false}}
        />
        <Tab.Screen
          name="Favorites"
          component={FavoritesScreen}
          options={{headerShown: false}}
        />
      </Tab.Navigator>
    ),
    [],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>{tabContent}</View>
        {currentTrack && (
          <View style={styles.overlay}>
            <MiniPlayer track={currentTrack} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    bottom: hp(Platform.OS === 'ios' ? 50 : 60), // Tab bar height
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: hp(1),
    borderTopColor: colors.border,
  },
});

const AppNavigator = () => {
  return (
    <TracksProvider>
      <PlayerProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen
              name="MainTabs"
              component={TabNavigator}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="Player"
              component={PlayerScreen}
              options={{
                presentation: 'modal',
                headerShown: false,
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </PlayerProvider>
    </TracksProvider>
  );
};

export default AppNavigator;
