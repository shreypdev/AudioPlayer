import React, {useMemo} from 'react';
import {StyleSheet, Animated} from 'react-native';
import {colors} from '../theme/colors';
import {hp, wp} from '../utils/wp-hp';

export const HEADER_MAX_HEIGHT = hp(130);
export const HEADER_MAX_HEIGHT_NO_SEARCH = hp(70);
const HEADER_MIN_HEIGHT = hp(100);
const HEADER_MIN_HEIGHT_NO_SEARCH = hp(50);
const TITLE_MAX_SIZE = wp(34);
const TITLE_MIN_SIZE = wp(20);

interface AnimatedHeaderProps {
  title: string;
  scrollY: Animated.Value;
  children?: React.ReactNode;
}

export const AnimatedHeader: React.FC<AnimatedHeaderProps> = ({
  title,
  scrollY,
  children,
}) => {
  const maxHeight = children ? HEADER_MAX_HEIGHT : HEADER_MAX_HEIGHT_NO_SEARCH;
  const minHeight = children ? HEADER_MIN_HEIGHT : HEADER_MIN_HEIGHT_NO_SEARCH;

  const animations = useMemo(() => {
    const headerHeight = scrollY.interpolate({
      inputRange: [0, maxHeight - minHeight],
      outputRange: [maxHeight, minHeight],
      extrapolate: 'clamp',
    });

    const titleSize = scrollY.interpolate({
      inputRange: [0, maxHeight - minHeight],
      outputRange: [TITLE_MAX_SIZE, TITLE_MIN_SIZE],
      extrapolate: 'clamp',
    });

    const titleOpacity = scrollY.interpolate({
      inputRange: [0, maxHeight - minHeight],
      outputRange: [hp(1), hp(0.8)],
      extrapolate: 'clamp',
    });

    const childrenAnimations = children
      ? {
          translateY: scrollY.interpolate({
            inputRange: [0, maxHeight - minHeight],
            outputRange: [0, -TITLE_MAX_SIZE + TITLE_MIN_SIZE + hp(12)],
            extrapolate: 'clamp',
          }),
          margin: scrollY.interpolate({
            inputRange: [0, maxHeight - minHeight],
            outputRange: [hp(8), hp(4)],
            extrapolate: 'clamp',
          }),
          padding: scrollY.interpolate({
            inputRange: [0, maxHeight - minHeight],
            outputRange: [hp(8), hp(4)],
            extrapolate: 'clamp',
          }),
        }
      : null;

    return {
      headerHeight,
      titleSize,
      titleOpacity,
      childrenAnimations,
    };
  }, [scrollY, children, maxHeight, minHeight]);

  return (
    <Animated.View style={[styles.header, {height: animations.headerHeight}]}>
      <Animated.Text
        style={[
          styles.title,
          // eslint-disable-next-line react-native/no-inline-styles
          {
            fontSize: animations.titleSize,
            opacity: animations.titleOpacity,
            marginBottom: children ? hp(4) : 0,
          },
        ]}>
        {title}
      </Animated.Text>
      {children && animations.childrenAnimations && (
        <Animated.View
          style={{
            transform: [{translateY: animations.childrenAnimations.translateY}],
            marginTop: animations.childrenAnimations.margin,
            paddingVertical: animations.childrenAnimations.padding,
          }}>
          {children}
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    backgroundColor: colors.surface,
    padding: wp(16),
    paddingBottom: hp(8),
    overflow: 'hidden',
  },
  title: {
    fontWeight: 'bold',
    color: colors.text.primary,
  },
});
