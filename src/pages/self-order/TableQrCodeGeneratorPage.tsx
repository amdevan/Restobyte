import React, { useState, useEffect, useMemo, useRef } from 'react';
import QRCode from 'qrcode';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { Table } from '@/types';
import Spinner from '@/components/common/Spinner';
import Modal from '@/components/common/Modal';
import { FiPrinter, FiDownload, FiGrid, FiMapPin, FiPackage, FiCheck, FiUsers } from 'react-icons/fi';

// ── Color Themes ──
const QR_THEMES = [
  { id: 'classic', label: 'Classic', fg: '#1a1a1a', bg: '#faf8f5' },
  { id: 'navy', label: 'Navy', fg: '#1e3a5f', bg: '#faf8f5' },
  { id: 'forest', label: 'Forest', fg: '#2d4a3e', bg: '#faf8f5' },
  { id: 'burgundy', label: 'Burgundy', fg: '#6b2737', bg: '#faf8f5' },
  { id: 'charcoal', label: 'Charcoal', fg: '#ffffff', bg: '#2c2c2c' },
];

// ── Branded QR Card Component ──
const BrandedQrCard: React.FC<{
  table: Table;
  qrCodeUrl: string;
  theme: typeof QR_THEMES[number];
  restaurantName: string;
  logoUrl?: string;
  tagline?: string;
}> = ({ table, qrCodeUrl, theme, restaurantName, logoUrl, tagline }) => {
  const isDark = theme.id === 'charcoal';

  return (
    <div className="w-[320px] mx-auto">
      <div
        className="rounded-[2rem] border-[3px] border-gray-700 overflow-hidden"
        style={{ background: isDark ? '#2c2c2c' : '#faf8f5', boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}
      >
        {/* Content */}
        <div className="flex flex-col items-center px-6 pt-6 pb-2">
          {/* Logo */}
          {logoUrl ? (
            <img src={logoUrl} alt={restaurantName} className="h-12 max-w-[160px] object-contain mb-2" />
          ) : (
            <span className="text-3xl mb-2">🍽️</span>
          )}

          {/* Restaurant Name */}
          <h2
            className="text-center text-lg leading-snug"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, color: isDark ? '#f5f0e8' : '#1a1a1a' }}
          >
            {restaurantName}
          </h2>

          {/* Tagline */}
          {tagline && (
            <p
              className="text-center text-[9px] tracking-[0.15em] uppercase mt-0.5"
              style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, color: isDark ? '#777' : '#aaa' }}
            >
              {tagline}
            </p>
          )}
        </div>

        {/* Table Info Row */}
        <div className="px-6 pb-2">
          <div className="w-full h-px" style={{ background: isDark ? '#333' : '#e0dcd6' }} />
        </div>
        <div className="px-6 flex items-end justify-between mb-3">
          <div>
            <p className="text-[9px] tracking-[0.2em] uppercase" style={{ fontFamily: "'Inter', sans-serif", color: isDark ? '#666' : '#aaa' }}>
              TABLE
            </p>
            <p
              className="text-[36px] leading-none font-black"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", color: isDark ? '#f5f0e8' : '#1a1a1a' }}
            >
              T{String(table.name).replace(/^T/i, '')}
            </p>
          </div>
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-medium mb-1"
            style={{ background: isDark ? '#333' : '#f3f4f6', color: isDark ? '#aaa' : '#555' }}
          >
            <FiUsers size={10} /> Seats {table.capacity}
          </span>
        </div>

        {/* QR Code */}
        <div className="relative w-[200px] h-[200px] mx-auto mb-3">
          {/* Corner brackets */}
          <svg className="absolute -top-1 -left-1 w-6 h-6" viewBox="0 0 24 24" fill="none">
            <path d="M2 9V4a2 2 0 012-2h5" stroke="#3b5998" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <svg className="absolute -top-1 -right-1 w-6 h-6" viewBox="0 0 24 24" fill="none">
            <path d="M22 9V4a2 2 0 00-2-2h-5" stroke="#3b5998" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <svg className="absolute -bottom-1 -left-1 w-6 h-6" viewBox="0 0 24 24" fill="none">
            <path d="M2 15v5a2 2 0 002 2h5" stroke="#3b5998" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <svg className="absolute -bottom-1 -right-1 w-6 h-6" viewBox="0 0 24 24" fill="none">
            <path d="M22 15v5a2 2 0 01-2 2h-5" stroke="#3b5998" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="w-full h-full flex items-center justify-center p-1.5">
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt={`QR for Table ${table.name}`} className="w-full h-full object-contain rounded-lg" />
            ) : (
              <Spinner />
            )}
          </div>
        </div>

        {/* Scan text */}
        <p
          className="text-[12px] text-center mb-3"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", color: isDark ? '#888' : '#555' }}
        >
          Scan to view menu &amp; order
        </p>

        {/* Footer */}
        <div
          className="w-full flex items-center justify-center gap-1.5 py-2.5"
          style={{ borderTop: `1px solid ${isDark ? '#333' : '#e0dcd6'}` }}
        >
          <span className="text-[9px]" style={{ color: isDark ? '#555' : '#bbb' }}>Powered by</span>
          <img src="/fevicon.png" alt="" className="w-3.5 h-3.5 object-contain" />
          <span className="text-[9px] font-semibold" style={{ color: isDark ? '#777' : '#aaa' }}>RestoByte</span>
        </div>
      </div>
    </div>
  );
};

