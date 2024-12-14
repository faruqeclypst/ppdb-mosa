import React, { useEffect, useRef } from 'react';
import Container from '../ui/Container';
import { motion, useAnimation } from 'framer-motion';
import { StarIcon } from '@heroicons/react/24/outline';
import { useMediaQuery } from 'react-responsive';

// Types
type Testimonial = {
  id: number;
  content: string;
  author: string;
  role: string;
  rating: number;
  image: string;
};

// Constants
const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    content: "SMAN Modal Bangsa memberikan pengalaman belajar yang luar biasa. Saya belajar tidak hanya akademik tapi juga nilai-nilai kehidupan yang berharga.",
    author: "Faisal Alam",
    role: "Siswa Kelas XI",
    rating: 5,
    image: "/images/testimonials/1.jpg"
  },
  {
    id: 2,
    content: "Sebagai orang tua, saya sangat puas dengan perkembangan anak saya. Para guru sangat profesional dan perhatian terhadap setiap siswa.",
    author: "Rini Rosita",
    role: "Orang Tua Siswa",
    rating: 5,
    image: "/images/testimonials/2.jpg"
  },
  {
    id: 3,
    content: "Fasilitas dan program pembelajaran di sini sangat mendukung pengembangan potensi siswa. Saya merasa beruntung bisa bersekolah di sini.",
    author: "Ahmad Rizki",
    role: "Siswa Kelas XII",
    rating: 5,
    image: "/images/testimonials/3.jpg"
  },
  {
    id: 4,
    content: "Program ekstrakurikuler di SMAN Modal Bangsa sangat beragam dan membantu mengembangkan bakat siswa.",
    author: "Putri Handayani",
    role: "Siswi Kelas X",
    rating: 4,
    image: "/images/testimonials/4.jpg"
  },
  {
    id: 5,
    content: "Guru-guru di sini tidak hanya mengajar, tapi juga membimbing dan memotivasi siswa untuk terus berkembang.",
    author: "Dimas Pratama",
    role: "Alumni 2022",
    rating: 5,
    image: "/images/testimonials/5.jpg"
  },
  {
    id: 6,
    content: "Sistem asrama di SMAN Modal Bangsa mengajarkan kemandirian dan kedisiplinan yang sangat bermanfaat.",
    author: "Annisa Rahma",
    role: "Siswi Kelas XI",
    rating: 5,
    image: "/images/testimonials/6.jpg"
  },
  {
    id: 7,
    content: "Prestasi akademik dan non-akademik siswa di sini sangat membanggakan. Lingkungan belajar sangat mendukung.",
    author: "Budi Santoso",
    role: "Orang Tua Siswa",
    rating: 5,
    image: "/images/testimonials/7.jpg"
  },
  {
    id: 8,
    content: "Saya sangat terkesan dengan program pembinaan karakter yang diterapkan di SMAN Modal Bangsa.",
    author: "Maya Sari",
    role: "Alumni 2021",
    rating: 4,
    image: "/images/testimonials/8.jpg"
  },
  {
    id: 9,
    content: "Kegiatan pembelajaran di sini sangat interaktif dan menyenangkan. Para guru selalu memberikan yang terbaik.",
    author: "Fajar Ramadhan",
    role: "Siswa Kelas X",
    rating: 5,
    image: "/images/testimonials/9.jpg"
  },
  {
    id: 10,
    content: "SMAN Modal Bangsa benar-benar mempersiapkan siswa untuk masa depan yang lebih baik.",
    author: "Dewi Lestari",
    role: "Orang Tua Siswa",
    rating: 5,
    image: "/images/testimonials/10.jpg"
  },
  {
    id: 11,
    content: "Pengalaman belajar di sini sangat berkesan dan membentuk karakter saya menjadi lebih baik.",
    author: "Rizky Pratama",
    role: "Alumni 2023",
    rating: 5,
    image: "/images/testimonials/11.jpg"
  },
  {
    id: 12,
    content: "Komunitas belajar yang sangat supportif dan memotivasi untuk terus berprestasi.",
    author: "Siti Nurhaliza",
    role: "Siswi Kelas XII",
    rating: 4,
    image: "/images/testimonials/12.jpg"
  },
  {
    id: 13,
    content: "Program akademik yang ditawarkan sangat komprehensif dan mempersiapkan siswa untuk pendidikan tinggi.",
    author: "Andi Wijaya",
    role: "Guru",
    rating: 5,
    image: "/images/testimonials/13.jpg"
  },
  {
    id: 14,
    content: "Lingkungan asrama yang nyaman dan kondusif untuk belajar dan bersosialisasi.",
    author: "Nina Safitri",
    role: "Siswi Kelas XI",
    rating: 5,
    image: "/images/testimonials/14.jpg"
  },
  {
    id: 15,
    content: "Fasilitas laboratorium dan perpustakaan sangat mendukung proses pembelajaran.",
    author: "Reza Firmansyah",
    role: "Siswa Kelas XII",
    rating: 4,
    image: "/images/testimonials/15.jpg"
  },
  {
    id: 16,
    content: "Program pembinaan olimpiade di SMAN Modal Bangsa sangat baik dan telah menghasilkan banyak prestasi.",
    author: "Diana Putri",
    role: "Alumni 2022",
    rating: 5,
    image: "/images/testimonials/16.jpg"
  }
];

