/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import TrackPlayer from 'react-native-track-player';

// Register the service before registering the app component
TrackPlayer.registerPlaybackService(() =>
  require('./src/services/audioPlayer/trackPlayerService'),
);

AppRegistry.registerComponent(appName, () => App);
