import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import {
  NavigationProp,
  RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import TrackPlayer, {
  useProgress,
  Event,
  useTrackPlayerEvents,
} from 'react-native-track-player';
import {RootStackParamList} from '../../types/navigation';
import {queueManager} from '../../services/audioPlayer/queueManager';
import {images} from '../../assets';
import {colors} from '../../theme/colors';
import {
  PanGestureHandler,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  useAnimatedGestureHandler,
} from 'react-native-reanimated';
import {Track} from '../../types';
import {usePlayer} from '../../hooks/usePlayer';

const {width} = Dimensions.get('window');

type PlayerScreenRouteProp = RouteProp<RootStackParamList, 'Player'>;
type PlayerScreenNavigationProp = NavigationProp<RootStackParamList>;

const formatTime = (seconds: number) => {
  const validSeconds = Math.max(0, Math.floor(seconds || 0));
  const mins = Math.floor(validSeconds / 60);
  const secs = validSeconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const PlayerScreen = () => {
  const navigation = useNavigation<PlayerScreenNavigationProp>();
  const route = useRoute<PlayerScreenRouteProp>();
  const {toggleFavorite, isFavorite, isPlaying} = usePlayer();

  const [isLoading, setIsLoading] = useState(true);
  const [track, setTrack] = useState<Track | null>(null);
  const [isFavoriteState, setIsFavoriteState] = useState(false);
  const [isFirstTrack, setIsFirstTrack] = useState(false);
  const [isLastTrack, setIsLastTrack] = useState(false);
  const progress = useProgress(250);
  const [isSeeking, setIsSeeking] = useState(false);
  const progressAnim = useSharedValue(0);
  const currentTimeAnim = useSharedValue(0);

  const updateQueuePosition = useCallback(() => {
    const currentIndex = queueManager.getCurrentIndex();
    const queue = queueManager.getQueue();
    setIsFirstTrack(currentIndex === 0);
    setIsLastTrack(currentIndex === queue.length - 1);
  }, []);

  useEffect(() => {
    const setup = async () => {
      setIsLoading(true);
      try {
        // Wait for queue to be ready
        await new Promise(resolve => setTimeout(resolve, 100));

        // Get current track from queue
        const currentTrack = queueManager.getCurrentTrack();
        const trackToUse = currentTrack || route.params.track;

        // Initialize queue if needed
        const currentQueue = queueManager.getQueue();
        if (currentQueue.length === 0 || currentTrack?.id !== trackToUse.id) {
          await queueManager.initializeQueue([trackToUse], 0);
          // Wait for queue to update
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Get final track after queue is ready
        const finalTrack = queueManager.getCurrentTrack() || trackToUse;
        setTrack(finalTrack);
        updateQueuePosition();
      } catch (error) {
        console.error('Error setting up track:', error);
      } finally {
        setIsLoading(false);
      }
    };
    setup();
  }, [route.params.track, updateQueuePosition]);

  useEffect(() => {
    setIsFavoriteState(isFavorite(track?.id || ''));
  }, [isFavorite, track?.id]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleFavoritePress = useCallback(async () => {
    if (track) {
      await toggleFavorite(track);
    }
  }, [track, toggleFavorite]);

  const handlePrevious = useCallback(async () => {
    try {
      await queueManager.skipToPrevious();
    } catch (error) {
      console.error('Error skipping to previous:', error);
    }
  }, []);

  const handleNext = useCallback(async () => {
    try {
      await queueManager.skipToNext();
    } catch (error) {
      console.error('Error skipping to next:', error);
    }
  }, []);

  const togglePlayback = useCallback(async () => {
    try {
      if (isPlaying) {
        await TrackPlayer.pause();
      } else {
        await TrackPlayer.play();
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  }, [isPlaying]);

  const handlePlayPause = useCallback(() => {
    togglePlayback();
  }, [togglePlayback]);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      runOnJS(setIsSeeking)(true);
    },
    onActive: event => {
      'worklet';
      const barWidth = width - 48;
      const newProgress = Math.max(0, Math.min(1, event.x / barWidth));
      progressAnim.value = newProgress;
      currentTimeAnim.value = newProgress * progress.duration;
    },
    onEnd: () => {
      'worklet';
      const finalPosition = progressAnim.value * progress.duration;
      runOnJS(TrackPlayer.seekTo)(finalPosition);
      runOnJS(setIsSeeking)(false);
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value * 100}%`,
  }));

  const dotStyle = useAnimatedStyle(
    () => ({
      left: `${progressAnim.value * 100}%`,
      transform: [
        {translateX: -9},
        {
          scale: withSpring(isSeeking ? 1.2 : 1, {
            mass: 1,
            damping: 15,
            stiffness: 200,
          }),
        },
      ],
    }),
    [progressAnim, isSeeking],
  );

  const handleTrackPlayerEvent = useCallback(
    async (event: any) => {
      if (
        event.type === Event.PlaybackTrackChanged &&
        event.nextTrack !== null
      ) {
        await TrackPlayer.seekTo(0);

        const currentTrack = queueManager.getCurrentTrack();
        if (currentTrack) {
          setTrack(currentTrack);
          navigation.setParams({track: currentTrack});
        }
        updateQueuePosition();
      }
    },
    [navigation, updateQueuePosition],
  );

  useTrackPlayerEvents([Event.PlaybackTrackChanged], handleTrackPlayerEvent);

  useEffect(() => {
    if (!isSeeking) {
      const interval = setInterval(() => {
        TrackPlayer.getPosition().then(position => {
          if (position && progress.duration) {
            progressAnim.value = position / progress.duration;
            currentTimeAnim.value = position;
          }
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [currentTimeAnim, isSeeking, progress.duration, progressAnim]);

  if (isLoading || !track) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <GestureHandlerRootView style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <Icon name="chevron-down" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleFavoritePress}
            style={styles.favoriteButton}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <Icon
              name={isFavoriteState ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavoriteState ? colors.primary : colors.text.primary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.artworkContainer}>
          <Image source={{uri: track.artwork}} style={styles.artwork} />
        </View>

        <View style={styles.trackInfo}>
          <Text style={styles.title} numberOfLines={2}>
            {track.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {track.artist}
          </Text>
        </View>

        <View style={styles.progressContainer}>
          <PanGestureHandler onGestureEvent={gestureHandler}>
            <Animated.View style={styles.progressBarWrapper}>
              <View style={styles.progressBar}>
                <Animated.View style={[styles.progress, animatedStyle]} />
                <Animated.View style={[styles.progressDot, dotStyle]} />
              </View>
            </Animated.View>
          </PanGestureHandler>
          <View style={styles.timeContainer}>
            <Animated.Text style={styles.timeText}>
              {formatTime(currentTimeAnim.value)}
            </Animated.Text>
            <Text style={styles.timeText}>
              {formatTime(progress.duration || 0)}
            </Text>
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            onPress={handlePrevious}
            style={[
              styles.skipButton,
              isFirstTrack && styles.skipButtonDisabled,
            ]}
            disabled={isFirstTrack}>
            <Icon
              name="play-skip-back"
              size={28}
              color={isFirstTrack ? colors.text.disabled : colors.text.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handlePlayPause}
            style={styles.playPauseButton}
            disabled={isFirstTrack}>
            <Icon
              name={isPlaying ? 'pause' : 'play'}
              size={40}
              color={colors.text.primary}
              style={styles.playPauseIcon}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleNext}
            style={[
              styles.skipButton,
              isLastTrack && styles.skipButtonDisabled,
            ]}
            disabled={isLastTrack}>
            <Icon
              name="play-skip-forward"
              size={28}
              color={isLastTrack ? colors.text.disabled : colors.text.primary}
            />
          </TouchableOpacity>
        </View>
      </GestureHandlerRootView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  backButton: {
    padding: 8,
    backgroundColor: `${colors.primary}15`,
    borderRadius: 20,
  },
  favoriteButton: {
    padding: 8,
    backgroundColor: `${colors.primary}15`,
    borderRadius: 20,
  },
  artworkContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 40,
    borderRadius: 24,
    padding: 3, // For gradient border
    backgroundColor: `${colors.primary}10`,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  artwork: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  artist: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.secondary,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBarWrapper: {
    paddingVertical: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: `${colors.primary}20`,
    borderRadius: 2,
    marginBottom: 8,
    position: 'relative',
  },
  progress: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    position: 'absolute',
    top: -7,
    transform: [{translateX: -9}],
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  progressDragging: {
    backgroundColor: colors.primary,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontVariant: ['tabular-nums'],
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    gap: 24,
  },
  playPauseButton: {
    width: 80,
    height: 80,
    backgroundColor: colors.primary,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  playPauseIcon: {
    marginLeft: 3,
  },
  skipButton: {
    width: 64,
    height: 64,
    backgroundColor: `${colors.primary}15`,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonDisabled: {
    backgroundColor: `${colors.text.disabled}15`,
    opacity: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PlayerScreen;
