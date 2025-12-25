

import React, { useState, useEffect, useCallback } from 'react';
import { SaasTestimonial } from '../../types';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface TestimonialSliderProps {
    testimonials: SaasTestimonial[];
}

const TestimonialSlider: React.FC<TestimonialSliderProps> = ({ testimonials }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleNext = useCallback(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, [testimonials.length]);

    const handlePrev = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length);
    };

    useEffect(() => {
        const timer = setInterval(() => {
            handleNext();
        }, 5000); // Change slide every 5 seconds

        return () => clearInterval(timer);
    }, [handleNext]);

    if (!testimonials || testimonials.length === 0) {
        return null;
    }

    return (
        <div className="relative w-full max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg overflow-hidden" style={{ minHeight: '350px' }}>
            {testimonials.map((testimonial, index) => (
                <div
                    key={testimonial.id}
                    className="absolute inset-0 transition-transform duration-700 ease-in-out flex flex-col items-center justify-center text-center p-8"
                    style={{ transform: `translateX(${(index - currentIndex) * 100}%)` }}
                >
                    <img src={testimonial.imageUrl} alt={testimonial.storeName} className="w-20 h-20 rounded-full object-cover mb-4 border-4 border-white shadow-md" />
                    <blockquote className="text-xl italic text-gray-700 max-w-2xl">
                        "{testimonial.description}"
                    </blockquote>
                    <cite className="mt-4 text-md font-semibold text-gray-900 not-italic">{testimonial.result}</cite>
                    <p className="mt-1 text-sm text-gray-500">{testimonial.storeName}</p>
                </div>
            ))}
            <button onClick={handlePrev} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/50 hover:bg-white p-2 rounded-full shadow-md transition-all z-10">
                <FiChevronLeft size={24} className="text-gray-700" />
            </button>
            <button onClick={handleNext} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/50 hover:bg-white p-2 rounded-full shadow-md transition-all z-10">
                <FiChevronRight size={24} className="text-gray-700" />
            </button>
        </div>
    );
};

export default TestimonialSlider;