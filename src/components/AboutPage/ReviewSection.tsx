'use client';

import { useKeenSlider } from 'keen-slider/react';
import 'keen-slider/keen-slider.min.css';

const ReviewSection = () => {
  const reviews = [
    { name: 'Sarah M.', comment: 'TutorLink helped me find the perfect tutor for my SATs. Highly recommended!', role: 'Student' },
    { name: 'James T.', comment: 'As a tutor, this platform gave me exposure and helped me connect with more students.', role: 'Tutor' },
    { name: 'Olivia R.', comment: 'A brilliant concept! Easy to use and effective for online learning.', role: 'Student' },
    { name: 'Michael B.', comment: 'This platform really simplified finding help for my child’s homework.', role: 'Student' },
    { name: 'Anna L.', comment: 'Great UX, intuitive interface, and real results!', role: 'Student' },
    { name: 'Olivia R.', comment: 'A brilliant concept! Easy to use and effective for online learning.', role: 'Parent' },
    { name: 'Michael B.', comment: 'This platform really simplified finding help for my child’s homework.', role: 'Parent' },
    { name: 'Anna L.', comment: 'Great UX, intuitive interface, and real results!', role: 'Student' },
  ];

  const [sliderRef] = useKeenSlider<HTMLDivElement>({
    loop: true,
    mode: 'free-snap',
    slides: {
      perView: 3,
      spacing: 15,
    },
    breakpoints: {
      '(max-width: 768px)': {
        slides: {
          perView: 1,
          spacing: 10,
        },
      },
      '(max-width: 1024px)': {
        slides: {
          perView: 2,
          spacing: 10,
        },
      },
    },
  });

  return (
    <section className="py-16 mb-16 px-4 bg-blue-50 dark:bg-blue-900">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-4xl font-bold text-blue-800 dark:text-white mb-10">What People Are Saying</h2>

        <div ref={sliderRef} className="keen-slider py-4">
          {reviews.map((review, idx) => (
            <div
              key={idx}
              className="keen-slider__slide bg-white dark:bg-gray-800 p-6 rounded-xl shadow-blue-600 shadow-md hover:shadow-lg transition text-left"
            >
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-3 italic">{review.comment}</p>
              <h3 className="text-blue-700 dark:text-white font-semibold text-base">{review.name}</h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">{review.role}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ReviewSection;
