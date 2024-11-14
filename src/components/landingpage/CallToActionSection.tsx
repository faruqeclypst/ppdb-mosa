import React from 'react';
import Container from '../ui/Container';
import Button from '../ui/Button';
import { Link } from 'react-router-dom';

const CallToActionSection: React.FC = () => {
  return (
    <section className="bg-green-600 text-white py-20">
      <Container>
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Bergabunglah dengan Kami!</h2>
          <p className="text-lg mb-8">Daftarkan diri Anda sekarang dan raih masa depan yang cerah.</p>
          <Link to="/register">
            <Button className="bg-white text-green-600 hover:bg-green-50">
              Daftar Sekarang
            </Button>
          </Link>
        </div>
      </Container>
    </section>
  );
};

export default CallToActionSection; 