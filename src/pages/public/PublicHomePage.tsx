import React, { useEffect, useMemo, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { getMenuItems } from '@/services/api';
import { FiSmartphone, FiTruck, FiAward, FiStar, FiShoppingBag, FiHeart, FiArrowRight } from 'react-icons/fi';
import Money from '@/components/common/Money';

const PublicHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { outlet, baseUrl, addToCart } = useOutletContext<{ outlet: any, baseUrl: string, addToCart: (item: any) => void }>();
  const { websiteSettings, preMadeFoodItems } = useRestaurantData();

  // Remote menu fetch state
  const [remoteMenu, setRemoteMenu] = useState<typeof preMadeFoodItems>([]);

  // Fetch remote menu items from backend when available
  useEffect(() => {
    let isActive = true;
    if (!outlet?.id) return;
    getMenuItems(outlet.id)
      .then(items => {
        if (!isActive) return;
        setRemoteMenu(items);
      })
      .catch(err => {
        console.error('Failed to load menu from server', err);
      });
    return () => { isActive = false; };
  }, [outlet?.id]);

  const itemsToDisplay = useMemo(() => {
    if (remoteMenu && remoteMenu.length > 0) return remoteMenu;
    const visibleIds = websiteSettings.availableOnlineFoodIds || [];
    return preMadeFoodItems.filter(item => visibleIds.includes(item.id));
  }, [remoteMenu, preMadeFoodItems, websiteSettings.availableOnlineFoodIds]);

  const popularItems = useMemo(() => itemsToDisplay.slice(0, 4), [itemsToDisplay]);

  // Mock Data for UI
  const testimonials = [
    { id: 1, name: 'Willie Jenkins', role: 'Food Lover', text: 'Great food! I love it. The taste is amazing and delivery was super fast.', image: 'https://randomuser.me/api/portraits/men/32.jpg' },
    { id: 2, name: 'Eula Kelly', role: 'Food Blogger', text: 'One of the best dining experiences I have had in a long time. Highly recommended!', image: 'https://randomuser.me/api/portraits/women/44.jpg' },
    { id: 3, name: 'Dora Mccoy', role: 'Customer', text: 'Friendly staff and delicious meals. A perfect place for family dinner.', image: 'https://randomuser.me/api/portraits/women/68.jpg' },
  ];

  const blogs = [
    { id: 1, title: 'Celebrating Food Festivals: Special Dishes for Every Occasion', date: '10 Jan, 2024', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
    { id: 2, title: 'Behind the Kitchen: Meet Our Team of Culinary Experts', date: '15 Jan, 2024', image: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
    { id: 3, title: 'Exploring Local Food Culture: Flavors of Ghana', date: '20 Jan, 2024', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
  ];

  return (
    <div className="bg-white font-sans text-gray-800">
      {/* Hero Section */}
      <section id="home" className="relative bg-orange-50/50 pt-20 pb-20 px-4 md:px-12 lg:px-24 overflow-hidden">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 z-10">
            <span className="text-orange-500 font-medium tracking-wide uppercase text-sm flex items-center gap-2">
              <span className="w-8 h-0.5 bg-orange-500"></span> Hello Food Lovers
            </span>
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 leading-tight">
              Welcome To <br /> Your Food <br /> <span className="text-orange-500">Village</span>
            </h1>
            <p className="text-gray-600 text-lg max-w-md leading-relaxed">
              {websiteSettings.homePageContent?.bannerSection?.subtitle || 'Delicious food for every mood. Chef\'s special recipes made with love and passion. Order now and enjoy!'}
            </p>
            <div className="flex gap-4 pt-4">
              <button onClick={() => navigate(`${baseUrl}/menu`)} className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full font-semibold shadow-lg shadow-orange-500/30 transition-all transform hover:-translate-y-1">
                Check Menu
              </button>
              <button onClick={() => navigate(`${baseUrl}/menu`)} className="bg-white hover:bg-gray-50 text-gray-800 px-8 py-3 rounded-full font-semibold shadow-md border border-gray-100 transition-all flex items-center gap-2">
                <span className="bg-orange-100 text-orange-500 p-1 rounded-full"><FiShoppingBag /></span> Order Now
              </button>
            </div>
          </div>
          <div className="relative z-10">
            <div className="relative">
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-orange-200 rounded-full filter blur-3xl opacity-50"></div>
              <img 
                src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                alt="Delicious Food" 
                className="relative z-10 w-full h-auto rounded-3xl shadow-2xl transform rotate-2 hover:rotate-0 transition-all duration-500 object-cover aspect-[4/3]"
                crossOrigin="anonymous"
              />
              {/* Floating Cards */}
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl flex items-center gap-3 animate-bounce-slow">
                <div className="bg-green-100 p-2 rounded-full text-green-600"><FiStar /></div>
                <div>
                  <p className="font-bold text-gray-800">4.9</p>
                  <p className="text-xs text-gray-500">Top Rated</p>
                </div>
              </div>
              <div className="absolute top-10 -right-6 bg-white p-4 rounded-xl shadow-xl flex items-center gap-3 animate-pulse-slow">
                <div className="bg-red-100 p-2 rounded-full text-red-600"><FiHeart /></div>
                <div>
                  <p className="font-bold text-gray-800">Love it!</p>
                  <p className="text-xs text-gray-500">Customer Fav</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Background Decorative Shapes */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-orange-100/40 to-transparent skew-x-12"></div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-white relative">
        <div className="container mx-auto text-center mb-16">
            <span className="text-orange-500 font-medium text-sm tracking-widest uppercase mb-2 block">What We Serve</span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900">Your Favorite Food Delivery <br /> Partner</h2>
        </div>
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group p-8 rounded-3xl bg-white border border-gray-100 hover:shadow-xl hover:border-orange-100 transition-all duration-300 text-center">
                <div className="w-20 h-20 mx-auto bg-orange-50 rounded-full flex items-center justify-center text-orange-500 mb-6 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
                    <FiSmartphone size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Order Food</h3>
                <p className="text-gray-500 leading-relaxed">Seamless ordering process through our app or website. Just a few clicks to satisfy your hunger.</p>
            </div>
            <div className="group p-8 rounded-3xl bg-white border border-gray-100 hover:shadow-xl hover:border-orange-100 transition-all duration-300 text-center">
                <div className="w-20 h-20 mx-auto bg-orange-50 rounded-full flex items-center justify-center text-orange-500 mb-6 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
                    <FiTruck size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Fast Delivery</h3>
                <p className="text-gray-500 leading-relaxed">Delivery that is always on time even faster. We value your time and hunger.</p>
            </div>
            <div className="group p-8 rounded-3xl bg-white border border-gray-100 hover:shadow-xl hover:border-orange-100 transition-all duration-300 text-center">
                <div className="w-20 h-20 mx-auto bg-orange-50 rounded-full flex items-center justify-center text-orange-500 mb-6 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
                    <FiAward size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Best Quality</h3>
                <p className="text-gray-500 leading-relaxed">The best quality of food for you. Fresh ingredients and hygienic preparation.</p>
            </div>
        </div>
      </section>

      {/* Popular Dishes Section - Dark Theme */}
      <section className="py-24 bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-orange-600/10 rounded-l-full blur-3xl"></div>
        <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-16">
                <div className="w-full lg:w-1/2 relative">
                    <div className="relative aspect-square max-w-md mx-auto">
                        <div className="absolute inset-0 bg-orange-500 rounded-full opacity-20 animate-pulse"></div>
                        <img 
                            src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                            alt="Popular Dish" 
                            className="relative z-10 w-full h-full object-cover rounded-full border-4 border-gray-800 shadow-2xl spin-slow-hover"
                            crossOrigin="anonymous"
                        />
                        <div className="absolute top-0 left-0 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-lg">
                            <p className="text-orange-400 font-bold text-lg">50% OFF</p>
                            <p className="text-xs text-gray-300">On First Order</p>
                        </div>
                    </div>
                </div>
                <div className="w-full lg:w-1/2">
                    <span className="text-orange-500 font-medium tracking-widest uppercase text-sm mb-2 block">Our Special Menu</span>
                    <h2 className="text-4xl md:text-5xl font-serif font-bold mb-8">Popular Dishes</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {popularItems.map((item) => (
                            <div key={item.id} className="bg-gray-800 p-2.5 rounded-lg hover:bg-gray-750 transition-colors flex gap-3 items-center group border border-gray-700/50 hover:border-orange-500/30">
                                <img src={item.imageUrl || `https://picsum.photos/seed/${item.id}/100/100`} alt={item.name} className="w-14 h-14 rounded-md object-cover group-hover:scale-105 transition-transform" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-sm mb-0.5 truncate text-gray-100 pr-2">{item.name}</h4>
                                        <span className="font-bold text-orange-500 text-sm whitespace-nowrap"><Money amount={item.price} /></span>
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <div className="flex items-center gap-0.5 text-yellow-400 text-[10px]">
                                            <FiStar fill="currentColor" size={10} />
                                            <span className="text-gray-400 ml-1">4.5</span>
                                        </div>
                                        <button onClick={() => addToCart(item)} className="bg-orange-600 hover:bg-orange-500 text-white rounded-full p-1.5 transition-colors shadow-sm" title="Add to Cart">
                                            <FiArrowRight size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Parallax / Promo Section */}
      <section className="py-32 bg-fixed bg-cover bg-center relative" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1559339352-11d035aa65de?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80")' }}>
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="container mx-auto px-4 relative z-10 text-center text-white">
            <h2 className="text-4xl md:text-6xl font-serif font-bold mb-6">Taste the Tradition of <br /> Authentic Flavors</h2>
            <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 text-gray-200">
                Experience the rich culinary heritage with our carefully crafted dishes using traditional recipes and modern techniques.
            </p>
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-10 py-4 rounded-full font-bold text-lg shadow-2xl transition-transform hover:scale-105">
                Book A Table Now
            </button>
        </div>
      </section>

      {/* Mobile App Download */}
      <section className="py-24 px-4 bg-white overflow-hidden">
        <div className="container mx-auto flex flex-col md:flex-row items-center gap-16">
            <div className="w-full md:w-1/2 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-orange-50 rounded-full -z-10"></div>
                <img 
                    src="https://images.unsplash.com/photo-1512428559087-560fa0db7901?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                    alt="Mobile App" 
                    className="mx-auto w-2/3 md:w-1/2 rounded-3xl shadow-2xl border-8 border-gray-900"
                    crossOrigin="anonymous"
                />
                 {/* Floating Badges */}
                 <div className="absolute top-20 right-10 bg-white p-3 rounded-xl shadow-lg animate-bounce-slow">
                    <span className="text-orange-500 font-bold">Fast</span> Order
                 </div>
            </div>
            <div className="w-full md:w-1/2">
                <span className="text-orange-500 font-medium tracking-widest uppercase text-sm mb-2 block">Download App</span>
                <h2 className="text-3xl md:text-5xl font-serif font-bold text-gray-900 mb-6">Download Our Mobile App</h2>
                <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                    Get the best food delivery experience with our new mobile app. Track your order in real-time and get exclusive offers.
                </p>
                <div className="flex gap-4">
                    <button className="bg-gray-900 text-white px-6 py-3 rounded-xl flex items-center gap-3 hover:bg-gray-800 transition-colors">
                        <FiSmartphone size={24} />
                        <div className="text-left">
                            <p className="text-xs text-gray-400">Download on the</p>
                            <p className="font-bold leading-none">App Store</p>
                        </div>
                    </button>
                    <button className="bg-gray-900 text-white px-6 py-3 rounded-xl flex items-center gap-3 hover:bg-gray-800 transition-colors">
                        <div className="text-2xl font-bold">G</div>
                        <div className="text-left">
                            <p className="text-xs text-gray-400">Get it on</p>
                            <p className="font-bold leading-none">Google Play</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 bg-orange-50/30">
        <div className="container mx-auto">
             <div className="text-center mb-16">
                <span className="text-orange-500 font-medium tracking-widest uppercase text-sm mb-2 block">Testimonials</span>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900">What Our Customers Say</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {testimonials.map(t => (
                    <div key={t.id} className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 relative">
                        <div className="text-orange-500 text-4xl font-serif absolute top-6 right-6 opacity-20">"</div>
                        <p className="text-gray-600 mb-6 leading-relaxed italic">"{t.text}"</p>
                        <div className="flex items-center gap-4">
                            <img src={t.image} alt={t.name} className="w-12 h-12 rounded-full object-cover border-2 border-orange-100" />
                            <div>
                                <h4 className="font-bold text-gray-800">{t.name}</h4>
                                <p className="text-xs text-orange-500 font-medium">{t.role}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </section>

       {/* Latest Blogs */}
       <section className="py-24 px-4 bg-white">
        <div className="container mx-auto">
             <div className="text-center mb-16">
                <span className="text-orange-500 font-medium tracking-widest uppercase text-sm mb-2 block">From The Blog</span>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900">Our Latest Blogs</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {blogs.map(b => (
                    <div key={b.id} className="group cursor-pointer">
                        <div className="overflow-hidden rounded-2xl mb-4 h-64 relative">
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors z-10"></div>
                            <img src={b.image} alt={b.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" crossOrigin="anonymous" />
                            <div className="absolute bottom-4 left-4 z-20 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-bold text-gray-800">
                                {b.date}
                            </div>
                        </div>
                        <h3 className="font-bold text-xl text-gray-800 mb-2 group-hover:text-orange-500 transition-colors line-clamp-2">{b.title}</h3>
                        <button className="text-sm font-medium text-gray-500 flex items-center gap-1 group-hover:gap-2 transition-all">
                            Read More <FiArrowRight className="text-orange-500" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-0 px-4">
          <div className="container mx-auto relative z-10 -mb-20">
              <div className="bg-orange-500 rounded-3xl p-10 md:p-16 text-center text-white shadow-2xl bg-pattern-dots">
                  <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Subscribe to Our Newsletter</h2>
                  <p className="text-orange-100 mb-8 max-w-xl mx-auto">Stay updated with our latest offers, new menu items, and culinary events.</p>
                  <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                      <input 
                        type="email" 
                        placeholder="Enter your email address" 
                        className="flex-1 px-6 py-4 rounded-full text-gray-800 focus:outline-none focus:ring-4 focus:ring-orange-300"
                      />
                      <button className="bg-gray-900 text-white px-8 py-4 rounded-full font-bold hover:bg-gray-800 transition-colors shadow-lg">
                          Subscribe
                      </button>
                  </div>
              </div>
          </div>
      </section>
    </div>
  );
};

export default PublicHomePage;