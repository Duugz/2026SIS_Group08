import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import ShareCard, { CARD_ASPECT } from './ShareCard';
import { shareImageCard } from '../services/shareImage';
import type { ShareCardData } from '../services/sharing';
import { COLORS } from '../theme';

type ShareCardPreviewProps = {
  card: ShareCardData | null;
  onClose: () => void;
};

export default function ShareCardPreview({
  card,
  onClose,
}: ShareCardPreviewProps) {
  const cardRef = useRef<View>(null);
  const { width, height } = useWindowDimensions();
  const [sharing, setSharing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNotice(null);
    setError(null);
  }, [card]);

  // Fit the 9:16 card on screen, leaving room for the buttons.
  const cardWidth = Math.min(300, width - 48, (height - 200) / CARD_ASPECT);

  const handleShare = async () => {
    if (!card) {
      return;
    }

    setSharing(true);
    setNotice(null);
    setError(null);

    try {
      const result = await shareImageCard(card, cardRef);

      if (result === 'downloaded') {
        setNotice('Image saved. Post it to Instagram, TikTok or your story.');
      } else if (result === 'shared') {
        setNotice('Shared!');
      }
    } catch (shareError) {
      setError(
        shareError instanceof Error
          ? shareError.message
          : 'Couldn’t share the image.'
      );
    } finally {
      setSharing(false);
    }
  };

  return (
    <Modal
      visible={card !== null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityLabel="Close image preview"
          onPress={onClose}
        />

        {card && (
          <View style={styles.content}>
            <ShareCard ref={cardRef} card={card} width={cardWidth} />

            {notice && <Text style={styles.notice}>{notice}</Text>}
            {error && <Text style={styles.error}>{error}</Text>}

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                onPress={onClose}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.secondaryText}>Close</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: sharing }}
                disabled={sharing}
                onPress={() => {
                  void handleShare();
                }}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && !sharing && styles.pressed,
                ]}
              >
                {sharing ? (
                  <ActivityIndicator color={COLORS.textPrimary} />
                ) : (
                  <>
                    <Ionicons
                      name={
                        Platform.OS === 'web'
                          ? 'download-outline'
                          : 'share-outline'
                      }
                      size={16}
                      color={COLORS.textPrimary}
                    />

                    <Text style={styles.primaryText}>
                      {Platform.OS === 'web' ? 'Share / save image' : 'Share image'}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  content: {
    alignItems: 'center',
    gap: 14,
  },
  notice: {
    maxWidth: 300,
    textAlign: 'center',
    color: COLORS.green,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  error: {
    maxWidth: 300,
    textAlign: 'center',
    color: COLORS.pink,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    minHeight: 44,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  secondaryText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
  },
  primaryButton: {
    minHeight: 44,
    minWidth: 150,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    backgroundColor: COLORS.purple,
  },
  primaryText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  pressed: {
    opacity: 0.75,
  },
});
