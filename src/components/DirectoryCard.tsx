import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { colors } from '../theme/colors';
import { Typography } from './Typography';
import { Star, CheckCircle } from 'lucide-react-native';

interface DirectoryCardProps {
  name: string;
  avatar?: string;
  roles: string[];
  reputationScore?: number;
  ratingAvg?: number;
  ratingCount?: number;
  isRecommended?: boolean;
  availability?: string;
  onPress?: () => void;
  onInvitePress?: () => void;
}

export const DirectoryCard: React.FC<DirectoryCardProps> = ({
  name,
  avatar,
  roles,
  reputationScore = 0,
  ratingAvg,
  ratingCount = 0,
  isRecommended,
  availability,
  onPress,
  onInvitePress,
}) => {
  const { theme } = useThemeStore();
  const currentColors = colors[theme];

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.card, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}
    >
      <View style={styles.header}>
        <View style={[styles.avatarPlaceholder, { backgroundColor: currentColors.border }]}>
          {/* Implement actual Image component here when backend avatar works */}
          <Typography variant="bodyBold" font="bodyBold" color={currentColors.textSecondary}>
            {name.charAt(0).toUpperCase()}
          </Typography>
        </View>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Typography variant="h3" font="headline" style={styles.nameText}>
              {name}
            </Typography>
            {isRecommended && <CheckCircle size={16} color={currentColors.primary} style={styles.verifiedIcon} />}
          </View>
          <Typography variant="bodySmall" color={currentColors.textSecondary}>
            {roles.join(' • ')}
          </Typography>
        </View>
      </View>
      <View style={styles.footer}>
        <View style={styles.rating}>
          <Star size={16} color="#FDB022" fill="#FDB022" />
          <Typography variant="bodyMedium" font="bodyMedium" style={styles.ratingText}>
            {ratingAvg ? ratingAvg.toFixed(1) : 'N/A'}
          </Typography>
          <Typography variant="bodySmall" color={currentColors.textSecondary}>
            ({ratingCount}) • Uy tín: {reputationScore}
          </Typography>
        </View>
        <View style={styles.rightFooter}>
          {availability && (
            <View style={[styles.badge, { backgroundColor: availability === 'AVAILABLE' ? '#ECFDF3' : currentColors.border }]}>
              <Typography
                variant="label"
                font="label"
                color={availability === 'AVAILABLE' ? '#027A48' : currentColors.textSecondary}
              >
                {availability}
              </Typography>
            </View>
          )}
          {onInvitePress && (
            <TouchableOpacity 
              style={[styles.inviteBtn, { backgroundColor: currentColors.primary }]}
              onPress={onInvitePress}
            >
              <Typography variant="label" font="label" color="#fff">Invite</Typography>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameText: {
    marginRight: 6,
  },
  verifiedIcon: {
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    marginRight: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  rightFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inviteBtn: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  }
});
