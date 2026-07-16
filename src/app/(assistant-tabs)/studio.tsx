import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from '../../components/Typography';
import { colors } from '../../theme/colors';

export default function AssistantStudios() {
  return (
    <View style={styles.container}>
      <Typography variant="h1">Xưởng của tôi</Typography>
      <Typography variant="body" color={colors.textSecondary}>
        Danh sách các Studio mà bạn đang hợp tác.
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24, justifyContent: 'center', alignItems: 'center' },
});
