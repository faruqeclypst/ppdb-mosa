import React from 'react';
import Container from '../ui/Container';
import Card from '../ui/Card';

const TestimonialsSection: React.FC = () => {
  return (
    <section className="bg-gray-100 py-20">
      <Container>
        <h2 className="text-3xl font-bold text-center mb-12">Testimoni</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <p>"SMAN Modal Bangsa memberikan pengalaman belajar yang luar biasa!"</p>
            <p className="mt-4 font-semibold">- Budi, Alumni</p>
          </Card>
          <Card>
            <p>"Fasilitas dan kurikulum yang sangat mendukung perkembangan siswa."</p>
            <p className="mt-4 font-semibold">- Siti, Orang Tua Siswa</p>
          </Card>
        </div>
      </Container>
    </section>
  );
};

export default TestimonialsSection; 