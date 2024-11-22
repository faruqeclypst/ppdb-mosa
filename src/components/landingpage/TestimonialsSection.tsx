import React from 'react';
    // Start of Selection
    import Container from '../ui/Container';
    import { motion } from 'framer-motion';
    import { StarIcon } from '@heroicons/react/24/outline';
    import { ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';
    
    // Types
    type Testimonial = {
  content: string;
  author: string;
  role: string;
  rating: number;
  image: string;
  className?: string;
};

// Constants
const TESTIMONIALS: Testimonial[] = [
  {
    content: "SMAN Modal Bangsa memberikan pengalaman belajar yang luar biasa. Saya belajar tidak hanya akademik tapi juga nilai-nilai kehidupan yang berharga.",
    author: "Faisal Alam",
    role: "Siswa Kelas XI",
    rating: 5,
    image: "/images/testimonials/faisal.png"
  },
  {
    content: "Sebagai orang tua, saya sangat puas dengan perkembangan anak saya. Para guru sangat profesional dan perhatian terhadap setiap siswa.",
    author: "Rini Rosita",
    role: "Orang Tua Siswa",
    rating: 5,
    image: "/images/testimonials/rini.jpg"
  },
  {
    content: "Fasilitas dan program pembelajaran di sini sangat mendukung pengembangan potensi siswa. Saya merasa beruntung bisa bersekolah di sini.",
    author: "Fandira",
    role: "Siswa Kelas XI",
    rating: 5,
    image: "/images/testimonials/fandira.png"
  }
];

// Components
const RatingStars: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex gap-1">
    {Array.from({ length: 5 }).map((_, index) => (
      <StarIcon
        key={index}
        className={`w-5 h-5 ${
          index < rating ? 'text-yellow-400' : 'text-gray-300'
        }`}
      />
    ))}
  </div>
);

const TestimonialCard: React.FC<Testimonial & { index: number }> = ({
  content,
  author,
  role,
  rating,
  image,
  className,
  index
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: index * 0.2 }}
    viewport={{ once: true }}
    className="relative group"
  >
    <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg blur opacity-0 group-hover:opacity-10 transition duration-500" />
    <div className={`relative bg-white rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 ${className}`}>
      <ChatBubbleBottomCenterTextIcon className="w-8 h-8 text-blue-500/20 absolute top-4 left-4" />
      
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
          <img 
            src={image} 
            alt={author}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">{author}</h4>
          <p className="text-sm text-gray-600">{role}</p>
        </div>
        <div className="ml-auto">
          <RatingStars rating={rating} />
        </div>
      </div>
      
      <p className="text-gray-600 leading-relaxed">
        "{content}"
      </p>
    </div>
  </motion.div>
);

// Main Component
const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-12 sm:py-24 bg-gradient-to-b from-white to-gray-50">
      <Container>
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
              Apa Kata Mereka?
            </h2>
            <p className="text-base sm:text-lg text-gray-600">
              Dengarkan pengalaman langsung dari siswa, alumni, dan orang tua tentang
              SMAN Modal Bangsa
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
          {TESTIMONIALS.map((testimonial, index) => (
            <TestimonialCard 
              key={index} 
              {...testimonial} 
              index={index} 
              className="p-4 sm:p-8"
            />
          ))}
        </div>
{/* 
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-gray-600">
            Dan masih banyak lagi testimoni positif dari keluarga besar SMAN Modal Bangsa
          </p>
        </motion.div> */}
      </Container>
    </section>
  );
};

export default TestimonialsSection; 