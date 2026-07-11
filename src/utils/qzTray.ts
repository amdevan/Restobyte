import qz from 'qz-tray';

let isConfigured = false;

const configureQz = () => {
  if (isConfigured) {
    return;
  }

  qz.api.setPromiseType((resolver) => new Promise(resolver));
  qz.security.setCertificatePromise(() => Promise.resolve(''));
  qz.security.setSignaturePromise(() => Promise.resolve(''));
  isConfigured = true;
};

const ensureConnected = async () => {
  configureQz();

  if (qz.websocket.isActive()) {
    return;
  }

  await qz.websocket.connect();
};

export const detectQzTrayPrinters = async (): Promise<string[]> => {
  await ensureConnected();
  const printers = await qz.printers.find();
  return Array.isArray(printers) ? printers : [];
};

export const printRawViaQzTray = async (printerName: string, content: string): Promise<void> => {
  const normalizedPrinterName = printerName.trim();
  if (!normalizedPrinterName) {
    throw new Error('QZ Tray printer name is required.');
  }

  await ensureConnected();

  const config = qz.configs.create(normalizedPrinterName, {
    encoding: 'ISO-8859-1',
    copies: 1,
    altPrinting: false,
    jobName: 'RestoByte Print Job',
  });

  await qz.print(config, [
    {
      type: 'raw',
      format: 'command',
      flavor: 'plain',
      data: content,
    },
  ]);
};
