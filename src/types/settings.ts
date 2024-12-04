export type JalurPeriod = {
  start: string;    // Format: YYYY-MM-DD
  end: string;      // Format: YYYY-MM-DD
  isActive: boolean;
  testDate?: string; // Tanggal ujian/tes khusus
  announcementDate?: string; // Tambah tanggal pengumuman per jalur
  requirements: string[]; // Tambah array persyaratan
};

export type AdminContact = {
  name: string;
  whatsapp: string;
};

export type PPDBSettings = {
  academicYear: string;
  jalurPrestasi: JalurPeriod;
  jalurReguler: JalurPeriod;
  jalurUndangan: JalurPeriod;
  isActive: boolean;
  contactWhatsapp: {
    admin1: AdminContact;
    admin2: AdminContact;
    admin3: AdminContact;
    admin4: AdminContact;
  };
  announcementDate?: string;
}; 