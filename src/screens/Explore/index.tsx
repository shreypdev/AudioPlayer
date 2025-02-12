import React, {useEffect, useState, useRef, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Animated,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import {TrackList} from '../../components/TrackList';
import {Track} from '../../types';
import {queueManager} from '../../services/audioPlayer/queueManager';
import {useDebounce} from '../../hooks/useDebounce';
import {colors} from '../../theme/colors';
import {
  HEADER_MAX_HEIGHT,
  AnimatedHeader,
} from '../../components/AnimatedHeader';
import {useTracks} from '../../hooks/useTracks';
import {usePlayer} from '../../hooks/usePlayer';
import {hp} from '../../utils/wp-hp';

const ExploreScreen = () => {
  const {tracks, loading, searchLoading, loadTracks} = useTracks();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery);
  const navigation = useNavigation();
  const scrollY = useRef(new Animated.Value(0)).current;
  const {toggleFavorite} = usePlayer();

  useEffect(() => {
    loadTracks();
  }, [loadTracks]);

  useEffect(() => {
    if (debouncedSearchQuery !== undefined) {
      loadTracks(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, loadTracks]);

  const handleTrackPress = useCallback(
    async (selectedTrack: Track) => {
      try {
        const currentIndex = tracks.findIndex(t => t.id === selectedTrack.id);
        if (currentIndex === -1) {
          return;
        }

        navigation.navigate('Player', {track: selectedTrack});
        await queueManager.initializeQueue(tracks, currentIndex, {
          updateUI: false,
        });
      } catch (error) {
        console.error('Error playing track:', error);
      }
    },
    [tracks, navigation],
  );

  const handleClear = useCallback(() => {
    setSearchQuery('');
  }, []);

  const trackList = useMemo(
    () => (
      <TrackList
        tracks={tracks}
        onTrackPress={handleTrackPress}
        onFavoritePress={toggleFavorite}
        onScroll={Animated.event(
          [{nativeEvent: {contentOffset: {y: scrollY}}}],
          {useNativeDriver: false},
        )}
        contentInset={{top: HEADER_MAX_HEIGHT}}
      />
    ),
    [tracks, handleTrackPress, toggleFavorite, scrollY],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <AnimatedHeader title="Explore" scrollY={scrollY}>
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color={colors.text.secondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for music..."
              placeholderTextColor={colors.text.secondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoCapitalize="none"
              autoComplete="off"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={handleClear}
                style={styles.clearButton}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <Icon
                  name="close-circle"
                  size={20}
                  color={colors.text.secondary}
                />
              </TouchableOpacity>
            )}
          </View>
        </AnimatedHeader>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading tracks...</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {searchLoading && (
              <View style={styles.searchLoadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )}
            {trackList}
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
  header: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: colors.surface,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 0,
    width: '100%',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: colors.text.primary,
    padding: 0,
    height: hp(25),
  },
  clearButton: {
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text.secondary,
  },
  listContainer: {
    flex: 1,
  },
  searchLoadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
});

export default ExploreScreen;
