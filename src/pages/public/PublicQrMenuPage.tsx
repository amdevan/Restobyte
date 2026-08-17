import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { FiSearch, FiGrid, FiAlertTriangle, FiX, FiPlus, FiMinus, FiShoppingBag, FiCheck, FiClock, FiLoader, FiChevronDown, FiChevronUp, FiPackage } from 'react-icons/fi';
import { API_BASE_URL } from '@/config';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  isVegetarian?: boolean;
  category?: { id: string; name: string } | null;
  variations?: { name: string; price: number }[];
}

interface TableInfo {
  id: string;
  name: string;
  capacity: number;
  status: string;
  outletId: string;
}

interface OutletInfo {
  id: string;
  name: string;
  restaurantName?: string;
  logoUrl?: string;
  slug?: string | null;
}

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  variationName?: string;
  variationPrice?: number;
  note?: string;
}

interface ActiveOrder {
  id: string;
  status: string;
  total: number;
  items: { id: string; quantity: number; unitPrice: number; menuItem?: { name: string } | null }[];
  createdAt: string;
}

// ── Item Detail Modal (with Add to Cart) ──
const ItemDetailModal: React.FC<{
  item: MenuItem | null;
  onClose: () => void;
  onAddToCart: (item: MenuItem, qty: number, variation?: { name: string; price: number }) => void;
  cartQty: number;
}> = ({ item, onClose, onAddToCart, cartQty }) => {
  const [qty, setQty] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState<{ name: string; price: number } | undefined>();
  const [note, setNote] = useState('');

  useEffect(() => {
    setQty(1);
    setSelectedVariation(item?.variations?.[0] ? item.variations[0] : undefined);
    setNote('');
  }, [item?.id]);

  if (!item) return null;

  const price = selectedVariation?.price ?? item.price;
  const addItem = () => {
    onAddToCart(item, qty, selectedVariation);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative h-48 bg-gray-100">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <FiGrid size={32} className="text-gray-300" />
            </div>
          )}
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow">
            <FiX size={16} />
          </button>
          {item.isVegetarian && (
            <span className="absolute top-3 left-3 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">VEG</span>
          )}
        </div>
        <div className="p-4">
          <h2 className="text-lg font-bold text-gray-900">{item.name}</h2>
          {item.description && <p className="text-xs text-gray-500 mt-1">{item.description}</p>}

          {/* Variations */}
          {item.variations && item.variations.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Select option</p>
              <div className="flex flex-wrap gap-1.5">
                {item.variations.map((v, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedVariation(v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      selectedVariation?.name === v.name
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    {v.name} — {formatPrice(v.price)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Note */}
          <div className="mt-3">
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Special instructions (optional)"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-orange-400 focus:outline-none"
            />
          </div>

          {/* Price + Qty + Add */}
          <div className="mt-4 flex items-center gap-3">
            {/* Quantity */}
            <div className="flex items-center border border-gray-200 rounded-lg">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50">
                <FiMinus size={14} />
              </button>
              <span className="w-8 text-center text-sm font-bold">{qty}</span>
              <button onClick={() => setQty(q => q + 1)} className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50">
                <FiPlus size={14} />
              </button>
            </div>
            {/* Add button */}
            <button
              onClick={addItem}
              className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
            >
              <FiShoppingBag size={14} />
              Add {qty > 1 ? `${qty} ` : ''}for {formatPrice(price * qty)}
            </button>
          </div>

          {/* Current cart indicator */}
          {cartQty > 0 && (
            <p className="text-[10px] text-gray-400 mt-2 text-center">{cartQty} already in cart</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Cart Drawer ──
const CartDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQty: (menuItemId: string, variationName: string | undefined, qty: number) => void;
  onRemove: (menuItemId: string, variationName: string | undefined) => void;
  onPlaceOrder: (customerName: string, customerPhone: string, note: string) => void;
  placing: boolean;
}> = ({ isOpen, onClose, items, onUpdateQty, onRemove, onPlaceOrder, placing }) => {
  const total = items.reduce((s, it) => s + (it.variationPrice ?? it.menuItem.price) * it.quantity, 0);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative bg-white w-full max-w-md rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <FiShoppingBag size={18} />
            Your Order
            <span className="text-xs text-gray-400 font-normal">({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
          </h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <FiX size={18} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <FiShoppingBag size={40} className="mx-auto text-gray-200 mb-3" />
              <p className="text-sm text-gray-400">Your cart is empty</p>
            </div>
          ) : (
            items.map((ci, idx) => {
              const price = ci.variationPrice ?? ci.menuItem.price;
              return (
                <div key={`${ci.menuItem.id}-${ci.variationName}-${idx}`} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    {ci.menuItem.imageUrl ? (
                      <img src={ci.menuItem.imageUrl} alt={ci.menuItem.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <FiGrid size={14} className="text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{ci.menuItem.name}</p>
                    {ci.variationName && <p className="text-[10px] text-gray-400">{ci.variationName}</p>}
                    <p className="text-xs text-orange-500 font-bold">{formatPrice(price)}</p>
                  </div>
                  <div className="flex items-center border border-gray-200 rounded-lg">
                    <button
                      onClick={() => onUpdateQty(ci.menuItem.id, ci.variationName, ci.quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center text-gray-400 hover:bg-gray-50"
                    >
                      <FiMinus size={12} />
                    </button>
                    <span className="w-6 text-center text-xs font-bold">{ci.quantity}</span>
                    <button
                      onClick={() => onUpdateQty(ci.menuItem.id, ci.variationName, ci.quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center text-gray-400 hover:bg-gray-50"
                    >
                      <FiPlus size={12} />
                    </button>
                  </div>
                  <button onClick={() => onRemove(ci.menuItem.id, ci.variationName)} className="text-gray-300 hover:text-red-400 p-1">
                    <FiX size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Order Details + Place Order */}
        {items.length > 0 && (
          <div className="border-t px-4 py-3 space-y-3">
            {/* Toggle customer details */}
            <button onClick={() => setShowDetails(!showDetails)} className="text-[11px] text-orange-500 font-medium">
              {showDetails ? 'Hide' : 'Add'} customer details (optional)
            </button>
            {showDetails && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-orange-400 focus:outline-none"
                />
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="Phone number"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-orange-400 focus:outline-none"
                />
                <input
                  type="text"
                  value={orderNote}
                  onChange={e => setOrderNote(e.target.value)}
                  placeholder="Order note (optional)"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-orange-400 focus:outline-none"
                />
              </div>
            )}

            {/* Total + Place */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-400">Total</p>
                <p className="text-lg font-bold text-gray-900">{formatPrice(total)}</p>
              </div>
              <button
                onClick={() => onPlaceOrder(customerName, customerPhone, orderNote)}
                disabled={placing || items.length === 0}
                className="px-6 py-3 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {placing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FiCheck size={16} />
                )}
                {placing ? 'Placing...' : 'Place Order'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Order Success Modal ──
const OrderSuccessModal: React.FC<{
  orderId: string;
  onClose: () => void;
}> = ({ orderId, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
    <div className="absolute inset-0 bg-black/50" />
    <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <FiCheck size={32} className="text-green-600" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Order Placed!</h2>
      <p className="text-sm text-gray-500 mb-2">Your order has been sent to the kitchen.</p>
      <p className="text-xs text-gray-400 mb-6">Order ID: <span className="font-mono font-medium text-gray-600">{orderId.slice(0, 8)}...</span></p>
      <button onClick={onClose} className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors">
        Continue Browsing
      </button>
    </div>
  </div>
);

// ── Order Status Badge ──
const OrderStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    accepted: 'bg-blue-100 text-blue-700 border-blue-200',
    preparing: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    ready: 'bg-green-100 text-green-700 border-green-200',
    served: 'bg-gray-100 text-gray-500 border-gray-200',
    cancelled: 'bg-red-100 text-red-600 border-red-200',
  };
  const icons: Record<string, React.ReactNode> = {
    pending: <FiClock size={10} />,
    accepted: <FiCheck size={10} />,
    preparing: <FiLoader size={10} className="animate-spin" />,
    ready: <FiPackage size={10} />,
    served: <FiCheck size={10} />,
  };
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${styles[status] || styles.pending}`}>
      {icons[status]}
      {label}
    </span>
  );
};

// ── Format Time ──
function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString();
}

// ── Main Page ──
const PublicQrMenuPage: React.FC = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const [searchParams] = useSearchParams();
  const queryOutletId = searchParams.get('outletId') || undefined;
  const queryTableId = searchParams.get('tableId') || undefined;
  const effectiveTableId = tableId || queryTableId;
  const [table, setTable] = useState<TableInfo | null>(null);
  const [outlet, setOutlet] = useState<OutletInfo | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  // Active orders state
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [ordersOpen, setOrdersOpen] = useState(false);

  // Load active order IDs from localStorage
  const getOrderIds = useCallback((): string[] => {
    if (!effectiveTableId) return [];
    try {
      const raw = localStorage.getItem(`qr-orders-${effectiveTableId}`);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }, [effectiveTableId]);

  const saveOrderIds = useCallback((ids: string[]) => {
    if (!effectiveTableId) return;
    localStorage.setItem(`qr-orders-${effectiveTableId}`, JSON.stringify(ids));
  }, [effectiveTableId]);

  // Fetch active orders
  const fetchActiveOrders = useCallback(async () => {
    const ids = getOrderIds();
    if (ids.length === 0) { setActiveOrders([]); return; }
    try {
      const results = await Promise.all(ids.map(async (id) => {
        const res = await fetch(`${API_BASE_URL}/orders/public/${id}`);
        if (!res.ok) return null;
        const data = await res.json();
        return data.order || data;
      }));
      const valid = results.filter((o): o is ActiveOrder => o && o.status !== 'served' && o.status !== 'cancelled');
      setActiveOrders(valid);
      // Remove completed orders from localStorage
      const stillActive = valid.map(o => o.id);
      if (stillActive.length !== ids.length) saveOrderIds(stillActive);
    } catch {}
  }, [getOrderIds, saveOrderIds]);

  // Poll every 15 seconds
  useEffect(() => {
    fetchActiveOrders();
    const interval = setInterval(fetchActiveOrders, 15000);
    return () => clearInterval(interval);
  }, [fetchActiveOrders]);

  useEffect(() => {
    if (!effectiveTableId) { setError('No table specified'); setLoading(false); return; }
    const loadData = async () => {
      try {
        const tableRes = await fetch(`${API_BASE_URL}/tables/public/${effectiveTableId}`);
        if (!tableRes.ok) {
          setError(tableRes.status === 404 ? 'Table not found. This QR code may be invalid or expired.' : 'Failed to load table information.');
          setLoading(false);
          return;
        }
        const tableData = await tableRes.json();
        setTable(tableData.table);
        setOutlet(tableData.outlet);
        const outletIdForMenu = queryOutletId || tableData.outlet.id;
        const menuRes = await fetch(`${API_BASE_URL}/menu-items?outletId=${outletIdForMenu}`);
        if (menuRes.ok) setMenuItems(await menuRes.json());
      } catch { setError('Unable to connect to the server. Please try again.'); }
      finally { setLoading(false); }
    };
    loadData();
  }, [effectiveTableId, queryOutletId]);

  const categories = useMemo(() => {
    const cats = new Set(menuItems.map(i => i.category?.name || 'Uncategorized'));
    return ['All', ...Array.from(cats)];
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    let items = menuItems;
    if (activeCategory !== 'All') items = items.filter(i => (i.category?.name || 'Uncategorized') === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q) || (i.category?.name || '').toLowerCase().includes(q));
    }
    return items;
  }, [menuItems, activeCategory, searchQuery]);

  // ── Cart Logic ──
  const addToCart = useCallback((item: MenuItem, qty: number, variation?: { name: string; price: number }) => {
    setCart(prev => {
      const key = variation?.name || '';
      const existing = prev.find(c => c.menuItem.id === item.id && (c.variationName || '') === key);
      if (existing) {
        return prev.map(c => c.menuItem.id === item.id && (c.variationName || '') === key ? { ...c, quantity: c.quantity + qty } : c);
      }
      return [...prev, { menuItem: item, quantity: qty, variationName: variation?.name, variationPrice: variation?.price }];
    });
  }, []);

  const updateCartQty = useCallback((menuItemId: string, variationName: string | undefined, qty: number) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(c => !(c.menuItem.id === menuItemId && (c.variationName || '') === (variationName || ''))));
    } else {
      setCart(prev => prev.map(c => c.menuItem.id === menuItemId && (c.variationName || '') === (variationName || '') ? { ...c, quantity: qty } : c));
    }
  }, []);

  const removeFromCart = useCallback((menuItemId: string, variationName: string | undefined) => {
    setCart(prev => prev.filter(c => !(c.menuItem.id === menuItemId && (c.variationName || '') === (variationName || ''))));
  }, []);

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  // Get cart qty for a specific item
  const getItemCartQty = useCallback((itemId: string) => {
    return cart.filter(c => c.menuItem.id === itemId).reduce((s, c) => s + c.quantity, 0);
  }, [cart]);

  // ── Place Order ──
  const placeOrder = useCallback(async (customerName: string, customerPhone: string, note: string) => {
    if (!outlet || cart.length === 0) return;
    setPlacing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/orders/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outletId: outlet.id,
          tableId: table?.id,
          customerName,
          customerPhone,
          note,
          items: cart.map(c => ({
            menuItemId: c.menuItem.id,
            quantity: c.quantity,
            unitPrice: c.variationPrice ?? c.menuItem.price,
          })),
        }),
      });
      if (!res.ok) throw new Error('Failed to place order');
      const data = await res.json();
      const newId = data.orderId;
      // Save to active orders
      const ids = getOrderIds();
      saveOrderIds([...ids, newId]);
      setCart([]);
      setCartOpen(false);
      setOrderSuccess(newId);
      fetchActiveOrders();
    } catch {
      alert('Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  }, [outlet, cart, table]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-sm">Loading menu...</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiAlertTriangle size={32} className="text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">Oops!</h1>
            <p className="text-gray-600 text-sm mb-6">{error}</p>
            <Link to="/" className="inline-block bg-orange-500 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors">
              Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Menu ──
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Modals */}
      <ItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} onAddToCart={addToCart} cartQty={selectedItem ? getItemCartQty(selectedItem.id) : 0} />
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        onUpdateQty={updateCartQty}
        onRemove={removeFromCart}
        onPlaceOrder={placeOrder}
        placing={placing}
      />
      {orderSuccess && <OrderSuccessModal orderId={orderSuccess} onClose={() => setOrderSuccess(null)} />}

      {/* Active Orders Drawer */}
      {ordersOpen && activeOrders.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setOrdersOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative bg-white w-full max-w-md rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <FiClock size={18} className="text-amber-500" />
                My Orders
                <span className="text-xs text-gray-400 font-normal">({activeOrders.length})</span>
              </h3>
              <button onClick={() => setOrdersOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                <FiX size={18} />
              </button>
            </div>

            {/* Orders list */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {activeOrders.map(order => (
                <div key={order.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  {/* Order header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-700">#{order.id.slice(0, 8)}</span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <span className="text-[10px] text-gray-400">{formatTime(order.createdAt)}</span>
                  </div>

                  {/* Items */}
                  <div className="space-y-1 mb-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 truncate">
                          <span className="font-medium text-gray-800">{item.quantity}x</span>{' '}
                          {item.menuItem?.name || 'Item'}
                        </span>
                        <span className="text-gray-500 ml-2">{formatPrice(item.unitPrice * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="border-t border-gray-200 pt-2 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 font-medium">Total</span>
                    <span className="text-sm font-bold text-gray-800">{formatPrice(order.total)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Grand Total */}
            {activeOrders.length > 1 && (
              <div className="mx-4 mb-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-bold text-gray-700">Grand Total ({activeOrders.length} orders)</span>
                <span className="text-lg font-bold text-orange-600">{formatPrice(activeOrders.reduce((sum, o) => sum + o.total, 0))}</span>
              </div>
            )}

            {/* Close */}
            <div className="px-4 py-3 border-t">
              <button
                onClick={() => setOrdersOpen(false)}
                className="w-full py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-5 text-center">
          {outlet?.logoUrl && <img src={outlet.logoUrl} alt="" className="h-10 max-w-[120px] object-contain mx-auto mb-2" />}
          <h1 className="text-xl font-bold">{outlet?.restaurantName || outlet?.name || 'Restaurant'}</h1>
          {table && (
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium mt-1.5">
              <FiGrid size={12} />
              <span>Table {table.name}</span>
              <span className="opacity-50">|</span>
              <span>{table.capacity} seats</span>
            </div>
          )}
        </div>
      </header>

      {/* Search */}
      <div className="max-w-2xl mx-auto px-4 -mt-3">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search menu..."
            className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl shadow-md border-0 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <FiX size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-2xl mx-auto px-4 mt-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                activeCategory === cat ? 'bg-orange-500 text-white shadow' : 'bg-white text-gray-600 hover:bg-orange-50 border border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Item Count */}
      <div className="max-w-2xl mx-auto px-4 mt-3">
        <p className="text-[11px] text-gray-400 font-medium">{filteredItems.length} items</p>
      </div>

      {/* Active Orders Banner */}
      {activeOrders.length > 0 && (
        <div className="max-w-2xl mx-auto px-4 mt-3">
          <button
            onClick={() => setOrdersOpen(true)}
            className="w-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3 text-left transition-all active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                  <FiClock size={14} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">
                    {activeOrders.length} Active Order{activeOrders.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {activeOrders.map(o => o.status.charAt(0).toUpperCase() + o.status.slice(1)).join(' · ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                </span>
                <FiChevronDown size={16} className="text-gray-400" />
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Menu Grid — 3 columns */}
      <div className="max-w-2xl mx-auto px-3 mt-2">
        {filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <FiGrid size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">{searchQuery ? 'No items match your search.' : 'No menu items available.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5">
            {filteredItems.map(item => {
              const inCart = getItemCartQty(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 text-left transition-all active:scale-[0.97] hover:shadow-md relative"
                >
                  {/* Image */}
                  <div className="relative aspect-square bg-gray-100">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <FiGrid size={20} className="text-gray-300" />
                      </div>
                    )}
                    {item.isVegetarian && <span className="absolute top-1 left-1 w-3 h-3 bg-green-500 rounded-full border border-white" />}
                    {inCart > 0 && (
                      <span className="absolute top-1 right-1 bg-orange-500 text-white text-[9px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center min-w-[18px] px-1">
                        {inCart}
                      </span>
                    )}
                  </div>
                  {/* Info */}
                  <div className="p-1.5">
                    <h3 className="text-[11px] font-semibold text-gray-800 leading-tight line-clamp-2 min-h-[28px]">{item.name}</h3>
                    <div className="mt-1">
                      {item.variations && item.variations.length > 0 ? (
                        <span className="text-orange-500 text-[11px] font-bold">
                          {formatPrice(Math.min(...item.variations.map(v => v.price)))}
                          <span className="text-gray-400 text-[8px] font-normal ml-0.5">+</span>
                        </span>
                      ) : (
                        <span className="text-orange-500 text-[11px] font-bold">{formatPrice(item.price)}</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating My Orders Button */}
      {activeOrders.length > 0 && (
        <button
          onClick={() => setOrdersOpen(true)}
          className="fixed bottom-20 right-4 z-40 bg-amber-500 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center hover:bg-amber-600 transition-all active:scale-95"
        >
          <FiClock size={22} />
          <span className="absolute -top-1 -right-1 bg-gray-900 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {activeOrders.length}
          </span>
        </button>
      )}

      {/* Floating Cart Button */}
      {cartCount > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className={`fixed right-4 z-40 bg-orange-500 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center hover:bg-orange-600 transition-all active:scale-95 ${activeOrders.length > 0 ? 'bottom-36' : 'bottom-20'}`}
        >
          <FiShoppingBag size={22} />
          <span className="absolute -top-1 -right-1 bg-gray-900 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {cartCount}
          </span>
        </button>
      )}

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-200 py-2.5 px-4 z-40">
        <div className="max-w-2xl mx-auto flex items-center justify-center gap-1.5 text-[10px] text-gray-500">
          <img src="/fevicon.png" alt="" className="w-3 h-3 object-contain" />
          <span className="font-semibold text-orange-500">{outlet?.name}</span>
          <span>&middot;</span>
          <span>Powered by RestoByte</span>
        </div>
      </div>
    </div>
  );
};

function formatPrice(price: number): string {
  return price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default PublicQrMenuPage;
