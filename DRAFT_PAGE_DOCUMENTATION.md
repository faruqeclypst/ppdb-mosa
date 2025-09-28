# Data Draft Page - Documentation

## Overview
Halaman **Data Draft** adalah halaman baru yang ditambahkan ke admin dashboard PPDB MOSA untuk menampilkan data pendaftaran yang masih dalam status draft (belum selesai atau belum di-submit).

## Features

### 🔍 **Data Filtering & Search**
- **Search**: Mencari berdasarkan nama siswa, NISN, atau asal sekolah
- **Filter Jalur**: Prestasi, Reguler, Undangan
- **Filter Sekolah** (untuk master admin): MOSA atau Fajar Harapan
- **Real-time filtering**: Filter otomatis saat mengetik

### 📊 **Statistics Cards**
- **Total Draft**: Jumlah total data draft
- **Draft Kosong**: Data draft yang belum terisi nama siswa
- **Draft Lengkap**: Data draft yang sudah terisi data utama
- **Total Users**: Jumlah user yang memiliki data draft

### 📋 **Data Display**
- **Desktop**: Tabel lengkap dengan pagination (10 items per halaman)
- **Mobile**: List view yang responsive dengan expand/collapse
- **Status Badge**: Menampilkan status draft atau pending
- **School Badge**: Menampilkan sekolah (untuk master admin)
- **Jalur Badge**: Menampilkan jalur pendaftaran dengan warna berbeda

### ⚡ **Actions**
- **View Detail**: Melihat detail data draft dengan progress indicator
- **Delete Draft**: Menghapus data draft dengan konfirmasi
- **Export Excel**: Export data draft ke file Excel

### 🗑️ **File Cleanup**
- Otomatis menghapus file dari Cloudflare R2 saat menghapus data draft
- Mendukung cleanup untuk semua jenis file (photo, rekomendasi, raport, sertifikat)

## Navigation

### Menu Location
- **Sidebar**: Menu "Data Draft" dengan ikon DocumentTextIcon
- **Route**: `/admin/draft`
- **Mobile**: Bottom navigation dengan label "Draft"

### Access Control
- **Master Admin**: Dapat melihat data draft dari kedua sekolah
- **School Admin**: Hanya dapat melihat data draft dari sekolahnya

## Technical Implementation

### Component Structure
```
DataDraft.tsx
├── State Management (React hooks)
├── Data Loading (Firebase Realtime Database)
├── Filtering & Search Logic
├── Pagination Logic
├── File Deletion (with R2 cleanup)
├── Excel Export
├── UI Components
│   ├── StatCard
│   ├── DraftStatusBadge
│   ├── JalurBadge
│   ├── SchoolBadge
│   └── Modals (Detail, Delete Confirmation)
└── Responsive Design (Desktop & Mobile)
```

### Data Sources
- **Database**: `ppdb_mosa` dan `ppdb_fajar` collections
- **Filter Criteria**: `status === 'draft' || status === 'pending'`
- **Real-time Updates**: Data refresh otomatis saat ada perubahan

### File Management
- **Storage**: Cloudflare R2 bucket
- **Cleanup**: Otomatis hapus file saat delete data
- **Path Format**: `ppdb_{school}/{user.uid}/{filename}`

## User Interface

### Desktop Features
- **Full Table View**: Semua kolom data terlihat
- **Sorting**: Click header untuk sort (future enhancement)
- **Action Dropdown**: Menu aksi untuk setiap row
- **Pagination**: Navigation dengan info halaman

### Mobile Features
- **Expandable Cards**: Tap untuk expand detail
- **Touch Optimization**: Button yang mudah di-tap
- **Responsive Layout**: Otomatis menyesuaikan layar
- **Bottom Navigation**: Quick access menu

### Status Indicators
- **Draft Status**: Orange badge untuk draft
- **Pending Status**: Gray badge untuk pending
- **Progress Indicator**: Visual checklist kelengkapan data

## Data Export

### Excel Export Features
- **Comprehensive Data**: Semua field penting
- **School Separation**: Sheet terpisah berdasarkan sekolah (master admin)
- **Formatted Output**: Styling yang professional
- **Automatic Filename**: Include tanggal dan sekolah

### Export Columns
- Nomor, Nama, Email, Sekolah, Jalur, Status
- Tanggal Buat, Terakhir Update
- Data lengkap untuk analisis admin

## Security & Permissions

### Data Access
- **Role-based Access**: Master vs School admin
- **Data Isolation**: Admin sekolah hanya melihat data sekolahnya
- **Secure Deletion**: File cleanup dari storage cloud

### User Actions
- **Confirmation Required**: Hapus data memerlukan konfirmasi "HAPUS"
- **Audit Trail**: Log aktivitas admin (future enhancement)
- **Permission Checks**: Validasi role sebelum aksi

## Future Enhancements

### Planned Features
1. **Bulk Actions**: Select multiple dan bulk delete
2. **Advanced Filters**: Filter berdasarkan tanggal, kelengkapan data
3. **Data Analytics**: Chart dan statistik draft
4. **Email Notifications**: Reminder untuk draft yang terlalu lama
5. **Data Recovery**: Soft delete dengan kemampuan restore

### Performance Optimizations
1. **Virtual Scrolling**: Untuk dataset besar
2. **Lazy Loading**: Load data bertahap
3. **Caching**: Cache hasil filter dan search
4. **Background Sync**: Update data di background

## Usage Guidelines

### For Master Admin
1. Gunakan filter sekolah untuk fokus pada data tertentu
2. Monitor statistik untuk melihat tren pendaftaran
3. Export data secara berkala untuk backup
4. Bersihkan draft lama yang tidak aktif

### For School Admin
1. Monitor draft yang belum selesai
2. Hubungi user dengan draft kosong untuk bantuan
3. Export data untuk analisis internal
4. Bersihkan data draft yang tidak valid

## Testing Checklist

- [ ] Load data draft dengan benar
- [ ] Filter dan search berfungsi
- [ ] Pagination bekerja (10 items per page)
- [ ] Export Excel berhasil
- [ ] Delete dengan file cleanup
- [ ] Responsive di mobile
- [ ] Permission role-based
- [ ] Modal detail menampilkan progress
- [ ] Error handling yang baik
- [ ] Performance dengan data besar

## Troubleshooting

### Common Issues
1. **Data tidak muncul**: Cek permission dan role admin
2. **Export gagal**: Pastikan browser support download
3. **File tidak terhapus**: Cek konfigurasi R2 dan permission
4. **Mobile tidak responsive**: Clear browser cache

### Debug Mode
- Check browser console untuk error
- Monitor network tab untuk API calls
- Verify Firebase database rules
- Test R2 connection dengan test function

---

**Created**: September 2024  
**Version**: 1.0.0  
**Maintained by**: PPDB MOSA Development Team