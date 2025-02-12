import {NavigationProp} from '@react-navigation/native';
import {Track} from './index';

export type RootStackParamList = {
  MainTabs: undefined;
  Player: {track: Track};
};

export type TabParamList = {
  Explore: undefined;
  Favorites: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

export type AppNavigationProp = NavigationProp<RootStackParamList>;
