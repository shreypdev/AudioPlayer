import axios from 'axios';
import { Track } from '../../types';

const BASE_URL = 'https://api.deezer.com';

// Helper function to get a random placeholder image
const getPlaceholderImage = (index: number) =>
  `https://picsum.photos/seed/${index}/300/300`;

// Fallback tracks in case the API fails
const fallbackTracks: Track[] = [
  {
    id: '1',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    artwork: getPlaceholderImage(1),
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: 367,
  },
  {
    id: '2',
    title: 'Stairway to Heaven',
    artist: 'Led Zeppelin',
    artwork: getPlaceholderImage(2),
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    duration: 482,
  },
  {
    id: '3',
    title: 'Hotel California',
    artist: 'Eagles',
    artwork: getPlaceholderImage(3),
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    duration: 391,
  },
  {
    id: '4',
    title: 'Sweet Child O Mine',
    artist: 'Guns N Roses',
    artwork: getPlaceholderImage(4),
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    duration: 356,
  },
  {
    id: '5',
    title: 'Smells Like Teen Spirit',
    artist: 'Nirvana',
    artwork: getPlaceholderImage(5),
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    duration: 301,
  },
];

export const audioApi = {
  async searchTracks(query: string): Promise<Track[]> {
    try {
      const response = await axios.get(
        `${BASE_URL}/search?q=${encodeURIComponent(query)}`,
      );

      if (!response.data.data || response.data.data.length === 0) {
        console.log('No tracks found, using fallback tracks');
        return fallbackTracks;
      }

      return response.data.data.slice(0, 10).map((item: any) => ({
        id: String(item.id),
        title: item.title,
        artist: item.artist.name,
        artwork: item.album.cover_big || item.artist.picture_big || getPlaceholderImage(item.id),
        // For preview, Deezer provides a 30-second preview URL
        url: item.preview || `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${(item.id % 5) + 1}.mp3`,
        duration: item.duration,
      }));
    } catch (error) {
      console.error('Error fetching tracks:', error);
      return fallbackTracks;
    }
  },

  async getTrendingTracks(): Promise<Track[]> {
    try {
      const response = await axios.get(`${BASE_URL}/chart/0/tracks`);

      if (!response.data.data || response.data.data.length === 0) {
        console.log('No trending tracks found, using fallback tracks');
        return fallbackTracks;
      }

      return response.data.data.slice(0, 10).map((item: any) => ({
        id: String(item.id),
        title: item.title,
        artist: item.artist.name,
        artwork: item.album.cover_big || item.artist.picture_big || getPlaceholderImage(item.id),
        url: item.preview || `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${(item.id % 5) + 1}.mp3`,
        duration: item.duration,
      }));
    } catch (error) {
      console.error('Error fetching trending tracks:', error);
      return fallbackTracks;
    }
  },

  async getTrackDetails(trackId: string): Promise<Track | null> {
    try {
      const response = await axios.get(`${BASE_URL}/track/${trackId}`);

      if (!response.data) {
        return null;
      }

      const item = response.data;
      return {
        id: String(item.id),
        title: item.title,
        artist: item.artist.name,
        artwork: item.album.cover_big || item.artist.picture_big || getPlaceholderImage(item.id),
        url: item.preview || `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${(item.id % 5) + 1}.mp3`,
        duration: item.duration,
      };
    } catch (error) {
      console.error('Error fetching track details:', error);
      return null;
    }
  },
};
