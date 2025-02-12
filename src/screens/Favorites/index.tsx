import React, {useRef} from 'react';
import {View, StyleSheet, Animated} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {TrackList} from '../../components/TrackList';
import {Track} from '../../types';
import {queueManager} from '../../services/audioPlayer/queueManager';
import {colors} from '../../theme/colors';
import {
  HEADER_MAX_HEIGHT_NO_SEARCH,
  AnimatedHeader,
} from '../../components/AnimatedHeader';
import {usePlayer} from '../../hooks/usePlayer';

const FavoritesScreen = () => {
  const {favoriteTracks, toggleFavorite} = usePlayer();
  const scrollY = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();

  const handleTrackPress = async (selectedTrack: Track) => {
    const currentIndex = favoriteTracks.findIndex(
      t => t.id === selectedTrack.id,
    );
    if (currentIndex === -1) {
      return;
    }

    navigation.navigate('Player', {track: selectedTrack});
    await queueManager.initializeQueue(favoriteTracks, currentIndex);
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        <AnimatedHeader title="Favorites" scrollY={scrollY} />
        <TrackList
          tracks={favoriteTracks}
          onTrackPress={handleTrackPress}
          onFavoritePress={toggleFavorite}
          onScroll={Animated.event(
            [{nativeEvent: {contentOffset: {y: scrollY}}}],
            {useNativeDriver: false},
          )}
          contentInset={{top: HEADER_MAX_HEIGHT_NO_SEARCH}}
        />
      </View>
    </View>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FavoritesScreen;