const TestimonialCard: React.FC<{ testimonial: Testimonial }> = ({ testimonial }) => (
  <motion.div 
    className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300"
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className="flex items-start mb-4">
      <div className="w-16 h-16 flex-shrink-0 mr-4">
        <img 
          src={testimonial.image} 
          alt={testimonial.author} 
          className="w-full h-full rounded-full object-cover" 
        />
      </div>
      <div className="flex-grow">
        <h3 className="font-bold text-xl text-gray-800 mb-1">{testimonial.author}</h3>
        <p className="text-sm text-gray-600 mb-2">{testimonial.role}</p>
        <div className="flex mb-2">
          {[...Array(5)].map((_, i) => (
            <StarIcon 
              key={i} 
              className={`w-5 h-5 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
            />
          ))}
        </div>
        <p className="text-gray-600 leading-relaxed">{testimonial.content}</p>
      </div>
    </div>
  </motion.div>
);

const TestimonialsSection: React.FC = () => {
  const isMobile = useMediaQuery({ query: '(max-width: 768px)' });
  const controlsLeft = useAnimation();
  const controlsRight = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollAnimation = async () => {
      const containerHeight = containerRef.current?.offsetHeight || 0;
      const viewportHeight = 500;
      const scrollDistance = containerHeight - viewportHeight;

      // Animasi untuk kolom kiri (bergerak ke atas)
      controlsLeft.start({
        y: [0, -scrollDistance, 0],
        transition: {
          y: {
            repeat: Infinity,
            repeatType: "reverse",
            duration: 120,
            ease: "linear",
          },
        },
      });

      // Animasi untuk kolom kanan (bergerak ke bawah)
      controlsRight.start({
        y: [-scrollDistance, 0, -scrollDistance],
        transition: {
          y: {
            repeat: Infinity,
            repeatType: "reverse",
            duration: 120,
            ease: "linear",
          },
        },
      });
    };

    if (!isMobile) {
      scrollAnimation();
    }
  }, [controlsLeft, controlsRight, isMobile]);

  // Memisahkan testimonial untuk kolom kiri dan kanan
  const leftTestimonials = TESTIMONIALS.slice(0, TESTIMONIALS.length / 2);
  const rightTestimonials = TESTIMONIALS.slice(TESTIMONIALS.length / 2);

  return (
    <section className="py-16 md:py-20 bg-gradient-to-b from-gray-100 to-white overflow-hidden">
      <Container>
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 className="text-5xl font-extrabold mb-4 text-gray-800 leading-tight">
            Apa Kata <span className="text-blue-600">Mereka</span>
          </h2>
          <div className="bg-blue-600 w-24 h-2 mb-8 mx-auto rounded-full"></div>
          <p className="text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Dengarkan pengalaman langsung dari siswa dan alumni SMAN Modal Bangsa
          </p>
        </motion.div>

        <div className="relative overflow-hidden" style={{ height: '500px' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" ref={containerRef}>
            {/* Kolom Kiri */}
            <motion.div 
              className="space-y-6"
              animate={controlsLeft}
            >
              {leftTestimonials.map((testimonial) => (
                <TestimonialCard key={testimonial.id} testimonial={testimonial} />
              ))}
            </motion.div>

            {/* Kolom Kanan */}
            <motion.div 
              className="space-y-6"
              animate={controlsRight}
            >
              {rightTestimonials.map((testimonial) => (
                <TestimonialCard key={testimonial.id} testimonial={testimonial} />
              ))}
            </motion.div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default TestimonialsSection; 