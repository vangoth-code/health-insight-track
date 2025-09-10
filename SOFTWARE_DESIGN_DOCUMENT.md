# Health Insight Tracker - Software Design Document

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Component Architecture](#component-architecture)
5. [Data Flow](#data-flow)
6. [OCR Processing Pipeline](#ocr-processing-pipeline)
7. [Database Schema](#database-schema)
8. [API Design](#api-design)
9. [Security Considerations](#security-considerations)
10. [Performance Considerations](#performance-considerations)
11. [Testing Strategy](#testing-strategy)
12. [Deployment Architecture](#deployment-architecture)

## Project Overview

### Purpose
The Health Insight Tracker is a comprehensive web application designed to extract, analyze, and visualize blood test reports from scanned images and PDF documents. The system uses advanced OCR (Optical Character Recognition) technology to automatically extract blood parameters and provides trend analysis, comparison tools, and health insights.

### Key Features
- **OCR-based Report Processing**: Extract blood parameters from scanned images and PDFs
- **Multi-Patient Support**: Manage multiple patients with separate health records
- **Trend Analysis**: Visualize parameter changes over time
- **Comparison Tools**: Compare current vs. previous reports
- **Health Insights**: AI-powered health recommendations
- **Manual Data Entry**: Fallback option for data entry
- **Real-time Processing**: Immediate feedback on upload and processing

## Technology Stack

### Frontend Technologies
```
React 18.3.1
├── TypeScript 5.5.3
├── Vite 5.4.1 (Build Tool)
├── Tailwind CSS 3.4.11 (Styling)
├── Shadcn/ui (Component Library)
│   ├── Radix UI (Primitives)
│   ├── Lucide React (Icons)
│   └── Class Variance Authority (Styling Utilities)
├── React Router DOM 6.26.2 (Routing)
├── React Hook Form 7.53.0 (Form Management)
├── React Query (@tanstack/react-query) 5.56.2 (Data Fetching)
└── Recharts 2.12.7 (Data Visualization)
```

### OCR & Document Processing
```
Hugging Face Transformers 3.7.0
├── TrOCR Model (Xenova/trocr-base-printed)
├── PDF.js 5.3.93 (PDF Processing)
├── PDF-lib 1.17.1 (PDF Manipulation)
└── Canvas API (Image Processing)
```

### Development Tools
```
ESLint 9.9.0 (Code Linting)
├── TypeScript ESLint 8.0.1
├── Prettier (Code Formatting)
└── Husky (Git Hooks)
```

## System Architecture

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Application                     │
├─────────────────────────────────────────────────────────────┤
│  React App (TypeScript + Vite)                             │
│  ├── Component Layer                                       │
│  ├── Service Layer                                         │
│  ├── State Management                                      │
│  └── UI Framework (Shadcn/ui)                              │
├─────────────────────────────────────────────────────────────┤
│                    OCR Processing Layer                     │
│  ├── Hugging Face Transformers.js                          │
│  ├── Image Preprocessing                                   │
│  ├── PDF Processing                                        │
│  └── Text Extraction                                       │
├─────────────────────────────────────────────────────────────┤
│                    Data Processing Layer                    │
│  ├── Parameter Extraction                                  │
│  ├── Data Validation                                       │
│  ├── Trend Analysis                                        │
│  └── Health Insights                                       │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture Diagram
```
App.tsx
├── QueryClientProvider
├── TooltipProvider
├── Toaster Components
└── BrowserRouter
    └── Routes
        ├── Index (Main Dashboard)
        └── NotFound

Index.tsx
└── BloodReportDashboard
    ├── PatientSelector
    ├── Tabs Container
    │   ├── Overview Tab
    │   │   ├── ParameterCard (Grid)
    │   │   └── Quick Insights
    │   ├── Trends Tab
    │   │   └── TrendChart
    │   ├── Comparison Tab
    │   │   └── ComparisonView
    │   ├── Insights Tab
    │   │   └── SuggestionsPanel
    │   ├── Upload Tab
    │   │   ├── FileUpload
    │   │   └── ManualDataEntry
    │   └── OCR Test Tab
    │       └── OCRTester
    └── BloodReportExtractor (Service)
```

## Component Architecture

### Core Components

#### 1. BloodReportDashboard (Main Container)
**Location**: `src/components/BloodReportDashboard.tsx`
**Purpose**: Main application container managing state and coordinating all features

**Key Responsibilities**:
- State management for reports, patients, and UI
- File upload handling and OCR processing
- Tab navigation and content switching
- Data flow coordination between components

**State Management**:
```typescript
interface DashboardState {
  reports: BloodReport[];
  selectedPatient: string;
  activeTab: string;
}
```

#### 2. PatientSelector
**Location**: `src/components/PatientSelector.tsx`
**Purpose**: Patient management and selection interface

**Features**:
- Multi-patient support with automatic detection
- Patient statistics display
- Dynamic patient switching
- Report count tracking

#### 3. FileUpload
**Location**: `src/components/FileUpload.tsx`
**Purpose**: Drag-and-drop file upload interface

**Features**:
- Multi-file upload support
- File validation (type, size)
- Progress tracking
- Error handling and user feedback
- Batch processing capabilities

#### 4. TrendChart
**Location**: `src/components/TrendChart.tsx`
**Purpose**: Data visualization for parameter trends

**Features**:
- Interactive line charts using Recharts
- Parameter selection dropdown
- Optimal range visualization
- Time-series data display
- Responsive design

#### 5. ComparisonView
**Location**: `src/components/ComparisonView.tsx`
**Purpose**: Side-by-side report comparison

**Features**:
- Current vs. previous report comparison
- Change percentage calculations
- Significance level indicators
- Parameter-by-parameter analysis
- Summary statistics

#### 6. SuggestionsPanel
**Location**: `src/components/SuggestionsPanel.tsx`
**Purpose**: AI-powered health insights and recommendations

**Features**:
- Overall health score calculation
- Parameter-specific recommendations
- Priority-based action items
- General health guidelines
- Personalized insights

#### 7. ParameterCard
**Location**: `src/components/ParameterCard.tsx`
**Purpose**: Individual parameter display with status indicators

**Features**:
- Parameter value display with units
- Status indicators (normal/high/low)
- Trend indicators (up/down/stable)
- Optimal range display
- Change percentage calculation

#### 8. ManualDataEntry
**Location**: `src/components/ManualDataEntry.tsx`
**Purpose**: Manual blood parameter entry interface

**Features**:
- Form-based data entry
- Common parameter templates
- Validation and error handling
- Real-time feedback

#### 9. OCRTester
**Location**: `src/components/OCRTester.tsx`
**Purpose**: OCR functionality testing and debugging

**Features**:
- Sample image processing
- OCR result visualization
- Performance testing
- Debug information display

### Service Layer

#### BloodReportExtractor
**Location**: `src/services/BloodReportExtractor.ts`
**Purpose**: Core OCR and data extraction service

**Key Methods**:
```typescript
class BloodReportExtractor {
  static async processFile(file: File): Promise<ExtractedReport | null>
  static async processFiles(files: File[]): Promise<ExtractedReport[]>
  static async processImageFile(file: File): Promise<ExtractedReport | null>
  static async processPDFFile(file: File): Promise<ExtractedReport | null>
  private static async preprocessImageForOCR(file: File): Promise<string>
  private static extractParameters(text: string): Record<string, BloodParameter>
  private static extractDate(text: string): string
  private static extractPatientName(text: string): string
  private static extractReportType(text: string): string
}
```

## Data Flow

### 1. File Upload Flow
```
User Uploads File(s)
    ↓
FileUpload Component
    ↓
File Validation (Type, Size)
    ↓
Progress Tracking
    ↓
BloodReportExtractor.processFiles()
    ↓
OCR Processing Pipeline
    ↓
Parameter Extraction
    ↓
Data Validation
    ↓
State Update (Dashboard)
    ↓
UI Refresh (Overview Tab)
```

### 2. OCR Processing Flow
```
Input File (Image/PDF)
    ↓
File Type Detection
    ↓
Image Preprocessing (Enhancement)
    ↓
OCR Pipeline Initialization
    ↓
Text Extraction (Hugging Face Transformers)
    ↓
Raw Text Output
    ↓
Pattern Matching (Regex)
    ↓
Parameter Extraction
    ↓
Data Normalization
    ↓
Validation & Fallback
    ↓
Structured Data Output
```

### 3. Data Visualization Flow
```
Patient Selection
    ↓
Report Filtering
    ↓
Data Aggregation
    ↓
Chart Component Rendering
    ↓
Interactive Visualization
    ↓
User Interaction
    ↓
Chart Updates
```

## OCR Processing Pipeline

### Detailed OCR Flow
```
1. File Input
   ├── Image Files (JPEG, PNG)
   └── PDF Files (Multi-page support)

2. Preprocessing
   ├── Image Enhancement
   │   ├── Contrast Adjustment
   │   ├── Brightness Normalization
   │   └── Grayscale Conversion
   ├── Resolution Optimization
   └── Quality Improvement

3. OCR Processing
   ├── Hugging Face Transformers.js
   ├── TrOCR Model (Xenova/trocr-base-printed)
   ├── CPU-based Processing
   └── Text Extraction

4. Post-processing
   ├── Text Cleaning
   ├── Pattern Matching
   ├── Parameter Extraction
   └── Data Validation
```

### Parameter Extraction Patterns
```typescript
const parameterPatterns = {
  hemoglobin: {
    patterns: [
      /hemoglobin[:\s]*(\d+\.?\d*)\s*(g\/dl|mg\/dl|g\/dL|mg\/dL)/i,
      /hgb[:\s]*(\d+\.?\d*)\s*(g\/dl|mg\/dl|g\/dL|mg\/dL)/i,
      /hb[:\s]*(\d+\.?\d*)\s*(g\/dl|mg\/dl|g\/dL|mg\/dL)/i
    ],
    optimal: "12.0-15.5",
    unit: "g/dL"
  },
  // ... 12+ additional parameters
}
```

## Database Schema

### Current In-Memory Data Structure
```typescript
interface BloodReport {
  id: string | number;
  date: string;
  type: string;
  uploadDate?: string;
  fileName?: string;
  patientName: string;
  parameters: Record<string, BloodParameter>;
}

interface BloodParameter {
  value: number;
  unit: string;
  optimal: string;
}

interface ExtractedReport {
  id: string;
  date: string;
  type: string;
  fileName: string;
  patientName: string;
  parameters: Record<string, BloodParameter>;
}
```

### Recommended Database Schema (Future Enhancement)
```sql
-- Patients Table
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  date_of_birth DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Reports Table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  report_date DATE NOT NULL,
  report_type VARCHAR(100),
  file_name VARCHAR(255),
  file_path VARCHAR(500),
  upload_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Parameters Table
CREATE TABLE parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES reports(id),
  parameter_name VARCHAR(100) NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  optimal_range VARCHAR(100),
  status VARCHAR(20), -- normal, high, low
  created_at TIMESTAMP DEFAULT NOW()
);

-- Trends Table (for caching)
CREATE TABLE trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  parameter_name VARCHAR(100),
  trend_data JSONB,
  last_updated TIMESTAMP DEFAULT NOW()
);
```

## API Design

### Current Architecture (Client-Side Only)
The application currently operates entirely on the client-side with no backend API.

### Recommended API Endpoints (Future Enhancement)
```typescript
// Patient Management
GET    /api/patients                    // List all patients
POST   /api/patients                    // Create new patient
GET    /api/patients/:id                // Get patient details
PUT    /api/patients/:id                // Update patient
DELETE /api/patients/:id                // Delete patient

// Report Management
GET    /api/reports                     // List reports (with filters)
POST   /api/reports                     // Upload new report
GET    /api/reports/:id                 // Get report details
DELETE /api/reports/:id                 // Delete report

// OCR Processing
POST   /api/ocr/process                 // Process file with OCR
POST   /api/ocr/batch                   // Batch process files

// Analytics
GET    /api/analytics/trends/:patientId // Get trend data
GET    /api/analytics/comparison/:id    // Get comparison data
GET    /api/analytics/insights/:id      // Get health insights

// File Management
POST   /api/files/upload                // Upload file
GET    /api/files/:id                   // Download file
DELETE /api/files/:id                   // Delete file
```

## Security Considerations

### Current Security Measures
1. **Client-Side Processing**: All data processing happens locally
2. **No Data Persistence**: No sensitive data stored on servers
3. **File Validation**: Type and size validation for uploads
4. **Input Sanitization**: Regex-based parameter extraction

### Recommended Security Enhancements
1. **Authentication & Authorization**
   - JWT-based authentication
   - Role-based access control
   - Patient data isolation

2. **Data Protection**
   - End-to-end encryption
   - HIPAA compliance measures
   - Data anonymization options

3. **File Security**
   - Virus scanning for uploads
   - Secure file storage
   - Access control for files

4. **API Security**
   - Rate limiting
   - Input validation
   - CORS configuration
   - HTTPS enforcement

## Performance Considerations

### Current Performance Optimizations
1. **Lazy Loading**: Components loaded on demand
2. **Image Preprocessing**: Optimized images for OCR
3. **Caching**: React Query for data caching
4. **Debouncing**: User input optimization

### Performance Metrics
- **OCR Processing Time**: 15-45 seconds per image
- **File Upload Size**: Max 10MB per file
- **Supported Formats**: JPEG, PNG, PDF
- **Concurrent Processing**: Up to 4 files simultaneously

### Recommended Performance Enhancements
1. **Backend Processing**
   - Server-side OCR processing
   - Background job queues
   - Caching strategies

2. **Frontend Optimization**
   - Code splitting
   - Image compression
   - Virtual scrolling for large datasets

3. **Database Optimization**
   - Indexing strategies
   - Query optimization
   - Connection pooling

## Testing Strategy

### Current Testing Approach
1. **Manual Testing**: OCR functionality testing
2. **Component Testing**: Individual component validation
3. **Integration Testing**: End-to-end workflows

### Recommended Testing Framework
```typescript
// Unit Tests (Jest + React Testing Library)
describe('BloodReportExtractor', () => {
  test('should extract parameters from text', () => {
    // Test parameter extraction
  });
  
  test('should handle OCR errors gracefully', () => {
    // Test error handling
  });
});

// Integration Tests (Cypress)
describe('File Upload Flow', () => {
  it('should process uploaded files', () => {
    // Test complete upload flow
  });
});

// E2E Tests (Playwright)
describe('User Workflow', () => {
  test('complete blood report analysis', () => {
    // Test full user journey
  });
});
```

## Deployment Architecture

### Current Deployment
- **Frontend**: Vite development server
- **Static Assets**: Public directory
- **No Backend**: Client-side only

### Recommended Production Deployment
```
┌─────────────────────────────────────────────────────────────┐
│                    Production Environment                   │
├─────────────────────────────────────────────────────────────┤
│  Load Balancer (Nginx/Cloudflare)                          │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React + Vite)                                   │
│  ├── CDN (Static Assets)                                   │
│  ├── SPA Hosting (Netlify/Vercel)                          │
│  └── Service Worker (Caching)                              │
├─────────────────────────────────────────────────────────────┤
│  Backend API (Node.js/Express)                             │
│  ├── Authentication Service                                │
│  ├── File Processing Service                               │
│  ├── OCR Processing Service                                │
│  └── Analytics Service                                     │
├─────────────────────────────────────────────────────────────┤
│  Database Layer                                            │
│  ├── PostgreSQL (Primary Database)                         │
│  ├── Redis (Caching)                                       │
│  └── File Storage (S3/MinIO)                               │
├─────────────────────────────────────────────────────────────┤
│  Infrastructure                                            │
│  ├── Docker Containers                                     │
│  ├── Kubernetes Orchestration                              │
│  ├── Monitoring (Prometheus/Grafana)                       │
│  └── Logging (ELK Stack)                                   │
└─────────────────────────────────────────────────────────────┘
```

### Deployment Checklist
- [ ] Environment configuration
- [ ] SSL certificate setup
- [ ] Database migration scripts
- [ ] Backup and recovery procedures
- [ ] Monitoring and alerting
- [ ] Performance testing
- [ ] Security audit
- [ ] Documentation updates

## Future Enhancements

### Phase 1: Backend Development
1. **API Development**: RESTful API with Node.js/Express
2. **Database Integration**: PostgreSQL with Prisma ORM
3. **Authentication**: JWT-based user management
4. **File Storage**: Cloud storage integration

### Phase 2: Advanced Features
1. **Machine Learning**: Enhanced parameter prediction
2. **Mobile App**: React Native application
3. **Telemedicine Integration**: Video consultation features
4. **Lab Integration**: Direct lab result imports

### Phase 3: Enterprise Features
1. **Multi-tenant Architecture**: Healthcare provider support
2. **Compliance**: HIPAA, GDPR compliance
3. **Analytics Dashboard**: Advanced reporting
4. **API Marketplace**: Third-party integrations

## Conclusion

The Health Insight Tracker is a sophisticated web application that leverages modern web technologies and AI-powered OCR to provide comprehensive blood report analysis. The current implementation focuses on client-side processing with a robust component architecture and extensible design patterns.

The system is designed to be scalable, maintainable, and user-friendly, with clear separation of concerns and modular architecture. Future enhancements will focus on adding backend services, database persistence, and advanced analytics capabilities while maintaining the current user experience and functionality.

The application successfully demonstrates the integration of cutting-edge OCR technology with modern web development practices, providing a solid foundation for healthcare data management and analysis. 