import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  GestureResponderEvent,
  PanResponder,
  Animated,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../types/navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTrackPlayerEvents, Event} from 'react-native-track-player';
import {Track} from '../types';
import {queueManager} from '../services/audioPlayer/queueManager';
import {colors} from '../theme/colors';
import {usePlayer} from '../hooks/usePlayer';
import {hp, wp} from '../utils/wp-hp';

const {width} = Dimensions.get('window');
const SWIPE_THRESHOLD = 50;

interface MiniPlayerProps {
  track: Track;
}

type MiniPlayerNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const MiniPlayer: React.FC<MiniPlayerProps> = ({track}) => {
  const navigation = useNavigation<MiniPlayerNavigationProp>();
  const {
    isPlaying,
    isChangingTrack,
    togglePlayback,
    skipToNext,
    skipToPrevious,
  } = usePlayer();
  const [displayTrack, setDisplayTrack] = useState<Track>(track);
  const contentTranslateX = useState(new Animated.Value(0))[0];
  const [touchStartTime, setTouchStartTime] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);

  // Memoize handleSwipeComplete since it's used in panResponder
  const handleSwipeComplete = useCallback(
    async (direction: 'left' | 'right') => {
      try {
        if (direction === 'right') {
          await skipToPrevious();
        } else {
          await skipToNext();
        }
      } catch (error) {
        console.error('Error handling swipe:', error);
      }
    },
    [skipToPrevious, skipToNext],
  );

  // Memoize handlePress since it's used in panResponder and as event handler
  const handlePress = useCallback(() => {
    navigation.navigate('Player', {track: displayTrack});
  }, [navigation, displayTrack]);

  // Memoize panResponder since it depends on several callbacks and state
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.abs(gestureState.dx) > 10;
        },
        onPanResponderGrant: (evt: GestureResponderEvent) => {
          setTouchStartTime(Date.now());
          setTouchStartX(evt.nativeEvent.locationX);
          contentTranslateX.setValue(0);
        },
        onPanResponderMove: (_, gestureState) => {
          contentTranslateX.setValue(gestureState.dx);
        },
        onPanResponderRelease: async (
          evt: GestureResponderEvent,
          gestureState,
        ) => {
          const touchDuration = Date.now() - touchStartTime;
          const touchDistance = Math.abs(
            evt.nativeEvent.locationX - touchStartX,
          );

          if (touchDuration < 200 && touchDistance < 5) {
            handlePress();
            return;
          }

          if (Math.abs(gestureState.dx) > SWIPE_THRESHOLD) {
            const direction = gestureState.dx > 0 ? 'right' : 'left';
            Animated.timing(contentTranslateX, {
              toValue: direction === 'right' ? width : -width,
              duration: 200,
              useNativeDriver: true,
            }).start(async () => {
              contentTranslateX.setValue(0);
              await handleSwipeComplete(direction);
            });
          } else {
            Animated.spring(contentTranslateX, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          }
        },
        onPanResponderTerminate: () => {
          Animated.spring(contentTranslateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
      }),
    [
      contentTranslateX,
      handlePress,
      handleSwipeComplete,
      touchStartTime,
      touchStartX,
    ],
  );

  // Memoize the track sync effect callback
  const syncCurrentTrack = useCallback(async () => {
    const currentTrack = await queueManager.getCurrentTrack();
    if (currentTrack) {
      setDisplayTrack(currentTrack);
    } else {
      setDisplayTrack(track);
    }
  }, [track]);

  useEffect(() => {
    syncCurrentTrack();
  }, [syncCurrentTrack]);

  // Memoize the track change event handler
  const handleTrackChange = useCallback(
    async (event: any) => {
      if (event.type === Event.PlaybackTrackChanged) {
        const currentTrack = await queueManager.getCurrentTrack();
        if (currentTrack) {
          setDisplayTrack(currentTrack);
          navigation.setParams({track: currentTrack});
        }
      }
    },
    [navigation],
  );

  useTrackPlayerEvents([Event.PlaybackTrackChanged], handleTrackChange);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.swipeableArea}>
          <Animated.View
            style={[
              styles.swipeContainer,
              {transform: [{translateX: contentTranslateX}]},
            ]}
            {...panResponder.panHandlers}>
            <Image
              source={{uri: displayTrack.artwork}}
              style={styles.artwork}
            />
            <View style={styles.textContainer}>
              <Text style={styles.title} numberOfLines={1}>
                {displayTrack.title}
              </Text>
              <Text style={styles.artist} numberOfLines={1}>
                {displayTrack.artist}
              </Text>
            </View>
          </Animated.View>
        </View>
        <TouchableOpacity
          onPress={togglePlayback}
          style={styles.playButton}
          disabled={isChangingTrack}
          hitSlop={{top: hp(10), bottom: hp(10), left: wp(10), right: wp(10)}}>
          <Icon
            name={isPlaying && !isChangingTrack ? 'pause' : 'play'}
            size={wp(24)}
            color={colors.text.primary}
            style={styles.playIcon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: hp(65),
    backgroundColor: colors.surface,
    borderTopWidth: wp(1),
    borderTopColor: `${colors.primary}20`,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: hp(-3),
    },
    shadowOpacity: 0.15,
    shadowRadius: wp(6),
    elevation: 8,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: wp(16),
    paddingVertical: hp(8),
    backgroundColor: `${colors.primary}10`,
    borderLeftWidth: wp(4),
    borderLeftColor: colors.primary,
  },
  swipeableArea: {
    flex: 1,
    overflow: 'hidden',
    paddingLeft: wp(16),
  },
  swipeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  artwork: {
    width: wp(48),
    height: hp(48),
    borderRadius: wp(10),
    marginRight: wp(14),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: hp(2),
    },
    shadowOpacity: 0.2,
    shadowRadius: wp(3),
  },
  textContainer: {
    flex: 1,
    marginRight: wp(24),
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: hp(2),
    letterSpacing: -0.3,
  },
  artist: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.secondary,
    letterSpacing: -0.2,
  },
  playButton: {
    padding: wp(12),
    backgroundColor: colors.primary,
    borderRadius: wp(26),
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: hp(2),
    },
    shadowOpacity: 0.3,
    shadowRadius: wp(4),
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: wp(16),
  },
  playIcon: {
    marginLeft: wp(2),
  },
});
