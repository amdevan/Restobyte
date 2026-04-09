import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { FiPlay, FiStar, FiArrowRight } from 'react-icons/fi';

const PublicAboutPage: React.FC = () => {
  const { outlet } = useOutletContext<{ outlet: any }>();
  const { websiteSettings } = useRestaurantData();
  const { aboutUsContent } = websiteSettings;
  const restaurantName = outlet?.restaurantName || websiteSettings.whiteLabel?.appName || 'Food Village';

  // Mock Chefs Data
  const chefs = [
    { id: 1, name: 'Mark Henry', role: 'Head Chef', image: 'https://randomuser.me/api/portraits/men/32.jpg' },
    { id: 2, name: 'John Doe', role: 'Sous Chef', image: 'https://randomuser.me/api/portraits/men/45.jpg' },
    { id: 3, name: 'Peter Parker', role: 'Pastry Chef', image: 'https://randomuser.me/api/portraits/men/22.jpg' },
    { id: 4, name: 'David Smith', role: 'Grill Master', image: 'https://randomuser.me/api/portraits/men/68.jpg' },
  ];

  // Mock Testimonials Data
  const testimonials = [
    { id: 1, name: 'Maria Gomez', role: 'Food Critic', text: 'As a food lover, I’m impressed by the layout, menu presentation, and smooth online experience. It reflects the restaurant’s real-life quality and professionalism perfectly.', image: 'https://randomuser.me/api/portraits/women/44.jpg', rating: 5 },
    { id: 2, name: 'Robert Evans', role: 'Business Manager', text: 'The restaurant’s web experience is seamless. From viewing dishes to making secure payments, everything feels professional and well-designed. Definitely one of the best restaurant sites I’ve used.', image: 'https://randomuser.me/api/portraits/men/46.jpg', rating: 5 },
    { id: 3, name: 'Aisha Rahman', role: 'Software Engineer', text: 'I’ve been a regular customer for months now. The website makes table reservations so simple, and I can easily track my past orders. Great design and amazing usability!', image: 'https://randomuser.me/api/portraits/women/65.jpg', rating: 4 },
  ];

  // Mock Blogs Data
  const blogs = [
    { id: 1, title: 'Celebrating Food Festivals: Special Dishes for Every Occasion', date: '10 Jan, 2024', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
    { id: 2, title: 'Behind the Kitchen: Meet Our Team of Culinary Experts', date: '15 Jan, 2024', image: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
    { id: 3, title: 'Exploring Local Food Culture: Flavors of Dhaka', date: '20 Jan, 2024', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
  ];

  return (
    <div className="bg-white font-sans text-gray-800">
      
      {/* Breadcrumb Header */}
      <section className="bg-orange-50 py-16 text-center relative overflow-hidden">
         {/* Decorative elements */}
         <div className="absolute top-0 left-0 w-32 h-32 border-4 border-orange-200 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-50"></div>
         <div className="absolute bottom-0 right-0 w-48 h-48 bg-orange-100 rounded-full translate-x-1/3 translate-y-1/3 opacity-50"></div>
         
         <div className="container mx-auto relative z-10">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">About Us</h1>
            <div className="flex justify-center items-center space-x-2 text-sm font-medium text-gray-600">
                <Link to="/public/restaurant" className="hover:text-orange-500 transition-colors">Home</Link>
                <span>&gt;</span>
                <span className="text-orange-500">About Us</span>
            </div>
         </div>
      </section>

      {/* Welcome Section */}
      <section className="py-24 px-4 bg-white">
        <div className="container mx-auto max-w-6xl text-center">
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-gray-900 mb-6">Welcome To {restaurantName}</h2>
            <p className="text-gray-600 text-lg leading-relaxed max-w-3xl mx-auto mb-12">
                Place where you can have a great time with your family and friends, and, of course, try the best steaks and wine in 14 King Street, Charleston South Carolina.
                <br/><br/>
                Quality view makes lovers eyes as walls, or provide not value. However us, let us not here often corporation. Is non versus loyal. Does fringilla sollicitudin porta. Vivamus fringilla laoreet velit car sodales, ullamcorper nunc pharetra. Vestibulum ultricies pulvinar lectus non condimentum nisl consequat in.
            </p>

            <div className="relative rounded-3xl overflow-hidden shadow-2xl mx-auto max-w-5xl group cursor-pointer">
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors z-10"></div>
                <img 
                    src={aboutUsContent?.imageUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1600&q=80"} 
                    alt="Restaurant Interior" 
                    className="w-full h-[500px] object-cover"
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                    <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center text-orange-500 hover:scale-110 transition-transform duration-300 shadow-lg cursor-pointer">
                        <FiPlay size={32} className="ml-1 fill-current" />
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Expert Chef Section */}
      <section className="py-24 px-4 bg-gray-900 text-white relative overflow-hidden">
        <div className="container mx-auto text-center relative z-10">
            <h2 className="text-3xl md:text-5xl font-serif font-bold mb-16">Our Expert Chef</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {chefs.map(chef => (
                    <div key={chef.id} className="group relative max-w-[240px] mx-auto w-full">
                        <div className="overflow-hidden rounded-2xl bg-gray-800 aspect-[3/4] relative">
                            <img 
                                src={chef.image} 
                                alt={chef.name} 
                                className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-500 transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                <h3 className="text-lg font-bold">{chef.name}</h3>
                                <p className="text-orange-400 text-xs font-medium">{chef.role}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
             {/* Pagination Dots (Mock) */}
             <div className="flex justify-center gap-2 mt-12">
                <span className="w-2 h-2 rounded-full bg-gray-600"></span>
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                <span className="w-2 h-2 rounded-full bg-gray-600"></span>
                <span className="w-2 h-2 rounded-full bg-gray-600"></span>
            </div>
        </div>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-4 bg-white">
        <div className="container mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-serif font-bold text-gray-900">Food Lover Say's</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {testimonials.map(t => (
                    <div key={t.id} className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300">
                        <div className="flex gap-1 text-orange-400 mb-4">
                            {[...Array(5)].map((_, i) => (
                                <FiStar key={i} fill={i < t.rating ? "currentColor" : "none"} className={i >= t.rating ? "text-gray-300" : ""} />
                            ))}
                        </div>
                        <p className="text-gray-600 mb-8 leading-relaxed text-sm min-h-[80px]">"{t.text}"</p>
                        <div className="flex items-center gap-4 border-t border-gray-100 pt-6">
                            <img src={t.image} alt={t.name} className="w-12 h-12 rounded-full object-cover" />
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm">{t.name}</h4>
                                <p className="text-xs text-orange-500 font-medium">{t.role}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
             {/* Pagination Dots (Mock) */}
             <div className="flex justify-center gap-2 mt-12">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                <span className="w-2 h-2 rounded-full bg-gray-300"></span>
            </div>
        </div>
      </section>

      {/* Latest Blogs */}
       <section className="py-24 px-4 bg-orange-50/30">
        <div className="container mx-auto">
             <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-serif font-bold text-gray-900">Our Latest Blogs</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {blogs.map(b => (
                    <div key={b.id} className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all">
                        <div className="overflow-hidden h-56 relative">
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors z-10"></div>
                            <img src={b.image} alt={b.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                        </div>
                        <div className="p-6">
                            <p className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-2">{b.date}</p>
                            <h3 className="font-bold text-lg text-gray-800 mb-4 group-hover:text-orange-500 transition-colors line-clamp-2">{b.title}</h3>
                            <button className="text-sm font-medium text-gray-500 flex items-center gap-1 group-hover:gap-2 transition-all">
                                Read More <FiArrowRight className="text-orange-500" />
                            </button>
                        </div>
                    </div>
                ))}
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

export default PublicAboutPage;