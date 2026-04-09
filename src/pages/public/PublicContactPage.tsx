import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { FiMapPin, FiPhone, FiMail, FiFacebook, FiTwitter, FiInstagram, FiLinkedin, FiArrowRight } from 'react-icons/fi';

const PublicContactPage: React.FC = () => {
  const { outlet } = useOutletContext<{ outlet: any }>();
  const { websiteSettings } = useRestaurantData();
  const { contactUsContent } = websiteSettings;

  return (
    <div className="bg-white font-sans text-gray-800">
      
      {/* Breadcrumb Header */}
      <section className="bg-orange-50 py-16 text-center relative overflow-hidden">
         {/* Decorative elements */}
         <div className="absolute top-0 left-0 w-32 h-32 border-4 border-orange-200 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-50"></div>
         <div className="absolute bottom-0 right-0 w-48 h-48 bg-orange-100 rounded-full translate-x-1/3 translate-y-1/3 opacity-50"></div>
         
         <div className="container mx-auto relative z-10">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">Contact Us</h1>
            <div className="flex justify-center items-center space-x-2 text-sm font-medium text-gray-600">
                <Link to="/public/restaurant" className="hover:text-orange-500 transition-colors">Home</Link>
                <span>&gt;</span>
                <span className="text-orange-500">Contact Us</span>
            </div>
         </div>
      </section>

      {/* Contact Content */}
      <section className="py-24 px-4 bg-white">
        <div className="container mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                
                {/* Contact Form */}
                <div>
                    <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">Get Intouch</h2>
                    <p className="text-gray-600 mb-8 text-sm">Have a question or just want to say hi? We'd love to hear from you.</p>
                    
                    <form className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <input type="text" className="w-full px-6 py-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-orange-200 focus:bg-white transition-all placeholder-gray-400" placeholder="Your Name" />
                            <input type="text" className="w-full px-6 py-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-orange-200 focus:bg-white transition-all placeholder-gray-400" placeholder="Your Phone Number" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <input type="email" className="w-full px-6 py-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-orange-200 focus:bg-white transition-all placeholder-gray-400" placeholder="Your Email Address" />
                            <input type="text" className="w-full px-6 py-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-orange-200 focus:bg-white transition-all placeholder-gray-400" placeholder="Your Company Name" />
                        </div>
                        <textarea className="w-full px-6 py-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-orange-200 focus:bg-white transition-all placeholder-gray-400 h-40 resize-none" placeholder="Write Message"></textarea>
                        
                        <button type="button" className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-10 rounded-xl shadow-lg shadow-orange-500/30 transition-all transform hover:-translate-y-1">
                            Send Your Message
                        </button>
                    </form>
                </div>

                {/* Contact Info Card */}
                <div className="bg-white rounded-3xl p-10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 h-fit self-center relative overflow-hidden">
                    {/* Decorative dot pattern */}
                    <div className="absolute bottom-0 right-0 p-6 opacity-10">
                        <div className="grid grid-cols-6 gap-2">
                            {[...Array(24)].map((_, i) => <div key={i} className="w-1 h-1 bg-orange-500 rounded-full"></div>)}
                        </div>
                    </div>

                    <div className="space-y-8 relative z-10">
                        <div className="flex items-start gap-5">
                            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 flex-shrink-0">
                                <FiMapPin size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-lg mb-1">Location</h4>
                                <p className="text-gray-500 text-sm leading-relaxed">{contactUsContent?.address || '123 Food Street, Flavor Town, FT 12345'}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-5">
                            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 flex-shrink-0">
                                <FiMail size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-lg mb-1">Email</h4>
                                <p className="text-gray-500 text-sm">{contactUsContent?.email || 'contact@restaurantapp.com'}</p>
                                <p className="text-gray-500 text-sm">support@restaurantapp.com</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-5">
                            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 flex-shrink-0">
                                <FiPhone size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-lg mb-1">Phone</h4>
                                <p className="text-gray-500 text-sm">{contactUsContent?.phone || '+1 234 567 890'}</p>
                                <p className="text-gray-500 text-sm">+1 987 654 321</p>
                            </div>
                        </div>

                        <div className="pt-4">
                            <h4 className="font-bold text-gray-900 text-lg mb-4">Follow Us</h4>
                            <div className="flex gap-3">
                                <a href="#" className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-colors"><FiFacebook /></a>
                                <a href="#" className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-colors"><FiTwitter /></a>
                                <a href="#" className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-colors"><FiInstagram /></a>
                                <a href="#" className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-colors"><FiLinkedin /></a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Full Width Map */}
      <section className="h-[500px] w-full relative">
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
             {/* Map Placeholder or Iframe */}
             {contactUsContent?.mapUrl ? (
                <iframe 
                    src={contactUsContent.mapUrl} 
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Map Location"
                    className="filter grayscale contrast-125" // Optional: styling to match the image's dark map look
                ></iframe>
             ) : (
                 <div className="text-gray-400 flex flex-col items-center">
                     <FiMapPin size={48} className="mb-2" />
                     <p>Map Location</p>
                 </div>
             )}
             
             {/* Overlay Text (optional, to mimic the image's "Use ctrl + scroll to zoom" if it was an interactive map) */}
             <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm pointer-events-none">
                Use ctrl + scroll to zoom the map
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

export default PublicContactPage;