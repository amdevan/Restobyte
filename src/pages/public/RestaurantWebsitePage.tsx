import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import PublicHeader from '@/components/public/PublicHeader';
import PublicFooter from '@/components/public/PublicFooter';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { getMenuItems } from '@/services/api';
import * as AllFiIcons from 'react-icons/fi';

const RestaurantWebsitePage: React.FC = () => {
  const navigate = useNavigate();
  const { outletId } = useParams();
  const { websiteSettings, preMadeFoodItems, getSingleActiveOutlet, outlets, currencies, addReservation, reservationSettings } = useRestaurantData();
  const outlet = outletId ? outlets.find(o => o.id === outletId) || getSingleActiveOutlet() : getSingleActiveOutlet();

  const visibleIds = websiteSettings.availableOnlineFoodIds || [];
  const visibleItems = preMadeFoodItems.filter(item => visibleIds.includes(item.id));

  // Remote menu fetch state
  const [remoteMenu, setRemoteMenu] = useState<typeof preMadeFoodItems>([]);
  const [menuLoading, setMenuLoading] = useState<boolean>(false);
  const [menuError, setMenuError] = useState<string | null>(null);

  const formatAmount = (amount: number): string => {
    const defaultCurrency = currencies.find(c => c.isDefault) || ({ symbol: '$' } as any);
    const symbol = defaultCurrency.symbol || '$';
    return `${symbol}${amount.toFixed(2)}`;
  };

  const handleLoginClick = () => {
    navigate('/public?action=login');
  };

  const handleRegisterClick = () => {
    navigate('/public?action=register');
  };

  const getPriceDisplay = (variations: { price: number }[] = []): string => {
    if (!variations || variations.length === 0) return '--.--';
    if (variations.length === 1) return formatAmount(variations[0].price);
    const prices = variations.map(v => v.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    if (minPrice === maxPrice) return formatAmount(minPrice);
    return `${formatAmount(minPrice)} - ${formatAmount(maxPrice)}`;
  };

  // Apply white-label favicon when available
  useEffect(() => {
    const faviconUrl = websiteSettings.whiteLabel?.faviconUrl;
    if (!faviconUrl) return;
    let link: HTMLLinkElement | null = document.querySelector("link[rel='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = faviconUrl;
  }, [websiteSettings.whiteLabel?.faviconUrl]);

  // Restaurant site nav links (use available sections)
  const navLinks = [
    { id: 'nav-home', text: 'Home', url: '#home' },
    ...(websiteSettings.homePageContent?.serviceSection?.services?.length ? [{ id: 'nav-services', text: 'Services', url: '#services' }] : []),
    { id: 'nav-menu', text: websiteSettings.commonMenuPage?.title || 'Menu', url: '#menu' },
    ...(websiteSettings.aboutUsContent?.content ? [{ id: 'nav-about', text: websiteSettings.aboutUsContent?.title || 'About', url: '#about' }] : []),
    ...(reservationSettings?.enabled ? [{ id: 'nav-reserve', text: 'Reserve', url: '#reserve' }] : []),
    ...((websiteSettings.contactUsContent?.address || websiteSettings.contactUsContent?.phone || websiteSettings.contactUsContent?.email) ? [{ id: 'nav-contact', text: 'Contact', url: '#contact' }] : []),
  ];

  // Fetch remote menu items from backend when available
  useEffect(() => {
    let isActive = true;
    setMenuLoading(true);
    setMenuError(null);
    getMenuItems()
      .then(items => {
        if (!isActive) return;
        setRemoteMenu(items);
      })
      .catch(err => {
        if (!isActive) return;
        setMenuError(err.message || 'Failed to load menu from server');
      })
      .finally(() => {
        if (!isActive) return;
        setMenuLoading(false);
      });
    return () => { isActive = false; };
  }, []);

  const itemsToDisplay = useMemo(() => {
    // Prefer remote menu if fetched; otherwise use locally-selected items
    if (remoteMenu && remoteMenu.length > 0) return remoteMenu;
    return visibleItems;
  }, [remoteMenu, visibleItems]);

  return (
    <div className="bg-white">
      <PublicHeader
        onLoginClick={handleLoginClick}
        onRegisterClick={handleRegisterClick}
        hideAuthButtons
        brandName={outlet?.restaurantName || websiteSettings.whiteLabel?.appName}
        logoUrl={websiteSettings.whiteLabel?.logoUrl}
        primaryColor={websiteSettings.whiteLabel?.primaryColor}
        navLinks={navLinks}
      />
      <main>
        {/* Hero / Home section */}
        <section id="home" className="relative bg-white text-gray-800">
          <div className="container mx-auto px-6 py-16 md:py-20 text-center">
            <p className="text-sm text-gray-600 mb-2">{outlet?.restaurantName || websiteSettings.whiteLabel?.appName}</p>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
              {websiteSettings.homePageContent?.bannerSection?.title || 'Welcome'}
            </h1>
            {websiteSettings.homePageContent?.bannerSection?.subtitle && (
              <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mt-3">
                {websiteSettings.homePageContent.bannerSection.subtitle}
              </p>
            )}
            <div className="mt-8">
              <Button onClick={() => {
                const el = document.getElementById('menu');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                } else {
                  window.location.hash = '#/public/restaurant#menu';
                }
              }}>
                {websiteSettings.homePageContent?.exploreMenuSection?.buttonText || 'Explore Menu'}
              </Button>
            </div>
          </div>
        </section>

        {/* Services section (optional) */}
        {websiteSettings.homePageContent?.serviceSection?.services?.length ? (
          <section id="services" className="py-12 bg-gray-50">
            <div className="container mx-auto px-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800">Our Services</h2>
                <p className="text-gray-500 mt-2">What we offer</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {websiteSettings.homePageContent.serviceSection.services.map(service => {
                  const IconComp = (AllFiIcons as any)[service.icon] || (AllFiIcons as any).FiGrid;
                  return (
                    <div key={service.id} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-all">
                      <div className="flex items-center justify-center h-12 w-12 rounded-full bg-indigo-500 text-white mb-4">
                        {IconComp && <IconComp />}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{service.title}</h3>
                      <p className="text-sm text-gray-600">{service.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        ) : null}

        {/* Menu section */}
        <section id="menu" className="py-14 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800">{websiteSettings.commonMenuPage?.title || 'Our Menu'}</h2>
              {websiteSettings.homePageContent?.exploreMenuSection?.subtitle && (
                <p className="text-gray-500 mt-2">{websiteSettings.homePageContent.exploreMenuSection.subtitle}</p>
              )}
            </div>
            {/* Backend connectivity banner */}
            {menuError && (
              <div className="mb-6 rounded-md border border-red-300 bg-red-50 text-red-700 px-4 py-3">
                Unable to reach the menu API. Showing local content.
              </div>
            )}
            {menuLoading && (
              <p className="text-center text-gray-500">Loading menu…</p>
            )}
            {itemsToDisplay.length === 0 ? (
              <p className="text-center text-gray-500">No items are currently available online.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {itemsToDisplay.map(item => (
                  <div key={item.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all p-4">
                    <img
                      src={item.imageUrl || `https://picsum.photos/seed/${item.id}/600/400`}
                      alt={item.name}
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <div className="mt-4">
                      <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-500">{item.category}</p>
                      <p className="mt-2 font-medium text-gray-800">{getPriceDisplay(item.variations as any)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* About section (optional) */}
        {websiteSettings.aboutUsContent?.content && (
          <section id="about" className="py-12 bg-white">
            <div className="container mx-auto px-6">
              <h2 className="text-2xl font-bold text-gray-800">{websiteSettings.aboutUsContent.title || 'About Us'}</h2>
              <p className="mt-3 text-gray-600 whitespace-pre-line">{websiteSettings.aboutUsContent.content}</p>
            </div>
          </section>
        )}

        {/* Contact section (optional) */}
        {(websiteSettings.contactUsContent?.address || websiteSettings.contactUsContent?.phone || websiteSettings.contactUsContent?.email) && (
          <section id="contact" className="py-12 bg-gray-50">
            <div className="container mx-auto px-6">
              <h2 className="text-2xl font-bold text-gray-800">Contact Us</h2>
              <div className="mt-3 text-gray-700 space-y-1">
                {websiteSettings.contactUsContent.address && <p><span className="font-medium">Address:</span> {websiteSettings.contactUsContent.address}</p>}
                {websiteSettings.contactUsContent.phone && <p><span className="font-medium">Phone:</span> {websiteSettings.contactUsContent.phone}</p>}
                {websiteSettings.contactUsContent.email && <p><span className="font-medium">Email:</span> {websiteSettings.contactUsContent.email}</p>}
              </div>
              {websiteSettings.contactUsContent.mapUrl && (
                <div className="mt-6">
                  <div className="aspect-w-16 aspect-h-9">
                    <iframe
                      src={websiteSettings.contactUsContent.mapUrl}
                      className="w-full h-64 md:h-96 rounded-lg border"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Map Location"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Reservation section (optional) */}
        {reservationSettings?.enabled && outlet?.id && (
          <ReservationSection outletId={outlet.id} addReservation={addReservation} reservationSettings={reservationSettings} />
        )}
      </main>
      <PublicFooter
        brandName={outlet?.restaurantName || websiteSettings.whiteLabel?.appName}
        socialLinks={websiteSettings.homePageContent?.socialMedia}
        hideCtaAndNewsletter
        brandDescription={websiteSettings.aboutUsContent?.title || 'Delicious food, friendly service. Welcome to our restaurant.'}
      />
    </div>
  );
};

type ReservationSectionProps = {
  outletId: string;
  addReservation: (reservation: { customerName: string; phone?: string; dateTime: string; partySize: number; tableId?: string; notes?: string; outletId: string; }) => void;
  reservationSettings: { enabled: boolean; availability: { day: string; isAvailable: boolean; startTime: string; endTime: string; }[] };
};

const ReservationSection: React.FC<ReservationSectionProps> = ({ outletId, addReservation, reservationSettings }) => {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [partySize, setPartySize] = useState<number>(2);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!customerName || !date || !time || !partySize) {
      setError('Please fill in name, date, time, and party size.');
      return;
    }
    setSubmitting(true);
    try {
      const dateTimeIso = new Date(`${date}T${time}:00`).toISOString();
      addReservation({ customerName, phone, dateTime: dateTimeIso, partySize, notes, outletId });
      setSuccess('Reservation submitted! We will confirm shortly.');
      setCustomerName('');
      setPhone('');
      setPartySize(2);
      setDate('');
      setTime('');
      setNotes('');
    } catch (err: any) {
      setError(err?.message || 'Failed to submit reservation.');
    } finally {
      setSubmitting(false);
    }
  };

  const availableDays = reservationSettings.availability.filter(a => a.isAvailable);

  return (
    <section id="reserve" className="py-12 bg-white">
      <div className="container mx-auto px-6">
        <h2 className="text-2xl font-bold text-gray-800">Reserve a Table</h2>
        {availableDays.length > 0 ? (
          <p className="mt-2 text-sm text-gray-600">Available: {availableDays.map(d => `${d.day} (${d.startTime}–${d.endTime})`).join(', ')}</p>
        ) : (
          <p className="mt-2 text-sm text-gray-600">Please contact us for availability.</p>
        )}
        <form onSubmit={onSubmit} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Name" value={customerName} onChange={e => setCustomerName(e.target.value)} required />
          <Input label="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
          <Input label="Party Size" type="number" min={1} value={partySize} onChange={e => setPartySize(Number(e.target.value))} required />
          <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
          <Input label="Time" type="time" value={time} onChange={e => setTime(e.target.value)} required />
          <Input label="Notes" value={notes} onChange={e => setNotes(e.target.value)} className="md:col-span-2" />
          {error && <p className="md:col-span-2 text-red-600 text-sm">{error}</p>}
          {success && <p className="md:col-span-2 text-green-600 text-sm">{success}</p>}
          <div className="md:col-span-2">
            <Button type="submit" variant="primary" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit Reservation'}</Button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default RestaurantWebsitePage;
