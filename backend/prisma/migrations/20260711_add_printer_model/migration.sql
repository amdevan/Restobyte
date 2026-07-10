-- CreateTable
CREATE TABLE "Printer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Receipt',
    "interfaceType" TEXT NOT NULL DEFAULT 'Network (IP/Ethernet)',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "ipAddress" TEXT,
    "port" TEXT,
    "usbPath" TEXT,
    "bluetoothMac" TEXT,
    "serialPort" TEXT,
    "baudRate" INTEGER,
    "paperSize" TEXT DEFAULT '80mm',
    "printerModel" TEXT,
    "timeoutMs" INTEGER DEFAULT 5000,
    "retries" INTEGER DEFAULT 3,
    "autoPrintReceipt" BOOLEAN NOT NULL DEFAULT false,
    "autoPrintKOT" BOOLEAN NOT NULL DEFAULT false,
    "autoPrintLabel" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "outletId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Printer_pkey" PRIMARY KEY ("id")
);
