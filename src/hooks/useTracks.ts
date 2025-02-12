import { useContext } from 'react';
import { TracksContext } from '../contexts/TracksContext';

export const useTracks = () => {
  const context = useContext(TracksContext);
  if (!context) {
    throw new Error('useTracks must be used within a TracksProvider');
  }
  return context;
};
