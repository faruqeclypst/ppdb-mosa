import React from 'react';
import Container from '../ui/Container';
import Card from '../ui/Card';

const FeaturesSection: React.FC = () => {
  return (
    <section className="py-20">
      <Container>
        <h2 className="text-3xl font-bold text-center mb-12">Fitur Unggulan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <h3 className="text-xl font-semibold mb-2">Kurikulum Terbaru</h3>
            <p>Kurikulum yang selalu diperbarui sesuai dengan kebutuhan zaman.</p>
          </Card>
          <Card>
            <h3 className="text-xl font-semibold mb-2">Fasilitas Lengkap</h3>
            <p>Fasilitas modern untuk mendukung proses belajar mengajar.</p>
          </Card>
          <Card>
            <h3 className="text-xl font-semibold mb-2">Pengajar Profesional</h3>
            <p>Tenaga pengajar yang berpengalaman dan berdedikasi tinggi.</p>
          </Card>
        </div>
      </Container>
    </section>
  );
};

export default FeaturesSection; 