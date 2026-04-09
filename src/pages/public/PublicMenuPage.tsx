import React, { useEffect, useMemo, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { useCart } from '@/hooks/useCart';
import { getMenuItems } from '@/services/api';
import { FiStar, FiArrowRight, FiShoppingCart } from 'react-icons/fi';
import Money from '@/components/common/Money';

const PublicMenuPage: React.FC = () => {
  const { outlet } = useOutletContext<{ outlet: any }>();
  const { websiteSettings, preMadeFoodItems } = useRestaurantData();
  const { addToCart } = useCart();

  // Remote menu fetch state
  const [remoteMenu, setRemoteMenu] = useState<typeof preMadeFoodItems>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');

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

  const categories = useMemo(() => {
    const cats = Array.from(new Set(itemsToDisplay.map(i => typeof i.category === 'object' ? (i.category as any).name : i.category)));
    return ['All', ...cats];
  }, [itemsToDisplay]);

  const filteredItems = useMemo(() => {
    if (activeCategory === 'All') return itemsToDisplay;
    return itemsToDisplay.filter(i => (typeof i.category === 'object' ? (i.category as any).name : i.category) === activeCategory);
  }, [itemsToDisplay, activeCategory]);

  return (
    <div className="bg-white font-sans text-gray-800">
      
      {/* Breadcrumb Header */}
      <section className="bg-orange-50 py-16 text-center relative overflow-hidden">
         {/* Decorative elements */}
         <div className="absolute top-0 left-0 w-32 h-32 border-4 border-orange-200 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-50"></div>
         <div className="absolute bottom-0 right-0 w-48 h-48 bg-orange-100 rounded-full translate-x-1/3 translate-y-1/3 opacity-50"></div>
         
         {/* Decorative food icons (simulated with SVGs or just simple shapes for now to match the style) */}
         <div className="absolute top-10 left-10 opacity-20 transform -rotate-12">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>
         </div>
         <div className="absolute bottom-10 right-20 opacity-20 transform rotate-12">
             <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4"></circle><line x1="4.93" y1="4.93" x2="9.17" y2="9.17"></line><line x1="14.83" y1="14.83" x2="19.07" y2="19.07"></line><line x1="14.83" y1="9.17" x2="19.07" y2="4.93"></line><line x1="14.83" y1="9.17" x2="18.36" y2="5.64"></line><line x1="4.93" y1="19.07" x2="9.17" y2="14.83"></line></svg>
         </div>

         <div className="container mx-auto relative z-10">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">Food Menu</h1>
            <div className="flex justify-center items-center space-x-2 text-sm font-medium text-gray-600">
                <Link to="/public/restaurant" className="hover:text-orange-500 transition-colors">Home</Link>
                <span>&gt;</span>
                <span className="text-gray-900 font-bold">Food Menu</span>
            </div>
         </div>
      </section>

      {/* Menu Section */}
      <section className="py-24 px-4 bg-white">
        <div className="container mx-auto">
            <div className="text-center mb-12">
                <span className="text-orange-500 font-medium tracking-widest uppercase text-sm mb-2 block">Our Menu</span>
                <h2 className="text-3xl md:text-5xl font-serif font-bold text-gray-900">Our Regular Menu Pack</h2>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap justify-center items-center gap-8 mb-16">
                {categories.map(cat => (
                    <button 
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`font-bold text-lg transition-all relative pb-2 ${
                            activeCategory === cat 
                            ? 'text-orange-500' 
                            : 'text-gray-600 hover:text-orange-500'
                        }`}
                    >
                        {cat}
                        {activeCategory === cat && (
                             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-1">
                                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                             </div>
                        )}
                    </button>
                ))}
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {filteredItems.length > 0 ? (
                    filteredItems.map(item => (
                        <div key={item.id} className="bg-white rounded-lg p-2 shadow-sm hover:shadow-md transition-all duration-300 group text-center border border-gray-100 relative flex flex-col items-center">
                            <div className="relative mb-1 overflow-hidden rounded-full mx-auto w-28 h-28 shadow-sm group-hover:scale-105 transition-transform duration-300">
                                <img 
                                    src={item.imageUrl || `https://picsum.photos/seed/${item.id}/400/400`} 
                                    alt={item.name} 
                                    className="w-full h-full object-cover"
                                    crossOrigin="anonymous"
                                />
                            </div>
                            
                            <h3 className="font-bold text-gray-900 text-xs mb-0.5 truncate w-full px-1">{item.name}</h3>
                            
                            <div className="flex justify-center items-center gap-0.5 text-yellow-400 text-[8px] mb-1">
                                <FiStar fill="currentColor" size={8} />
                                <FiStar fill="currentColor" size={8} />
                                <FiStar fill="currentColor" size={8} />
                                <FiStar fill="currentColor" size={8} />
                                <FiStar fill="currentColor" size={8} />
                            </div>
                            
                            <div className="flex items-center justify-between w-full px-1 mt-auto">
                                <span className="font-bold text-orange-500 text-sm"><Money amount={item.price} /></span>
                                <button onClick={() => addToCart(item)} className="p-1 bg-orange-100 rounded-full text-orange-600 hover:bg-orange-500 hover:text-white transition-colors shadow-sm" title="Add to Cart">
                                    <FiShoppingCart size={12} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No items found in this category.
                    </div>
                )}
            </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-0 px-4">
          <div className="container mx-auto relative z-10 -mb-20">
              <div className="bg-orange-500 rounded-3xl p-10 md:p-16 text-center text-white shadow-2xl bg-pattern-dots relative overflow-hidden">
                  <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/3 -translate-y-1/3">
                      <svg width="300" height="300" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#FFFFFF" d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,79.6,-46.9C87.4,-34.7,90.1,-20.4,90.9,-6.2C91.7,8,90.6,22.1,84.4,34.4C78.2,46.7,66.9,57.2,54.4,65.2C41.9,73.2,28.2,78.7,14,81.3C-0.2,83.9,-14.9,83.6,-28.9,79.3C-42.9,75,-56.2,66.7,-67.2,55.8C-78.2,44.9,-86.9,31.4,-88.4,17.2C-89.9,3,-84.2,-11.9,-76.2,-25.1C-68.2,-38.3,-57.9,-49.8,-45.9,-57.6C-33.9,-65.4,-20.2,-69.5,-6.2,-68.4C7.8,-67.3,20.4,-61,30.5,-83.6L44.7,-76.4Z" transform="translate(100 100)" />
                      </svg>
                  </div>

                  <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4 relative z-10">Subscribe to Our Newsletter</h2>
                  <p className="text-orange-100 mb-8 max-w-xl mx-auto relative z-10">Stay updated with our latest offers, new menu items, and culinary events.</p>
                  <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto relative z-10">
                      <input 
                        type="email" 
                        placeholder="Enter your email address" 
                        className="flex-1 px-6 py-4 rounded-full text-gray-800 focus:outline-none focus:ring-4 focus:ring-orange-300 shadow-inner"
                      />
                      <button className="bg-gray-900 text-white px-8 py-4 rounded-full font-bold hover:bg-gray-800 transition-colors shadow-lg flex items-center justify-center gap-2">
                          Subscribe Now <FiArrowRight />
                      </button>
                  </div>
              </div>
          </div>
      </section>
    </div>
  );
};

export default PublicMenuPage;