import { PaperSize } from '../types';

export type DividerStyle = 'solid' | 'dashed';

type PaperSizeConfig = {
  recommendedCharsPerLine: number;
  minCharsPerLine: number;
  maxCharsPerLine: number;
  receiptLineWidth: number;
};

const PAPER_SIZE_CONFIG: Record<PaperSize, PaperSizeConfig> = {
  [PaperSize['58mm']]: {
    recommendedCharsPerLine: 32,
    minCharsPerLine: 24,
    maxCharsPerLine: 32,
    receiptLineWidth: 32,
  },
  [PaperSize['80mm']]: {
    recommendedCharsPerLine: 48,
    minCharsPerLine: 32,
    maxCharsPerLine: 48,
    receiptLineWidth: 40,
  },
  [PaperSize.A4]: {
    recommendedCharsPerLine: 80,
    minCharsPerLine: 48,
    maxCharsPerLine: 80,
    receiptLineWidth: 80,
  },
  [PaperSize.Label]: {
    recommendedCharsPerLine: 30,
    minCharsPerLine: 20,
    maxCharsPerLine: 32,
    receiptLineWidth: 30,
  },
};

export const getPaperSizeConfig = (paperSize?: PaperSize): PaperSizeConfig => {
  return PAPER_SIZE_CONFIG[paperSize || PaperSize['80mm']];
};

export const clampCharsPerLine = (value: number | undefined, paperSize?: PaperSize): number => {
  const { minCharsPerLine, maxCharsPerLine, recommendedCharsPerLine } = getPaperSizeConfig(paperSize);
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return recommendedCharsPerLine;
  }

  return Math.min(maxCharsPerLine, Math.max(minCharsPerLine, Math.round(parsedValue)));
};

export const getReceiptLineWidth = (paperSize?: PaperSize): number => {
  return getPaperSizeConfig(paperSize).receiptLineWidth;
};

export const getConfiguredLineWidth = (paperSize: PaperSize | undefined, charsPerLine: number | undefined): number => {
  return clampCharsPerLine(charsPerLine, paperSize);
};

export const getDividerLine = (lineWidth: number, style: DividerStyle = 'dashed'): string => {
  const dividerChar = style === 'solid' ? '=' : '-';
  return dividerChar.repeat(Math.max(1, lineWidth));
};

export const getMarginSpaces = (marginMm: number | undefined): number => {
  const parsedMargin = Number(marginMm);
  if (!Number.isFinite(parsedMargin) || parsedMargin <= 0) {
    return 0;
  }

  return Math.max(0, Math.round(parsedMargin / 2));
};

export const applyLeftMarginToText = (text: string, marginSpaces: number): string => {
  if (marginSpaces <= 0) {
    return text;
  }

  const prefix = ' '.repeat(marginSpaces);
  return text
    .split('\n')
    .map((line) => (line ? `${prefix}${line}` : line))
    .join('\n');
};

export const getEscPosEmphasizedTitle = (text: string, lineWidth: number): string => {
  const normalized = text.trim().replace(/\s+/g, ' ');
  if (!normalized) {
    return '';
  }

  const upperText = normalized.toUpperCase();
  const ESC = '\x1B';
  const GS = '\x1D';
  const estimatedDoubleWidthCapacity = Math.max(8, Math.floor(lineWidth / 2));
  const useDoubleSize = upperText.length <= estimatedDoubleWidthCapacity;
  const sizeMode = useDoubleSize ? '\x11' : '\x01';

  return `${ESC}a\x01${ESC}E\x01${GS}!${sizeMode}${upperText}\n${GS}!\x00${ESC}E\x00${ESC}a\x00\n`;
};

export const getEscPosBottomFeed = (lines: number = 12): string => {
  const ESC = '\x1B';
  const safeLines = Math.max(3, Math.min(24, Math.round(lines)));
  return `${ESC}d${String.fromCharCode(safeLines)}`;
};
