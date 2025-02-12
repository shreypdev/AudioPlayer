import { Platform } from 'react-native';
import {
  widthPercentageToDP as wp2dp,
  heightPercentageToDP as hp2dp,
} from 'react-native-responsive-screen';

export const wireframeScreenSize = {
  width: 414,
  height: 896,
};

const getDimension = (
  defaultOrIosDimension: number,
  androidDimension?: number,
) =>
  Platform.OS === 'ios' ? defaultOrIosDimension : androidDimension || defaultOrIosDimension;

/**
 * Width-Percentage
 * Converts width dimension to percentage
 * * 414, 896 - design were made using this scale
 * @param dimension directly taken from design wireframes
 * @returns {string} percentage string e.g. '25%'
 */
export const wp = (
  defaultOrIosDimension: number,
  androidDimension?: number,
) => {
  const dimension = getDimension(defaultOrIosDimension, androidDimension);
  return wp2dp((dimension / wireframeScreenSize.width) * 100 + '%');
};

/**
 * Height-Percentage
 * Converts width dimension to percentage
 * * 414, 896 - design were made using this scale
 * @param dimension directly taken from design wireframes
 * @returns {string} percentage string e.g. '25%'
 */
export const hp = (
  defaultOrIosDimension: number,
  androidDimension?: number,
) => {
  const dimension = getDimension(defaultOrIosDimension, androidDimension);
  return hp2dp((dimension / wireframeScreenSize.height) * 100 + '%');
};