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
    .map((line) => {
      if (!line) {
        return line;
      }

      // Raw ESC/POS command lines must start with control bytes, not spaces.
      if (/[\x00-\x1F]/.test(line)) {
        return line;
      }

      return `${prefix}${line}`;
    })
    .join('\n');
};

export const getEscPosEmphasizedTitle = (text: string, lineWidth: number): string => {
  const normalized = text.trim().replace(/\s+/g, ' ');
  if (!normalized) {
    return '';
  }

  const upperText = normalized.toUpperCase().replace(/[^\x20-\x7E]/g, '');
  if (!upperText) {
    return '';
  }

  const ESC = '\x1B';
  const GS = '\x1D';
  const LF = '\x0A';
  const estimatedDoubleWidthCapacity = Math.max(8, Math.floor(lineWidth / 2));
  const useDoubleSize = upperText.length <= estimatedDoubleWidthCapacity;
  const sizeMode = useDoubleSize ? '\x11' : '\x01';

  // Center the text within the line width
  const padding = Math.max(0, Math.floor((lineWidth - upperText.length) / 2));
  const centeredText = ' '.repeat(padding) + upperText;

  return `${ESC}@${ESC}a\x01${ESC}E\x01${GS}!${sizeMode}${centeredText}${LF}${GS}!\x00${ESC}E\x00${ESC}a\x00${LF}`;
};

export const getEscPosBottomFeed = (lines: number = 12): string => {
  const ESC = '\x1B';
  const GS = '\x1D';
  const safeLines = Math.max(3, Math.min(24, Math.round(lines)));
  // Feed lines then cut the paper (GS V 0 = full cut)
  return `${ESC}d${String.fromCharCode(safeLines)}${GS}V\x00`;
};

/**
 * ESC/POS center alignment command
 */
export const getEscPosAlignCenter = (): string => {
  const ESC = '\x1B';
  return `${ESC}a\x01`;
};

/**
 * ESC/POS left alignment command
 */
export const getEscPosAlignLeft = (): string => {
  const ESC = '\x1B';
  return `${ESC}a\x00`;
};

/**
 * Wrap text with center alignment ESC/POS commands.
 * This uses the printer's built-in centering which is more reliable than spaces.
 */
export const escPosCenterText = (text: string): string => {
  if (!text) return '';
  return `${getEscPosAlignCenter()}${text}${getEscPosAlignLeft()}`;
};

/**
 * Wrap text with left alignment ESC/POS commands.
 */
export const escPosLeftText = (text: string): string => {
  if (!text) return '';
  return `${getEscPosAlignLeft()}${text}`;
};

/**
 * Generate ESC/POS QR code commands for thermal printers.
 * Uses GS ( k commands to encode and print a QR code.
 * Compatible with Epson, Star, Bixolon and most ESC/POS printers.
 * @param data - The string data to encode in the QR code
 * @param moduleSize - Module size (1-16, default 6)
 * @param errorCorrection - Error correction level: 0=L, 1=M, 2=Q, 3=H (default 0=L)
 */
