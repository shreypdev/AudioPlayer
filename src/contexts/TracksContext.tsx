import React, {createContext, useState, useCallback, useMemo} from 'react';
import {Track} from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {audioApi} from '../services/api/audioApi';

const FAVORITE_TRACKS_KEY = '@favorite_tracks';

interface TracksContextType {
  tracks: Track[];
  loading: boolean;
  searchLoading: boolean;
  loadTracks: (query?: string) => Promise<void>;
  handleFavoritePress: (track: Track) => Promise<void>;
}

export const TracksContext = createContext<TracksContextType | undefined>(
  undefined,
);

export const TracksProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  const loadTracks = useCallback(async (query: string = '') => {
    try {
      if (query) {
        setSearchLoading(true);
      }
      const [tracksData, favoritesData] = await Promise.all([
        query ? audioApi.searchTracks(query) : audioApi.getTrendingTracks(),
        AsyncStorage.getItem(FAVORITE_TRACKS_KEY),
      ]);

      const favorites = favoritesData ? JSON.parse(favoritesData) : [];
      const tracksWithFavorites = tracksData.map(track => ({
        ...track,
        isFavorite: favorites.includes(track.id),
      }));

      setTracks(tracksWithFavorites);
    } catch (error) {
      console.error('Error loading tracks:', error);
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  }, []);

  const handleFavoritePress = useCallback(async (track: Track) => {
    try {
      const favoritesData = await AsyncStorage.getItem(FAVORITE_TRACKS_KEY);
      const favorites = favoritesData ? JSON.parse(favoritesData) : [];

      const updatedFavorites = track.isFavorite
        ? favorites.filter((id: string) => id !== track.id)
        : [...favorites, track.id];

      await AsyncStorage.setItem(
        FAVORITE_TRACKS_KEY,
        JSON.stringify(updatedFavorites),
      );

      setTracks(currentTracks =>
        currentTracks.map(t =>
          t.id === track.id ? {...t, isFavorite: !t.isFavorite} : t,
        ),
      );
    } catch (error) {
      console.error('Error updating favorites:', error);
    }
  }, []);

  const value = useMemo(
    () => ({
      tracks,
      loading,
      searchLoading,
      loadTracks,
      handleFavoritePress,
    }),
    [tracks, loading, searchLoading, loadTracks, handleFavoritePress],
  );

  return (
    <TracksContext.Provider value={value}>{children}</TracksContext.Provider>
  );
};
