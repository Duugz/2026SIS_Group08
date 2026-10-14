import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  type ShareCardData,
  type ShareContent,
  shareToNetwork,
  shareWithSystemSheet,
  type SocialNetwork,
} from '../services/sharing';
import { COLORS } from '../theme';

type ShareButtonsProps = {
  content: ShareContent;
  onShareImage: (card: ShareCardData) => void;
  compact?: boolean;
};

const SOCIAL_BUTTONS: {
  network: SocialNetwork;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { network: 'x', label: 'X', icon: 'logo-twitter' },
  { network: 'facebook', label: 'Facebook', icon: 'logo-facebook' },
  { network: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp' },
];

export default function ShareButtons({
  content,
  onShareImage,
  compact = false,
}: ShareButtonsProps) {
  const [notice, setNotice] = useState<string | null>(null);

  const handleSocialShare = (network: SocialNetwork) => {
    setNotice(null);
    shareToNetwork(network, content).catch(() => {
      setNotice('Couldn’t open that app.');
    });
  };

  const handleSystemShare = async () => {
    setNotice(null);

    try {
      const result = await shareWithSystemSheet(content);

      if (result === 'copied') {
        setNotice('Link copied to clipboard.');
      }
    } catch {
      setNotice('Sharing isn’t available here.');
    }
  };

  const buttons: {
    key: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  }[] = [
    ...SOCIAL_BUTTONS.map((button) => ({
      key: button.network,
      label: button.label,
      icon: button.icon,
      onPress: () => handleSocialShare(button.network),
    })),
    {
      key: 'image',
      label: 'Image',
      icon: 'image-outline',
      onPress: () => onShareImage(content.card),
    },
    {
      key: 'more',
      label: 'More',
      icon: 'share-social-outline',
      onPress: () => {
        void handleSystemShare();
      },
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {buttons.map((button) => (
          <Pressable
            key={button.key}
            accessibilityRole="button"
            accessibilityLabel={
              button.key === 'image'
                ? 'Share as image'
                : button.key === 'more'
                  ? 'More sharing options'
                  : `Share on ${button.label}`
            }
            onPress={button.onPress}
            style={({ pressed }) => [
              styles.button,
              compact && styles.buttonCompact,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name={button.icon}
              size={compact ? 14 : 18}
              color={COLORS.textPrimary}
            />

            {!compact && <Text style={styles.label}>{button.label}</Text>}
          </Pressable>
        ))}
      </View>

      {notice && <Text style={styles.notice}>{notice}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  buttonCompact: {
    minHeight: 30,
    width: 30,
    paddingHorizontal: 0,
    justifyContent: 'center',
    borderRadius: 10,
  },
  label: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  notice: {
    color: COLORS.green,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  pressed: {
    opacity: 0.75,
  },
});