// ── Print Preview Modal ──
const PrintPreviewModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  tables: Table[];
  qrCodes: Record<string, string>;
  restaurantName: string;
  areasMap: Record<string, string>;
}> = ({ isOpen, onClose, tables, qrCodes, restaurantName, areasMap }) => {
  const printContentRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const contentNode = printContentRef.current;
    if (contentNode) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`<html><head><title>Print QR - ${restaurantName}</title>`);
        const style = printWindow.document.createElement('style');
        style.textContent = `
          @page { size: A4; margin: 10mm; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Georgia', serif; background: #fff; }
          .page { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: repeat(3, 1fr); gap: 6mm; width: 190mm; height: 277mm; page-break-after: always; }
          .page:last-child { page-break-after: auto; }
          .label { border: 4px solid #2c2c2c; border-radius: 24px; background: #faf8f5; padding: 5mm; display: flex; flex-direction: column; justify-content: space-between; height: 100%; }
          .label .brand { display: flex; align-items: center; gap: 3mm; margin-bottom: 2mm; }
          .label .logo-circle { width: 8mm; height: 8mm; border: 1.5px solid #ccc; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14pt; flex-shrink: 0; }
          .label .brand-name { font-size: 12pt; font-weight: 700; color: #1a1a1a; }
          .label .brand-sub { font-size: 5pt; color: #888; text-transform: uppercase; letter-spacing: 2px; margin-top: 1px; }
          .label .divider { width: 100%; height: 0.5px; background: #e8e4de; margin: 2mm 0; }
          .label .table-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2mm; }
          .label .table-label { font-size: 5pt; color: #999; text-transform: uppercase; letter-spacing: 3px; }
          .label .table-num { font-size: 28pt; font-weight: 900; color: #1a1a1a; line-height: 1; margin-top: 1mm; }
          .label .table-info { text-align: right; display: flex; flex-direction: column; gap: 2mm; margin-top: 1mm; }
          .label .badge { display: inline-flex; align-items: center; gap: 1.5mm; padding: 1mm 3mm; border-radius: 100px; font-size: 5pt; background: #eef2ff; color: #4f46e5; }
          .label .badge-seats { background: #f0f0f0; color: #555; }
          .label .qr-wrap { display: flex; justify-content: center; padding: 2mm 0; }
          .label .qr-wrap img { width: 30mm; height: 30mm; }
          .label .scan-text { text-align: center; font-size: 7pt; color: #555; margin: 1mm 0; }
          .label .footer { display: flex; align-items: center; justify-content: center; gap: 2mm; border-top: 0.5px solid #e8e4de; padding-top: 2mm; }
          .label .footer span { font-size: 5pt; color: #bbb; }
          .label .footer .r-logo { width: 3mm; height: 3mm; background: #2c2c2c; border-radius: 0.5mm; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 3pt; font-weight: 900; }
          .label .footer .r-name { font-size: 5pt; color: #999; font-weight: 600; }
        `;
        printWindow.document.head.appendChild(style);
        printWindow.document.write('</head><body>');
        printWindow.document.write(contentNode.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
      }
    }
  };

  const sorted = [...tables].sort((a, b) => a.name.localeCompare(b.name));
  const itemsPerPage = 6;
  const pages: Table[][] = [];
  for (let i = 0; i < sorted.length; i += itemsPerPage) pages.push(sorted.slice(i, i + itemsPerPage));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Print QR Labels" size="2xl">
      <div className="space-y-4">
        <p className="text-sm text-gray-500">Preview your branded QR labels. Each page prints 6 labels on A4 paper.</p>
        <div className="max-h-[50vh] overflow-y-auto bg-gray-200 p-4 rounded-xl space-y-6">
          {pages.map((pageTables, pi) => (
            <div key={pi} className="bg-white rounded-xl shadow-lg p-3 mx-auto" style={{ width: 595, transform: 'scale(0.5)', transformOrigin: 'top center', marginBottom: '-220px' }}>
              <div className="grid grid-cols-2 gap-3">
                {pageTables.map(t => {
                  const url = qrCodes[t.id];
                  if (!url) return null;
                  const area = t.areaFloorId ? areasMap[t.areaFloorId] : undefined;
                  return (
                    <div key={t.id} className="border-[3px] border-gray-800 rounded-2xl bg-[#faf8f5] p-3 text-center">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 border border-gray-300 rounded-full flex items-center justify-center text-[8px]">🍽️</div>
                        <div className="text-left">
                          <p className="text-[8px] font-bold text-gray-800 leading-tight" style={{ fontFamily: "'Georgia', serif" }}>{restaurantName}</p>
                          <p className="text-[4px] text-gray-400 uppercase tracking-widest">KITCHEN &amp; BAR</p>
                        </div>
                      </div>
                      <div className="w-full h-px bg-gray-200 mb-2" />
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-[5px] text-gray-400 uppercase tracking-widest">TABLE</p>
                          <p className="text-[20px] font-black text-gray-900 leading-none" style={{ fontFamily: "'Georgia', serif" }}>{String(t.name).padStart(2, '0')}</p>
                        </div>
                        <div className="text-right">
                          {area && <p className="text-[5px] bg-indigo-50 text-indigo-600 rounded-full px-2 py-0.5 mb-0.5">● {area}</p>}
                          <p className="text-[5px] bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">👤 Seats {t.capacity}</p>
                        </div>
                      </div>
                      <img src={url} alt="" className="w-[28mm] h-[28mm] mx-auto my-1" />
                      <p className="text-[6px] text-gray-500" style={{ fontFamily: "'Georgia', serif" }}>Scan to view menu &amp; order</p>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <span className="text-[4px] text-gray-300">Powered by</span>
                        <img src="/fevicon.png" alt="" className="w-2 h-2 rounded-sm object-contain" />
                        <span className="text-[4px] text-gray-400 font-semibold">RestoByte</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div ref={printContentRef} style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          {pages.map((pageTables, pi) => (
            <div key={pi} className="page">
              {pageTables.map(t => {
                const url = qrCodes[t.id];
                if (!url) return null;
                const area = t.areaFloorId ? areasMap[t.areaFloorId] : undefined;
                return (
                  <div key={t.id} className="label">
                    <div className="brand">
                      <div className="logo-circle">🍽️</div>
                      <div>
                        <p className="brand-name">{restaurantName}</p>
                        <p className="brand-sub">KITCHEN &amp; BAR</p>
                      </div>
                    </div>
                    <div className="divider" />
                    <div className="table-row">
                      <div>
                        <p className="table-label">TABLE</p>
                        <p className="table-num">{String(t.name).padStart(2, '0')}</p>
                      </div>
                      <div className="table-info">
                        {area && <span className="badge">● {area}</span>}
                        <span className="badge badge-seats">👤 Seats {t.capacity}</span>
                      </div>
                    </div>
                    <div className="qr-wrap"><img src={url} alt="" /></div>
                    <p className="scan-text">Scan to view menu &amp; order</p>
                    <div className="footer">
                      <span>Powered by</span>
                      <img src="/fevicon.png" alt="" style={{ width: '3mm', height: '3mm', borderRadius: '0.5mm', objectFit: 'contain' }} />
                      <span className="r-name">RestoByte</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-3 border-t">
          <button onClick={handlePrint} className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors shadow-lg">
            <FiPrinter size={16} /> Print All Labels
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ── Main Page ──
const TableQrCodeGeneratorPage: React.FC = () => {
  const { tables, areasFloors, getSingleActiveOutlet } = useRestaurantData();
  const [qrCodes, setQrCodes] = useState<Record<string, Record<string, string>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [themeId, setThemeId] = useState('classic');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const theme = QR_THEMES.find(t => t.id === themeId) || QR_THEMES[0];
  const activeOutlet = getSingleActiveOutlet();
  const restaurantName = activeOutlet?.restaurantName || activeOutlet?.name || 'Restaurant';
  const logoUrl = activeOutlet?.logoUrl || '';
  const tagline = activeOutlet?.address || '';

  // Map areaFloorId -> area name
  const areasMap = useMemo(() => {
    const m: Record<string, string> = {};
    areasFloors.forEach(a => { m[a.id] = a.name; });
    return m;
  }, [areasFloors]);

  // Group tables by area
  const tablesByArea = useMemo(() => {
    const grouped: { [areaId: string]: { name: string; tables: Table[] } } = {};
    const unassigned: Table[] = [];
    [...tables].sort((a, b) => a.name.localeCompare(b.name)).forEach(table => {
      if (table.areaFloorId && areasFloors.find(af => af.id === table.areaFloorId)) {
        const area = areasFloors.find(af => af.id === table.areaFloorId)!;
        if (!grouped[area.id]) grouped[area.id] = { name: area.name, tables: [] };
        grouped[area.id].tables.push(table);
      } else {
        unassigned.push(table);
      }
    });
    return { grouped: Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name)), unassigned };
  }, [tables, areasFloors]);

  // Auto-select first table
  useEffect(() => {
    if (!selectedTableId && tables.length > 0) {
      setSelectedTableId(tablesByArea.grouped[0]?.tables[0]?.id || tablesByArea.unassigned[0]?.id || null);
    }
  }, [tables, tablesByArea, selectedTableId]);

  // Generate QR codes
  useEffect(() => {
    const generate = async () => {
      if (tables.length === 0) { setIsLoading(false); return; }
      setIsLoading(true);
      const results = await Promise.all(tables.map(async (table) => {
        const url = `${window.location.origin}/qr-menu/${table.id}`;
        try {
          const dataUrl = await QRCode.toDataURL(url, {
            errorCorrectionLevel: 'H',
            width: 400,
            margin: 1,
            color: { dark: theme.fg, light: theme.bg },
          });
          return { id: table.id, url: dataUrl };
        } catch { return { id: table.id, url: null }; }
      }));
      const map: Record<string, string> = {};
      results.forEach(r => { if (r.url) map[r.id] = r.url; });
      setQrCodes(prev => ({ ...prev, [themeId]: map }));
      setIsLoading(false);
    };
    if (!qrCodes[themeId]) generate();
  }, [tables, themeId, qrCodes, theme.fg, theme.bg]);

  const selectedTable = useMemo(() => tables.find(t => t.id === selectedTableId), [selectedTableId, tables]);
  const selectedQrUrl = selectedTableId && qrCodes[themeId] ? qrCodes[themeId][selectedTableId] : undefined;

  const handleCopyUrl = () => {
    if (!selectedTable) return;
    navigator.clipboard.writeText(`${window.location.origin}/qr-menu/${selectedTable.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (!selectedTable || !selectedQrUrl) return;

    // 4" x 6" at 300 DPI
    const W = 1200, H = 1800;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    const isDark = theme.id === 'charcoal';
    const pad = 60;
    const cardW = W - pad * 2;
    const cx = W / 2; // center x

    // Background
    ctx.fillStyle = isDark ? '#2c2c2c' : '#faf8f5';
    ctx.fillRect(0, 0, W, H);

    // Card border
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.roundRect(pad, pad, cardW, H - pad * 2, 60);
    ctx.stroke();

    // Card background
    ctx.fillStyle = isDark ? '#2c2c2c' : '#faf8f5';
    ctx.fill();

    let y = pad + 50;

    // Logo centered
    if (logoUrl) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((r, j) => { img.onload = () => r(); img.onerror = () => j(); img.src = logoUrl; });
        const logoW = 220, logoH = 80;
        ctx.drawImage(img, cx - logoW / 2, y, logoW, logoH);
        y += logoH + 20;
      } catch {
        ctx.fillStyle = '#999'; ctx.font = '60px serif'; ctx.textAlign = 'center';
        ctx.fillText('🍽️', cx, y + 40);
        y += 80;
      }
    } else {
      ctx.fillStyle = '#999'; ctx.font = '60px serif'; ctx.textAlign = 'center';
      ctx.fillText('🍽️', cx, y + 40);
      y += 80;
    }

    // Restaurant name
    ctx.fillStyle = isDark ? '#f5f0e8' : '#1a1a1a';
    ctx.font = 'bold 68px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(restaurantName, cx, y + 20);
    y += 50;

    // Tagline
    if (tagline) {
      ctx.fillStyle = isDark ? '#777' : '#aaa';
      ctx.font = '500 34px Inter, sans-serif';
      ctx.fillText(tagline.toUpperCase(), cx, y + 30);
      y += 55;
    } else {
      y += 10;
    }

    // Divider
    y += 10;
    ctx.strokeStyle = isDark ? '#333' : '#e0dcd6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pad + 80, y);
    ctx.lineTo(W - pad - 80, y);
    y += 30;

    // Table label + number + seats badge
    // TABLE label
    ctx.fillStyle = isDark ? '#666' : '#aaa';
    ctx.font = '500 34px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('TABLE', pad + 80, y + 20);

    // Table number (T format)
    ctx.fillStyle = isDark ? '#f5f0e8' : '#1a1a1a';
    ctx.font = '900 140px Georgia, serif';
    ctx.textAlign = 'left';
    const tableLabel = 'T' + String(selectedTable.name).replace(/^T/i, '');
    ctx.fillText(tableLabel, pad + 80, y + 170);

    // Seats badge
    const seatsTxt = `👤  Seats ${selectedTable.capacity}`;
    ctx.font = '500 34px Inter, sans-serif';
    const seatsW = ctx.measureText(seatsTxt).width + 40;
    const seatsX = W - pad - 80 - seatsW;
    ctx.fillStyle = isDark ? '#333' : '#f3f4f6';
    ctx.beginPath();
    ctx.roundRect(seatsX, y + 10, seatsW, 44, 22);
    ctx.fill();
    ctx.fillStyle = isDark ? '#aaa' : '#555';
    ctx.textAlign = 'center';
    ctx.fillText(seatsTxt, seatsX + seatsW / 2, y + 40);

    y += 190;

    // QR Code
    const qrSize = 680;
    const qrX = (W - qrSize) / 2;
    try {
      const qrImg = new Image();
      await new Promise<void>((r, j) => { qrImg.onload = () => r(); qrImg.onerror = () => j(); qrImg.src = selectedQrUrl; });
      // QR white background
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.roundRect(qrX - 16, y - 16, qrSize + 32, qrSize + 32, 20);
      ctx.fill();
      ctx.drawImage(qrImg, qrX, y, qrSize, qrSize);

      // Corner brackets — blue
      const bLen = 70, bGap = 20;
      const bx1 = qrX - bGap, by1 = y - bGap;
      const bx2 = qrX + qrSize + bGap, by2 = y + qrSize + bGap;
      ctx.strokeStyle = '#3b5998';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      // Top-left
      ctx.beginPath(); ctx.moveTo(bx1, by1 + bLen); ctx.lineTo(bx1, by1); ctx.lineTo(bx1 + bLen, by1); ctx.stroke();
      // Top-right
      ctx.beginPath(); ctx.moveTo(bx2 - bLen, by1); ctx.lineTo(bx2, by1); ctx.lineTo(bx2, by1 + bLen); ctx.stroke();
      // Bottom-left
      ctx.beginPath(); ctx.moveTo(bx1, by2 - bLen); ctx.lineTo(bx1, by2); ctx.lineTo(bx1 + bLen, by2); ctx.stroke();
      // Bottom-right
      ctx.beginPath(); ctx.moveTo(bx2 - bLen, by2); ctx.lineTo(bx2, by2); ctx.lineTo(bx2, by2 - bLen); ctx.stroke();
    } catch {}

    y += qrSize + 50;

    // Scan text
    ctx.fillStyle = isDark ? '#888' : '#555';
    ctx.font = '500 44px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('Scan to view menu & order', cx, y);
    y += 60;

    // Footer divider
    ctx.strokeStyle = isDark ? '#333' : '#e0dcd6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pad + 80, y);
    ctx.lineTo(W - pad - 80, y);
    y += 40;

    // Powered by RestoByte
    ctx.fillStyle = isDark ? '#555' : '#bbb';
    ctx.font = '400 34px Inter, sans-serif';
    ctx.textAlign = 'center';
    const pbW = ctx.measureText('Powered by').width;
    const rbW = ctx.measureText('RestoByte').width;
    const totalW = pbW + 16 + 40 + 16 + rbW;
    const pbX = (W - totalW) / 2;
    ctx.fillText('Powered by', pbX + pbW / 2, y + 6);

    try {
      const fav = new Image();
      await new Promise<void>((r, j) => { fav.onload = () => r(); fav.onerror = () => j(); fav.src = '/fevicon.png'; });
      ctx.drawImage(fav, pbX + pbW + 8, y - 14, 40, 40);
    } catch {}

    ctx.fillStyle = isDark ? '#777' : '#aaa';
    ctx.font = '600 34px Inter, sans-serif';
    ctx.fillText('RestoByte', pbX + pbW + 16 + 40 + 16 + rbW / 2, y + 6);

    // Download
    const link = document.createElement('a');
    link.download = `qr-table-${selectedTable.name.replace(/\s+/g, '-')}-4x6.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const selectedArea = selectedTable?.areaFloorId ? areasMap[selectedTable.areaFloorId] : undefined;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {isPrintModalOpen && (
        <PrintPreviewModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          tables={tables}
          qrCodes={qrCodes[themeId] || {}}
          restaurantName={restaurantName}
          areasMap={areasMap}
        />
      )}

      {/* Header */}
      <header className="px-4 sm:px-8 py-5 bg-white border-b border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shadow-lg">
              <FiGrid size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                QR Code Generator
              </h1>
              <p className="text-xs text-gray-400 font-medium">Branded QR codes for table menus</p>
            </div>
          </div>
          <button
            onClick={() => setIsPrintModalOpen(true)}
            disabled={isLoading || tables.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 shadow-lg"
          >
            <FiPrinter size={16} /> Print All Labels
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar — Table List */}
        <aside className="w-72 bg-white border-r border-gray-100 overflow-y-auto custom-scrollbar flex flex-col">
          <div className="p-4 border-b border-gray-50">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              {tables.length} {tables.length === 1 ? 'table' : 'tables'}
            </p>
          </div>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center"><Spinner /></div>
          ) : (
            <div className="flex-1 overflow-y-auto p-3 space-y-5">
              {tablesByArea.grouped.map(area => (
                <div key={area.name}>
                  <div className="flex items-center gap-1.5 px-2 mb-1.5">
                    <FiMapPin size={10} className="text-gray-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{area.name}</span>
                  </div>
                  <div className="space-y-0.5">
                    {area.tables.map(table => (
                      <button
                        key={table.id}
                        onClick={() => setSelectedTableId(table.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all ${
                          selectedTableId === table.id
                            ? 'bg-gray-900 text-white shadow-lg'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span className="flex items-center gap-2.5 font-medium">
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                            selectedTableId === table.id ? 'bg-white/20' : 'bg-gray-100 text-gray-500'
                          }`}>
                            <FiGrid size={12} />
                          </span>
                          {table.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {tablesByArea.unassigned.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-2 mb-1.5">
                    <FiPackage size={10} className="text-gray-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Unassigned</span>
                  </div>
                  <div className="space-y-0.5">
                    {tablesByArea.unassigned.map(table => (
                      <button
                        key={table.id}
                        onClick={() => setSelectedTableId(table.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all ${
                          selectedTableId === table.id
                            ? 'bg-gray-900 text-white shadow-lg'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span className="flex items-center gap-2.5 font-medium">
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                            selectedTableId === table.id ? 'bg-white/20' : 'bg-gray-100 text-gray-500'
                          }`}>
                            <FiGrid size={12} />
                          </span>
                          {table.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {tables.length === 0 && (
                <div className="text-center py-12">
                  <FiGrid size={40} className="mx-auto text-gray-200 mb-3" />
                  <p className="text-sm text-gray-400">No tables configured yet.</p>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {!selectedTable ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <FiGrid size={32} className="text-gray-300" />
                </div>
                <p className="text-gray-400 font-medium">Select a table to preview its QR code</p>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Theme Selector */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Style Theme</h3>
                    <p className="text-xs text-gray-400">Choose a look for your QR labels</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {QR_THEMES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setThemeId(t.id)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                        themeId === t.id
                          ? 'ring-2 ring-gray-400 ring-offset-2 shadow-md'
                          : 'border border-gray-200 hover:border-gray-300'
                      }`}
                      style={{
                        background: t.bg,
                        color: t.fg,
                      }}
                    >
                      <span
                        className="w-3 h-3 rounded-full border-2"
                        style={{ background: t.fg, borderColor: t.fg }}
                      />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* QR Card + Actions */}
              <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
                {/* Branded QR Card */}
                <BrandedQrCard
                  table={selectedTable}
                  qrCodeUrl={selectedQrUrl || ''}
                  theme={theme}
                  restaurantName={restaurantName}
                  logoUrl={logoUrl}
                  tagline={tagline}
                />

                {/* Details & Actions */}
                <div className="flex-1 max-w-sm space-y-4 w-full">
                  {/* Action Buttons */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                          Table {selectedTable.name}
                        </h2>
                        <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                          <FiGrid size={12} />
                          {selectedTable.capacity} seats
                          {selectedArea && (
                            <>
                              <span className="text-gray-300">&middot;</span>
                              <FiMapPin size={12} />
                              {selectedArea}
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* URL Display */}
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-[11px] text-gray-600 bg-white rounded-lg px-3 py-2 border border-gray-200 truncate font-mono">
                          {window.location.origin}/qr-menu/{selectedTable.id}
                        </code>
                        <button
                          onClick={handleCopyUrl}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ${
                            copied
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {copied ? <FiCheck size={14} /> : 'Copy'}
                        </button>
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setIsPrintModalOpen(true)}
                        disabled={!selectedQrUrl}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-white text-gray-700 border-2 border-gray-200 rounded-xl text-sm font-semibold hover:border-gray-400 transition-colors disabled:opacity-50"
                      >
                        <FiPrinter size={16} /> Print this code
                      </button>
                      <button
                        onClick={handleDownload}
                        disabled={!selectedQrUrl}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 shadow-lg"
                      >
                        <FiDownload size={16} /> Download PNG
                      </button>
                    </div>
                  </div>

                  {/* Tips */}
                  <div className="bg-[#faf8f5] border border-gray-200 rounded-2xl p-4">
                    <h4 className="text-xs font-bold text-gray-700 mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                      Quick Guide
                    </h4>
                    <ul className="text-[11px] text-gray-500 space-y-1.5">
                      <li className="flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                        Print and place on each table for customers to scan
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                        Customers view the full menu, prices, and order directly
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                        Each QR links to a unique table — no login needed
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default TableQrCodeGeneratorPage;
