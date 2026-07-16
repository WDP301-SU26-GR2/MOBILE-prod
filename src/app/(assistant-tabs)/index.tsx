import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Typography } from '../../components/Typography';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../store/useAuthStore';
import { CheckSquare, Clock } from 'lucide-react-native';

export default function AssistantHome() {
  const { user } = useAuthStore();
  const [data, setData] = React.useState<any>(null);

  // TODO: Fetch dashboard overview from API
  React.useEffect(() => {
    // mock fetch
    // setData({});
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h1">Xin chào, {user?.name || 'Trợ lý'}</Typography>
        <Typography variant="body" color={colors.textSecondary}>Bạn đã sẵn sàng làm việc chưa?</Typography>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <CheckSquare color={colors.primary} size={24} style={{ marginBottom: 8 }} />
          <Typography variant="h2">{data?.activeTasks || 0}</Typography>
          <Typography variant="caption" color={colors.textSecondary}>Nhiệm vụ đang làm</Typography>
        </View>
        <View style={styles.statCard}>
          <Clock color={colors.warning} size={24} style={{ marginBottom: 8 }} />
          <Typography variant="h2">{data?.dueSoon || 0}</Typography>
          <Typography variant="caption" color={colors.textSecondary}>Sắp đến hạn</Typography>
        </View>
      </View>

      <View style={styles.section}>
        <Typography variant="h3" style={{ marginBottom: 12 }}>Hạn chót sắp tới</Typography>
        {data?.nearestDeadlineTitle ? (
          <View style={styles.taskCard}>
            <Typography variant="bodyBold">{data.nearestDeadlineTitle}</Typography>
            <Typography variant="body" color={colors.error}>
              Hạn: {new Date(data.nearestDeadlineDate).toLocaleDateString()}
            </Typography>
          </View>
        ) : (
          <Typography color={colors.textSecondary}>Không có hạn chót nào sắp tới.</Typography>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 24, paddingBottom: 16 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 16 },
  statCard: { flex: 1, backgroundColor: colors.surface, padding: 16, borderRadius: 12, elevation: 2 },
  section: { padding: 24 },
  taskCard: { backgroundColor: colors.surface, padding: 16, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: colors.error, elevation: 2 }
});