export const getEscPosQrCode = (data: string, moduleSize: number = 6, errorCorrection: number = 0): string => {
  if (!data) return '';

  const GS = String.fromCharCode(0x1D);
  const safeSize = Math.max(1, Math.min(16, Math.round(moduleSize)));
  // Error correction as ASCII: '0'=L(48), '1'=M(49), '2'=Q(50), '3'=H(51)
  const ecAscii = 48 + Math.max(0, Math.min(3, Math.round(errorCorrection)));

  // Convert data to bytes (UTF-8)
  const dataBytes: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const code = data.charCodeAt(i);
    if (code <= 0x7F) {
      dataBytes.push(code);
    } else if (code <= 0x7FF) {
      dataBytes.push(0xC0 | (code >> 6));
      dataBytes.push(0x80 | (code & 0x3F));
    } else {
      dataBytes.push(0xE0 | (code >> 12));
      dataBytes.push(0x80 | ((code >> 6) & 0x3F));
      dataBytes.push(0x80 | (code & 0x3F));
    }
  }

  const dataLength = dataBytes.length;

  let qr = '';

  // Step 1: Select QR code model (Model 2)
  // GS ( k 4 0 49 50
  qr += GS + '(k';
  qr += String.fromCharCode(4, 0); // pL=4, pH=0
  qr += String.fromCharCode(49, 50); // fn='1', m='2' (Model 2)

  // Step 2: Set error correction level
  // GS ( k 3 0 49 ec
  qr += GS + '(k';
  qr += String.fromCharCode(3, 0); // pL=3, pH=0
  qr += String.fromCharCode(49); // fn='1'
  qr += String.fromCharCode(ecAscii); // '0'=L, '1'=M, '2'=Q, '3'=H

  // Step 3: Set module size
  // GS ( k 3 0 50 size
  qr += GS + '(k';
  qr += String.fromCharCode(3, 0); // pL=3, pH=0
  qr += String.fromCharCode(50); // fn='2'
  qr += String.fromCharCode(safeSize); // 1-16

  // Step 4: Store QR code data
  // GS ( k pL pH 51 data... 0
  const payloadLen = dataLength + 3; // fn(1) + data(n) + terminator(1) + 1
  qr += GS + '(k';
  qr += String.fromCharCode(payloadLen & 0xFF, (payloadLen >> 8) & 0xFF); // pL, pH
  qr += String.fromCharCode(51); // fn='3'
  for (let i = 0; i < dataLength; i++) {
    qr += String.fromCharCode(dataBytes[i]);
  }
  qr += String.fromCharCode(0); // terminator

  // Step 5: Print QR code
  // GS ( k 3 0 49 3
  qr += GS + '(k';
  qr += String.fromCharCode(3, 0); // pL=3, pH=0
  qr += String.fromCharCode(49, 3); // fn='1', m=3

  // Feed lines after QR code
  qr += String.fromCharCode(0x1B, 0x64, 3); // ESC d 3 (feed 3 lines)

  return qr;
};

const escapeHtml = (value: string): string =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getBrowserPrintPageSize = (paperSize?: PaperSize): string => {
  switch (paperSize) {
    case PaperSize['58mm']:
      return '58mm auto';
    case PaperSize['80mm']:
      return '80mm auto';
    case PaperSize.A4:
      return 'A4 portrait';
    case PaperSize.Label:
      return '100mm auto';
    default:
      return '80mm auto';
  }
};

type BrowserPrintOptions = {
  title: string;
  content: string;
  paperSize?: PaperSize;
  fontSizePx?: number;
  sideMarginMm?: number;
};

export const openBrowserPrintDialog = async ({
  title,
  content,
  paperSize,
  fontSizePx = 12,
  sideMarginMm = 4,
}: BrowserPrintOptions): Promise<void> => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Browser printing is only available in the browser.');
  }

  const safeTitle = escapeHtml(title);
  const safeContent = escapeHtml(content);
  const pageSize = getBrowserPrintPageSize(paperSize);
  const safeFontSize = Math.max(10, Number(fontSizePx) || 12);
  const safeMargin = Math.max(0, Number(sideMarginMm) || 0);
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>${safeTitle}</title>
        <style>
          * { box-sizing: border-box; }
          html, body {
            margin: 0;
            padding: 0;
            background: #fff;
          }
          body {
            padding: ${safeMargin}mm;
            font-family: "Courier New", monospace;
            font-size: ${safeFontSize}px;
            line-height: 1.35;
            color: #000;
            white-space: pre-wrap;
            word-break: break-word;
          }
          pre {
            margin: 0;
            font: inherit;
            white-space: pre-wrap;
            word-break: break-word;
          }
          @page {
            margin: 0;
            size: ${pageSize};
          }
        </style>
      </head>
      <body>
        <pre>${safeContent}</pre>
      </body>
    </html>
  `;

  await new Promise<void>((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';

    const cleanup = () => {
      window.setTimeout(() => {
        iframe.remove();
      }, 1000);
    };

    iframe.onload = () => {
      const frameWindow = iframe.contentWindow;
      const frameDocument = frameWindow?.document;

      if (!frameWindow || !frameDocument) {
        cleanup();
        reject(new Error('Could not open the browser print frame.'));
        return;
      }

      frameWindow.focus();
      window.setTimeout(() => {
        try {
          frameWindow.print();
          cleanup();
          resolve();
        } catch (error) {
          cleanup();
          reject(error instanceof Error ? error : new Error('Browser print failed'));
        }
      }, 150);
    };

    document.body.appendChild(iframe);

    const frameDocument = iframe.contentWindow?.document;
    if (!frameDocument) {
      cleanup();
      reject(new Error('Could not access the browser print frame.'));
      return;
    }

    frameDocument.open();
    frameDocument.write(html);
    frameDocument.close();
  });
};
