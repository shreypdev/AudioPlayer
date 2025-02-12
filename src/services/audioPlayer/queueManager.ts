import TrackPlayer, {Event} from 'react-native-track-player';
import {Track} from '../../types';

interface QueueOptions {
  updateUI?: boolean;
}

class QueueManager {
  private currentQueue: Track[] = [];
  private currentIndex: number = -1;
  private isUpdating: boolean = false;

  constructor() {
    try {
      TrackPlayer.addEventListener(Event.PlaybackTrackChanged, event => {
        if (event.nextTrack !== undefined && event.nextTrack !== null) {
          this.currentIndex = event.nextTrack;
        }
      });
    } catch (error) {
      console.error('Error setting up queue manager:', error);
    }
  }

  async initializeQueue(
    tracks: Track[],
    initialIndex: number,
    options: QueueOptions = {updateUI: true},
  ) {
    if (this.isUpdating) {return;}
    this.isUpdating = true;

    try {
      if (!tracks || tracks.length === 0) {
        console.error('No tracks provided to initialize queue');
        return;
      }

      this.currentQueue = tracks;
      this.currentIndex = initialIndex;

      await TrackPlayer.reset();
      await TrackPlayer.add(
        tracks.map(track => ({
          id: track.id,
          url: track.url,
          title: track.title,
          artist: track.artist,
          artwork: track.artwork,
        })),
      );

      if (initialIndex > 0) {
        await TrackPlayer.skip(initialIndex);
      }
      await TrackPlayer.play();

      if (options.updateUI) {
        // Only update UI if explicitly requested
        // ... UI update logic
      }
    } catch (error) {
      console.error('Error initializing queue:', error);
      throw error;
    } finally {
      this.isUpdating = false;
    }
  }

  getCurrentTrack(): Track | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.currentQueue.length) {
      return this.currentQueue[this.currentIndex];
    }
    return null;
  }

  async skipToNext(): Promise<boolean> {
    if (this.currentIndex < this.currentQueue.length - 1) {
      this.currentIndex++;
      await TrackPlayer.seekTo(0);
      await TrackPlayer.skipToNext();
      return true;
    }
    return false;
  }

  async skipToPrevious(): Promise<boolean> {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      await TrackPlayer.seekTo(0);
      await TrackPlayer.skipToPrevious();
      return true;
    }
    return false;
  }

  getQueue(): Track[] {
    return [...this.currentQueue];
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }
}

export const queueManager = new QueueManager();
