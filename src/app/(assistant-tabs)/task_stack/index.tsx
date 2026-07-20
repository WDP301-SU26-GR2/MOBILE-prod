import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Typography } from '../../../components/Typography';
import { colors } from '../../../theme/colors';

export default function AssistantTasks() {
  const router = useRouter();
  const [tasks, setTasks] = React.useState<any[]>([]);

  // TODO: fetch tasks from API
  React.useEffect(() => {
    // mock fetch
    // setTasks([]);
  }, []);

  const renderTask = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push(`/(assistant-tabs)/task_stack/${item.id}`)}
    >
      <View style={{ flex: 1 }}>
        <Typography variant="bodyBold">{item.title}</Typography>
        <Typography variant="caption" color={colors.textSecondary}>Mangaka: {item.mangaka}</Typography>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <View style={styles.badge}>
          <Typography variant="caption" color="#fff">{item.status}</Typography>
        </View>
        <Typography variant="caption" color={colors.error} style={{ marginTop: 4 }}>Hạn: {item.deadline}</Typography>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h1">Nhiệm vụ của tôi</Typography>
      </View>
      <FlatList
        data={tasks}
        keyExtractor={item => item.id}
        renderItem={renderTask}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Typography align="center" color={colors.textSecondary}>
            Không có nhiệm vụ nào.
          </Typography>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 16 },
  list: { padding: 16, gap: 16 },
  card: { flexDirection: 'row', backgroundColor: colors.surface, padding: 16, borderRadius: 12, elevation: 2, alignItems: 'center' },
  badge: { backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }
});
