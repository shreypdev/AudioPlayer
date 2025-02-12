# React Native Audio Player

A feature-rich audio player application built with React Native that allows users to explore music, manage favorites, and control playback across both iOS and Android platforms.

<p float="left">
  <img src="https://github.com/user-attachments/assets/754e752b-8a4a-46a9-a90d-58536ae01c42" width="200" alt="Explore Screen" />
  <img src="https://github.com/user-attachments/assets/9a6af3d8-6a5c-4c8d-855d-ed7a870da1bf" width="200" alt="Player Screen" />
</p>

## Features

- 🎵 Audio playback with essential controls (play, pause, next, previous, seek)
- 📱 Cross-platform compatibility (iOS & Android)
- 📑 Multiple views (Explore, Favorites, Player)
- ❤️ Favorite tracks management with persistent storage
- 🎯 Real-time track progress and duration display
- 📋 Music discovery through TheAudioDB API
- 🔄 Background audio playback support
- 👆 Interactive gesture controls:
  - Swipe left/right to change tracks
  - Swipe up/down to manage volume
  - Double tap to favorite/unfavorite

## Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

## Key Technical Challenges

### Gesture Implementation
- Implemented swipe gestures for track management using React Native Gesture Handler
- Added smooth animations for swipe-to-favorite functionality
- Created intuitive gesture feedback with haptics and visual cues

### TrackPlayer Integration
- Set up background playback capabilities
- Managed complex audio states and transitions
- Implemented queue management for seamless playback
- Handled audio interruptions (calls, notifications)

### Key Architecture Decisions
- Added wp/hp util to handle responsive design
- Centralized state management using Context API for player controls
- Implemented custom hooks for audio player functionality
- Used TypeScript for enhanced type safety and development experience
- Modular component architecture for better maintainability
- Efficient caching strategy for audio files and metadata

## Improvement Scope
Limited myself to 6 hours, so there are a few things that can be improved:
- Infinite scroll for the explore view
- Swipe down gesture to close the mini player
- Handle tap on seeker to skip to that time, right now you have to swipe seeker
- design poslishing is required on android (shadows)
