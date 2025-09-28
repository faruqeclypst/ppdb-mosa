# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a React TypeScript application for PPDB (Penerimaan Peserta Didik Baru - New Student Registration) system for SMAN Modal Bangsa, built with Vite, Firebase, and Tailwind CSS. The application allows students to register online for high school admission through different pathways (Prestasi/Achievement, Reguler/Regular, Undangan/Invitation).

## Common Development Commands

### Development Server
```bash
npm run dev              # Start development server on http://localhost:5173
```

### Building and Testing
```bash
npm run build           # Type-check and build for production
npm run preview         # Preview production build locally
npm run lint            # Run ESLint for code quality
```

### Type Checking
```bash
npx tsc --noEmit        # Run TypeScript compiler for type checking only
```

## Architecture Overview

### Project Structure
- **Frontend**: React 18 with TypeScript, using Vite as build tool
- **Styling**: Tailwind CSS with custom design system
- **Backend**: Firebase (Authentication, Realtime Database, Hosting)
- **File Storage**: AWS S3 (Cloudflare R2) for document uploads
- **Routing**: React Router v6 with nested layouts
- **State Management**: React Context API for authentication and global state

### Key Directories
- `src/components/` - Reusable UI components organized by feature
  - `ui/` - Generic UI components (Button, Input, Modal, etc.)
  - `landingpage/` - Landing page specific components
  - `admin/` - Admin dashboard components with nested layout structure
- `src/pages/` - Route-level components
- `src/contexts/` - React context providers (AuthContext)
- `src/firebase/` - Firebase configuration and services
- `src/services/` - External service integrations (Cloudflare R2)
- `src/types/` - TypeScript type definitions
- `src/utils/` - Utility functions and constants

### Multi-School Architecture
The application supports multiple schools (SMAN Modal Bangsa and SMAN 10 Fajar Harapan) with:
- Separate Firebase database paths: `ppdb_mosa/` and `ppdb_fajar/`
- School-specific branding and configuration
- Conditional rendering based on selected school

## Key Technologies & Dependencies

### Core Framework
- **React 18.3** with TypeScript
- **Vite 5.4** for fast development and building
- **React Router 6.28** for client-side routing

### UI & Styling
- **Tailwind CSS 3.4** with custom color palette (primary blue theme)
- **Headless UI** for accessible components
- **Heroicons** for consistent iconography
- **Framer Motion** for animations and page transitions

### Firebase Integration
- **Authentication**: Email/password authentication with role-based access
- **Realtime Database**: Structured data for students, admins, and PPDB settings
- **Hosting**: Static site deployment

### File Handling
- **AWS SDK**: S3 client for Cloudflare R2 storage
- **Browser Image Compression**: Client-side image optimization
- **PDF-lib**: Generate registration cards as PDFs
- **React-PDF**: PDF viewing capabilities

## Authentication & Authorization

The application uses Firebase Authentication with a two-tier role system:

### User Roles
- **PPDB Users**: Students filling registration forms
- **Admin Users**: School administrators managing applications
  - Can have `school` property: 'mosa', 'fajar', or 'all'
  - Can have `isMaster` flag for super admin privileges

### Auth Context Structure
```typescript
type UserRole = {
  role: 'admin' | 'ppdb';
  school?: 'mosa' | 'fajar' | 'all';
  isMaster?: boolean;
}
```

## PPDB Registration System

### Registration Pathways (Jalur)
1. **Prestasi** (Achievement): For students with academic/non-academic achievements
2. **Reguler** (Regular): General admission based on academic scores  
3. **Undangan** (Invitation): By school recommendation

### Form Structure
The registration form is organized in tabs:
1. **Student Information**: Personal data, school origin
2. **Academic**: Grade reports for semesters 2-4 (varies by pathway)
3. **Parent Information**: Father and mother details
4. **Documents**: Upload requirements (photo, recommendation letter, report cards)

### File Upload System
- **Cloudflare R2**: Primary storage with path structure `ppdb_{school}/{user_uid}/{document_type}`
- **Compression**: Automatic image compression to reduce file sizes
- **Validation**: Type checking (PDF for documents, images for photos)
- **Size limits**: 4MB for documents, optimized compression for photos

## Database Structure

### Firebase Realtime Database Schema
```
/ppdb_mosa/{userId}      # Modal Bangsa students
/ppdb_fajar/{userId}     # Fajar Harapan students
/admins/{userId}         # Admin accounts
/settings/ppdb           # PPDB configuration (periods, requirements)
```

### Student Record Structure
Each student record includes metadata (status, timestamps), personal data, academic scores, parent information, and file URLs.

## Component Architecture

### UI Component System
- Consistent design system with Tailwind utility classes
- Reusable components with TypeScript props
- Accessibility-first approach using Headless UI
- Responsive design with mobile-first approach

### Layout Components
- **PublicLayout**: Header/Footer wrapper for public pages
- **AdminLayout**: Sidebar navigation for admin dashboard  
- **Routing**: Conditional layouts based on route patterns

### Form Components
- **Multi-step forms** with tab navigation
- **File upload** with drag-and-drop and compression
- **Validation** with real-time feedback
- **Auto-save** as draft functionality

## Development Guidelines

### TypeScript Usage
- Strict TypeScript configuration enabled
- Interface definitions for all data structures
- Proper typing for Firebase operations and API responses
- Custom type definitions in `src/types/`

### State Management Patterns
- **Context API** for global state (authentication)
- **Local state** with useState for component-specific data
- **useEffect** for data fetching and side effects
- **Custom hooks** for reusable logic

### Error Handling
- **Alert system** with toast notifications (`react-hot-toast`)
- **Loading states** for async operations
- **Form validation** with user-friendly error messages
- **Firebase error handling** with meaningful user feedback

### Performance Considerations
- **Code splitting** with React Router lazy loading
- **Image optimization** with browser-based compression
- **Bundle optimization** with Vite's tree shaking
- **Database queries** optimized for minimal reads

## Environment Setup

### Required Environment Variables
```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

### Development Dependencies
- **ESLint** with React and TypeScript rules
- **TypeScript** compiler with strict mode
- **Tailwind CSS** with PostCSS and Autoprefixer
- **Vite plugins** for React and development optimization

## Deployment Configuration

### Firebase Hosting
- **Build output**: `dist/` directory
- **SPA routing**: All routes redirect to `index.html`
- **Asset caching**: 1-year cache for static assets
- **Site ID**: `ppdb-mosatest` (test environment)

### Build Process
1. TypeScript compilation and type checking
2. Vite bundling with asset optimization
3. Tailwind CSS purging for production
4. Firebase deployment with hosting rules

This application represents a comprehensive student registration system with modern React patterns, Firebase integration, and a focus on user experience and accessibility.