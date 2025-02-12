import React, {memo, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {colors} from '../theme/colors';
import {Track} from '../types';
import {usePlayer} from '../hooks/usePlayer';
import {hp, wp} from '../utils/wp-hp';

interface TrackListProps {
  tracks: Track[];
  onTrackPress: (track: Track) => void;
  onFavoritePress: (track: Track) => void;
  currentTrackId?: string;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  contentInset?: {top: number};
}

export const TrackList = memo(
  ({
    tracks,
    onTrackPress,
    onFavoritePress,
    currentTrackId,
    onScroll,
    contentInset,
  }: TrackListProps) => {
    const {isMiniPlayerVisible, initializeTrack, isFavorite} = usePlayer();

    const handleTrackPress = useCallback(
      async (selectedTrack: Track) => {
        try {
          const currentIndex = tracks.findIndex(t => t.id === selectedTrack.id);
          if (currentIndex === -1) {
            return;
          }

          onTrackPress(selectedTrack);
          await initializeTrack(selectedTrack, tracks, currentIndex);
        } catch (error) {
          console.error('Error playing track:', error);
        }
      },
      [tracks, onTrackPress, initializeTrack],
    );

    const renderItem = useCallback(
      ({item}: {item: Track; index: number}) => (
        <Animated.View
          style={[
            styles.itemContainer,
            {
              transform: [{scale: new Animated.Value(1)}],
            },
          ]}>
          <TouchableOpacity
            style={[
              styles.trackItem,
              currentTrackId === item.id && styles.currentTrack,
            ]}
            onPress={() => handleTrackPress(item)}
            activeOpacity={0.7}>
            <Image source={{uri: item.artwork}} style={styles.artwork} />
            <View style={styles.trackInfo}>
              <Text style={styles.title} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.artist} numberOfLines={1}>
                {item.artist}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={() => onFavoritePress(item)}
              hitSlop={{
                top: hp(10),
                bottom: hp(10),
                left: wp(10),
                right: wp(10),
              }}>
              <Icon
                name={isFavorite(item.id) ? 'heart' : 'heart-outline'}
                size={wp(22)}
                color={
                  isFavorite(item.id) ? colors.primary : colors.text.secondary
                }
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      ),
      [currentTrackId, handleTrackPress, onFavoritePress, isFavorite],
    );

    const renderSeparator = useCallback(
      () => <View style={styles.separator} />,
      [],
    );

    const containerStyle = useMemo(
      () => [
        styles.container,
        isMiniPlayerVisible && styles.containerWithMiniPlayer,
        contentInset,
      ],
      [isMiniPlayerVisible, contentInset],
    );

    return (
      <FlatList
        data={tracks}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={containerStyle}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={renderSeparator}
        onScroll={onScroll}
        scrollEventThrottle={16}
      />
    );
  },
);

const styles = StyleSheet.create({
  container: {
    padding: wp(16),
    paddingBottom: hp(16),
  },
  containerWithMiniPlayer: {
    paddingBottom: hp(76), // Mini player height (60) + extra padding
  },
  itemContainer: {
    marginBottom: hp(8),
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp(12),
    backgroundColor: colors.surface,
    borderRadius: wp(12),
  },
  currentTrack: {
    backgroundColor: `${colors.primary}15`,
    borderColor: colors.primary,
    borderWidth: wp(1),
  },
  artwork: {
    width: wp(48),
    height: hp(48),
    borderRadius: wp(8),
    backgroundColor: colors.surface,
  },
  trackInfo: {
    flex: 1,
    marginLeft: wp(12),
  },
  title: {
    fontSize: wp(16),
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: hp(4),
  },
  artist: {
    fontSize: wp(14),
    color: colors.text.secondary,
  },
  favoriteButton: {
    padding: wp(8),
    marginLeft: wp(8),
  },
  separator: {
    height: hp(8),
  },
});
