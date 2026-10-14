import type { RefObject } from 'react';
import type { View } from 'react-native';

import { COLORS } from '../theme';
import type { ShareCardData, SystemShareResult } from './sharing';

const WIDTH = 1080;
const HEIGHT = 1920;
// Matches the 360px base layout in components/ShareCard.tsx.
const S = WIDTH / 360;

function font(weight: 400 | 500 | 600 | 700, size: number): string {
  const family = {
    400: 'Poppins_400Regular',
    500: 'Poppins_500Medium',
    600: 'Poppins_600SemiBold',
    700: 'Poppins_700Bold',
  }[weight];

  return `${weight} ${size * S}px ${family}, sans-serif`;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;

    if (ctx.measureText(candidate).width <= maxWidth || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }

  if (line) {
    lines.push(line);
  }

  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    let last = kept[maxLines - 1];

    while (last && ctx.measureText(`${last}…`).width > maxWidth) {
      last = last.slice(0, -1);
    }

    kept[maxLines - 1] = `${last.trimEnd()}…`;
    return kept;
  }

  return lines;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function starPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outer: number
) {
  const inner = outer * 0.45;

  ctx.beginPath();

  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;

    ctx.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
  }

  ctx.closePath();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  fill: number
) {
  const outer = size / 2;

  starPath(ctx, cx, cy, outer);
  ctx.lineWidth = 2 * S * 0.6;
  ctx.strokeStyle = fill > 0 ? COLORS.amber : COLORS.textSecondary;
  ctx.stroke();

  if (fill <= 0) {
    return;
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(cx - outer, cy - outer, size * fill, size);
  ctx.clip();
  starPath(ctx, cx, cy, outer);
  ctx.fillStyle = COLORS.amber;
  ctx.fill();
  ctx.restore();
}

export async function drawShareCard(card: ShareCardData): Promise<Blob> {
  // Make sure the app fonts are ready before drawing text.
  await document.fonts?.ready;

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Your browser can’t create images.');
  }

  ctx.fillStyle = '#150E24';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Purple glow in the top-right corner.
  ctx.fillStyle = `${COLORS.purple}40`;
  ctx.beginPath();
  ctx.arc(WIDTH + (120 - 160) * S, (-120 + 160) * S, 160 * S, 0, Math.PI * 2);
  ctx.fill();

  const pad = 24 * S;
  ctx.textBaseline = 'top';

  ctx.fillStyle = COLORS.purple;
  ctx.font = font(700, 18);
  ctx.fillText('⚡ StudySpot', pad, pad + 20 * S);

  // Measure the panel contents first so the panel fits them.
  const panelX = pad;
  const panelY = pad + 20 * S + 27 * S + 64 * S;
  const panelW = WIDTH - pad * 2;
  const inner = 22 * S;
  const textW = panelW - inner * 2;
  const gap = 12 * S;

  ctx.font = font(700, 28);
  const nameLines = wrapText(ctx, card.spotName, textW, 3);

  ctx.font = font(400, 15);
  const quoteLines = card.quote
    ? wrapText(ctx, `“${card.quote}”`, textW, 6)
    : [];

  let contentH =
    15 * S + gap + nameLines.length * 34 * S + gap + 24 * S + gap + 8 * S + 18 * S;

  if (quoteLines.length > 0) {
    contentH += 8 * S + quoteLines.length * 22 * S;

    if (card.quoteAuthor) {
      contentH += 8 * S + 20 * S;
    }

    contentH += gap;
  }

  const panelH = contentH + inner * 2;

  roundRect(ctx, panelX, panelY, panelW, panelH, 20 * S);
  ctx.fillStyle = COLORS.surface;
  ctx.fill();
  ctx.lineWidth = S;
  ctx.strokeStyle = COLORS.border;
  ctx.stroke();

  let y = panelY + inner;
  const x = panelX + inner;

  ctx.fillStyle = COLORS.textSecondary;
  ctx.font = font(600, 10);
  if ('letterSpacing' in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${2 * S}px`;
  }
  ctx.fillText('STUDY SPOT', x, y);
  if ('letterSpacing' in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '0px';
  }
  y += 15 * S + gap;

  ctx.fillStyle = COLORS.textPrimary;
  ctx.font = font(700, 28);
  for (const line of nameLines) {
    ctx.fillText(line, x, y);
    y += 34 * S;
  }
  y += gap;

  const starSize = 24 * S;
  const rating = card.rating ?? 0;
  for (let i = 0; i < 5; i += 1) {
    const fill = Math.max(0, Math.min(1, rating - i));
    // Round to halves, like the on-screen stars.
    const shown = fill >= 1 ? 1 : fill >= 0.5 ? 0.5 : 0;

    drawStar(
      ctx,
      x + starSize / 2 + i * (starSize + 4 * S),
      y + starSize / 2,
      starSize * 0.9,
      shown
    );
  }

  ctx.fillStyle = COLORS.textSecondary;
  ctx.font = font(500, 14);
  ctx.textBaseline = 'middle';
  ctx.fillText(
    card.ratingLabel,
    x + 5 * (starSize + 4 * S) + 2 * S,
    y + starSize / 2
  );
  ctx.textBaseline = 'top';
  y += starSize + gap;

  if (quoteLines.length > 0) {
    y += 8 * S;
    ctx.fillStyle = COLORS.textPrimary;
    ctx.font = font(400, 15);
    for (const line of quoteLines) {
      ctx.fillText(line, x, y);
      y += 22 * S;
    }

    if (card.quoteAuthor) {
      y += 8 * S;
      ctx.fillStyle = COLORS.purple;
      ctx.font = font(600, 13);
      ctx.fillText(`— ${card.quoteAuthor}`, x, y);
      y += 20 * S;
    }

    y += gap;
  }

  y += 8 * S;
  ctx.fillStyle = COLORS.textSecondary;
  ctx.font = font(400, 12);
  ctx.fillText(card.details, x, y);

  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.textPrimary;
  ctx.font = font(600, 16);
  ctx.fillText('Find your next study spot', WIDTH / 2, HEIGHT * 0.92 - 46 * S);
  ctx.fillStyle = COLORS.purple;
  ctx.font = font(600, 14);
  ctx.fillText('on StudySpot', WIDTH / 2, HEIGHT * 0.92 - 22 * S);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Couldn’t create the image.'));
      }
    }, 'image/png');
  });
}

function getFileName(card: ShareCardData): string {
  const slug = card.spotName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return `studyspot-${slug || 'card'}.png`;
}

// Web: share the PNG with the Web Share API where the browser
// supports files (most phones), otherwise download it.
export async function shareImageCard(
  card: ShareCardData,
  _viewRef: RefObject<View | null>
): Promise<SystemShareResult> {
  const blob = await drawShareCard(card);
  const file = new File([blob], getFileName(card), { type: 'image/png' });

  if (
    typeof navigator.share === 'function' &&
    navigator.canShare?.({ files: [file] })
  ) {
    try {
      await navigator.share({ files: [file], title: card.spotName });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'dismissed';
      }
      // Fall through to downloading if sharing failed.
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return 'downloaded';
}
