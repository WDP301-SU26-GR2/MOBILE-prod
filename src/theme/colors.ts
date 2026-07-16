const light = {
  primary: '#2E90FA',
  secondary: '#667085',
  tertiary: '#7F56D9',
  neutral: '#101828',
  background: '#FFFFFF',
  surface: '#F9FAFB',
  text: '#101828',
  textSecondary: '#667085',
  border: '#E4E7EC',
  error: '#F04438',
  success: '#12B76A',
  warning: '#F79009',
};

const dark = {
  primary: '#2E90FA',
  secondary: '#98A2B3',
  tertiary: '#9E77ED',
  neutral: '#F2F4F7',
  background: '#101828',
  surface: '#1D2939',
  text: '#F9FAFB',
  textSecondary: '#98A2B3',
  border: '#344054',
  error: '#FDA29B',
  success: '#12B76A',
  warning: '#F79009',
};

export const colors = {
  light,
  dark,
  // Default static fallback (Dark mode) for StyleSheet.create compatibility
  ...dark
};
