import React, {
  createContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import TrackPlayer, {
  Event,
  useTrackPlayerEvents,
  State,
  usePlaybackState,
} from 'react-native-track-player';
import {Track} from '../types';
import {queueManager} from '../services/audioPlayer/queueManager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {audioApi} from '../services/api/audioApi';

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  isMiniPlayerVisible: boolean;
  isChangingTrack: boolean;
  togglePlayback: () => Promise<void>;
  skipToNext: () => Promise<void>;
  skipToPrevious: () => Promise<void>;
  initializeTrack: (
    track: Track,
    tracks: Track[],
    index: number,
  ) => Promise<void>;
  favorites: string[];
  favoriteTracks: Track[];
  toggleFavorite: (track: Track) => Promise<void>;
  isFavorite: (trackId: string) => boolean;
}

export const PlayerContext = createContext<PlayerContextType>({
  currentTrack: null,
  isPlaying: false,
  isMiniPlayerVisible: false,
  isChangingTrack: false,
  togglePlayback: async () => {},
  skipToNext: async () => {},
  skipToPrevious: async () => {},
  initializeTrack: async () => {},
  favorites: [],
  favoriteTracks: [],
  toggleFavorite: async () => {},
  isFavorite: () => false,
});

const FAVORITE_TRACKS_KEY = '@favorite_tracks';

export const PlayerProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isMiniPlayerVisible, setIsMiniPlayerVisible] = useState(false);
  const [isChangingTrack, setIsChangingTrack] = useState(false);
  const playbackState = usePlaybackState();
  const isPlaying = playbackState === State.Playing;
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteTracks, setFavoriteTracks] = useState<Track[]>([]);
  const tracksCache = useRef<{[key: string]: Track}>({});

  const handleTrackChange = useCallback(
    async (action: () => Promise<void>) => {
      if (isChangingTrack) {
        return;
      }
      setIsChangingTrack(true);

      try {
        await action();
        if (isPlaying) {
          await TrackPlayer.play();
        }
      } catch (error) {
        console.error('Error changing track:', error);
        setIsChangingTrack(false);
      }
    },
    [isChangingTrack, isPlaying],
  );

  const skipToNext = useCallback(async () => {
    await handleTrackChange(async () => {
      await queueManager.skipToNext();
    });
  }, [handleTrackChange]);
  const skipToPrevious = useCallback(async () => {
    await handleTrackChange(async () => {
      await queueManager.skipToPrevious();
    });
  }, [handleTrackChange]);

  const initializeTrack = useCallback(
    async (track: Track, tracks: Track[], index: number) => {
      try {
        await queueManager.initializeQueue(tracks, index);
        setCurrentTrack(track);
        setIsMiniPlayerVisible(true);
      } catch (error) {
        console.error('Error initializing track:', error);
      }
    },
    [],
  );

  // Load favorites and tracks on mount
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const favoritesData = await AsyncStorage.getItem(FAVORITE_TRACKS_KEY);
      const favoriteIds = favoritesData ? JSON.parse(favoritesData) : [];
      setFavorites(favoriteIds);

      // Load tracks for favorites
      const tracks = await Promise.all(
        favoriteIds.map(async (id: string) => {
          if (tracksCache.current[id]) {
            return tracksCache.current[id];
          }
          const track = await audioApi.getTrackDetails(id);
          if (track) {
            tracksCache.current[id] = {...track, isFavorite: true};
            return tracksCache.current[id];
          }
          return null;
        }),
      );

      setFavoriteTracks(tracks.filter((t): t is Track => t !== null));
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const toggleFavorite = useCallback(
    async (track: Track) => {
      try {
        const updatedFavorites = favorites.includes(track.id)
          ? favorites.filter(id => id !== track.id)
          : [...favorites, track.id];

        await AsyncStorage.setItem(
          FAVORITE_TRACKS_KEY,
          JSON.stringify(updatedFavorites),
        );

        setFavorites(updatedFavorites);

        // Update favorite tracks
        if (!updatedFavorites.includes(track.id)) {
          setFavoriteTracks(current => current.filter(t => t.id !== track.id));
        } else {
          tracksCache.current[track.id] = {...track, isFavorite: true};
          setFavoriteTracks(current => [
            ...current,
            tracksCache.current[track.id],
          ]);
        }
      } catch (error) {
        console.error('Error updating favorites:', error);
      }
    },
    [favorites],
  );

  const togglePlayback = useCallback(async () => {
    try {
      if (isChangingTrack) {
        return;
      }

      if (isPlaying) {
        await TrackPlayer.pause();
      } else {
        await TrackPlayer.play();
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  }, [isPlaying, isChangingTrack]);

  const value = useMemo(
    () => ({
      currentTrack,
      isPlaying,
      isMiniPlayerVisible,
      isChangingTrack,
      togglePlayback,
      skipToNext,
      skipToPrevious,
      initializeTrack,
      favorites,
      favoriteTracks,
      toggleFavorite,
      isFavorite: (id: string) => favorites.includes(id),
    }),
    [
      currentTrack,
      isPlaying,
      isMiniPlayerVisible,
      isChangingTrack,
      togglePlayback,
      skipToNext,
      skipToPrevious,
      initializeTrack,
      favorites,
      favoriteTracks,
      toggleFavorite,
    ],
  );

  // Memoize the track change event handler
  const handleTrackPlayerEvent = useCallback(async (event: any) => {
    if (event.type === Event.PlaybackTrackChanged) {
      const track = await TrackPlayer.getTrack(event.nextTrack);
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
        setIsMiniPlayerVisible(true);
      } else {
        setCurrentTrack(null);
        setIsMiniPlayerVisible(false);
      }
      setIsChangingTrack(false);
    }
  }, []);

  useTrackPlayerEvents([Event.PlaybackTrackChanged], handleTrackPlayerEvent);

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
};
