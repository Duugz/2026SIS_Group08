import type { RefObject } from 'react';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

import type { ShareCardData, SystemShareResult } from './sharing';

// Native: capture the on-screen <ShareCard> as a story-sized PNG
// and hand it to the share sheet (Instagram Stories, Snapchat, etc.).
export async function shareImageCard(
  card: ShareCardData,
  viewRef: RefObject<View | null>
): Promise<SystemShareResult> {
  if (!viewRef.current) {
    throw new Error('The image card isn’t ready yet.');
  }

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing images isn’t available on this device.');
  }

  const uri = await captureRef(viewRef, {
    format: 'png',
    quality: 1,
    width: 1080,
    height: 1920,
  });

  await Sharing.shareAsync(uri, {
    mimeType: 'image/png',
    UTI: 'public.png',
    dialogTitle: card.spotName,
  });

  return 'shared';
}
