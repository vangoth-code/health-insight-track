# Health Insight Tracker - Technical Architecture

## System Overview

The Health Insight Tracker is a client-side web application built with modern React technologies and AI-powered OCR capabilities. The system processes blood test reports through advanced image recognition and provides comprehensive health analytics.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
├─────────────────────────────────────────────────────────────┤
│  React Components (TypeScript)                             │
│  ├── UI Components (Shadcn/ui)                             │
│  ├── Data Visualization (Recharts)                         │
│  ├── Form Handling (React Hook Form)                       │
│  └── State Management (React Hooks)                        │
├─────────────────────────────────────────────────────────────┤
│                    Business Logic Layer                     │
├─────────────────────────────────────────────────────────────┤
│  Service Layer                                              │
│  ├── BloodReportExtractor (OCR Processing)                 │
│  ├── Data Processing & Validation                          │
│  ├── Trend Analysis & Calculations                         │
│  └── Health Insights Generation                            │
├─────────────────────────────────────────────────────────────┤
│                    Data Processing Layer                    │
├─────────────────────────────────────────────────────────────┤
│  OCR & AI Layer                                             │
│  ├── Hugging Face Transformers.js                          │
│  ├── TrOCR Model (Xenova/trocr-base-printed)               │
│  ├── Image Preprocessing (Canvas API)                      │
│  └── PDF Processing (PDF.js + PDF-lib)                     │
├─────────────────────────────────────────────────────────────┤
│                    Infrastructure Layer                     │
├─────────────────────────────────────────────────────────────┤
│  Browser APIs                                               │
│  ├── File API (File Upload)                                │
│  ├── Canvas API (Image Processing)                         │
│  ├── Web Workers (Background Processing)                   │
│  └── Local Storage (Temporary Data)                        │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack Details

### Frontend Framework
```
React 18.3.1
├── TypeScript 5.5.3 (Type Safety)
├── Vite 5.4.1 (Build Tool & Dev Server)
├── React Router DOM 6.26.2 (Client-side Routing)
└── React Query 5.56.2 (Data Fetching & Caching)
```

### UI Framework
```
Shadcn/ui (Component Library)
├── Radix UI (Accessible Primitives)
│   ├── Dialog, Dropdown, Select
│   ├── Tabs, Accordion, Alert
│   └── Form, Input, Button
├── Tailwind CSS 3.4.11 (Utility-first CSS)
├── Lucide React (Icon Library)
└── Class Variance Authority (Component Variants)
```

### Data Visualization
```
Recharts 2.12.7
├── LineChart (Trend Visualization)
├── ResponsiveContainer (Mobile Support)
├── Custom Tooltips
└── Interactive Features
```

### OCR & AI Processing
```
Hugging Face Transformers 3.7.0
├── TrOCR Model (Xenova/trocr-base-printed)
├── CPU-based Processing
├── Image-to-Text Pipeline
└── Real-time Text Extraction

PDF Processing
├── PDF.js 5.3.93 (PDF Rendering)
├── PDF-lib 1.17.1 (PDF Manipulation)
└── Canvas Conversion
```

## Component Architecture

### Core Components Structure
```
src/
├── components/
│   ├── ui/                    # Shadcn/ui Components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ... (40+ components)
│   │
│   ├── BloodReportDashboard.tsx    # Main Container
│   ├── PatientSelector.tsx         # Patient Management
│   ├── FileUpload.tsx              # File Upload Interface
│   ├── TrendChart.tsx              # Data Visualization
│   ├── ComparisonView.tsx          # Report Comparison
│   ├── SuggestionsPanel.tsx        # Health Insights
│   ├── ParameterCard.tsx           # Parameter Display
│   ├── ManualDataEntry.tsx         # Manual Data Entry
│   └── OCRTester.tsx               # OCR Testing Tool
│
├── services/
│   └── BloodReportExtractor.ts     # OCR & Data Processing
│
├── hooks/
│   ├── use-mobile.tsx              # Mobile Detection
│   └── use-toast.ts                # Notification System
│
├── lib/
│   └── utils.ts                    # Utility Functions
│
└── pages/
    ├── Index.tsx                   # Main Dashboard
    └── NotFound.tsx                # 404 Page
```

## Data Flow Architecture

### 1. File Upload & Processing Flow
```
User Interface
    ↓
FileUpload Component
    ├── Drag & Drop Interface
    ├── File Validation
    └── Progress Tracking
    ↓
BloodReportDashboard
    ├── State Management
    └── Event Handling
    ↓
BloodReportExtractor Service
    ├── File Type Detection
    ├── OCR Processing
    └── Data Extraction
    ↓
State Update
    ├── Add New Reports
    ├── Update Patient List
    └── UI Refresh
```

### 2. OCR Processing Architecture
```
Input File
    ↓
File Type Detection
    ├── Image Files (.jpg, .png)
    └── PDF Files (.pdf)
    ↓
Preprocessing Pipeline
    ├── Image Enhancement
    │   ├── Contrast Adjustment
    │   ├── Brightness Normalization
    │   └── Grayscale Conversion
    │
    ├── PDF Processing (if applicable)
    │   ├── PDF.js Rendering
    │   ├── Page Extraction
    │   └── Canvas Conversion
    │
    └── Quality Optimization
    ↓
OCR Pipeline
    ├── Hugging Face Transformers.js
    ├── TrOCR Model Loading
    ├── Text Extraction
    └── Raw Text Output
    ↓
Post-processing
    ├── Text Cleaning
    ├── Pattern Matching
    ├── Parameter Extraction
    └── Data Validation
```

### 3. Data Visualization Architecture
```
Report Data
    ↓
Data Filtering
    ├── Patient Filtering
    ├── Date Sorting
    └── Parameter Selection
    ↓
Data Transformation
    ├── Chart Data Preparation
    ├── Trend Calculations
    └── Comparison Data
    ↓
Visualization Components
    ├── TrendChart (Line Charts)
    ├── ComparisonView (Tables)
    ├── ParameterCard (Cards)
    └── SuggestionsPanel (Insights)
```

## State Management Architecture

### Application State Structure
```typescript
interface ApplicationState {
  // Core Data
  reports: BloodReport[];
  selectedPatient: string;
  activeTab: string;
  
  // UI State
  isProcessing: boolean;
  processingProgress: number;
  errorMessages: string[];
  
  // Computed Data
  patientReports: BloodReport[];
  latestReport: BloodReport | null;
  previousReport: BloodReport | null;
  criticalChanges: CriticalChange[];
  
  // Filtering & Sorting
  selectedParameters: string[];
  dateRange: DateRange;
  sortOrder: SortOrder;
}
```

### State Management Pattern
```
React Hooks (useState, useReducer)
    ↓
Component State
    ├── Local State (Component-specific)
    ├── Shared State (Props drilling)
    └── Global State (Context API - Future)
    ↓
State Updates
    ├── User Actions
    ├── Data Processing
    └── External Events
    ↓
UI Re-renders
    ├── Component Updates
    ├── Child Component Updates
    └── Performance Optimization
```

## Performance Architecture

### Optimization Strategies
```
1. Code Splitting
   ├── Route-based Splitting
   ├── Component Lazy Loading
   └── Dynamic Imports

2. Image Optimization
   ├── Preprocessing for OCR
   ├── Compression
   └── Format Optimization

3. Component Optimization
   ├── React.memo
   ├── useCallback
   ├── useMemo
   └── Virtual Scrolling (Future)

4. Caching Strategy
   ├── React Query Caching
   ├── Browser Caching
   └── Local Storage
```

### Performance Metrics
```
OCR Processing
├── Image Processing: 2-5 seconds
├── OCR Extraction: 15-45 seconds
├── Data Processing: 1-2 seconds
└── Total Time: 18-52 seconds per file

UI Performance
├── Initial Load: < 3 seconds
├── Component Render: < 100ms
├── Chart Updates: < 200ms
└── File Upload: < 5 seconds
```

## Security Architecture

### Current Security Measures
```
1. Client-Side Processing
   ├── No Server Data Storage
   ├── Local File Processing
   └── Temporary Data Only

2. File Validation
   ├── Type Validation
   ├── Size Limits (10MB)
   └── Content Inspection

3. Input Sanitization
   ├── Regex-based Extraction
   ├── Data Validation
   └── Error Handling
```

### Security Considerations
```
Data Privacy
├── Local Processing Only
├── No External Transmission
├── Temporary Storage
└── Automatic Cleanup

File Security
├── Type Validation
├── Size Limits
├── Content Inspection
└── Malware Scanning (Future)

Access Control
├── No Authentication (Current)
├── User-based Access (Future)
├── Role-based Permissions (Future)
└── Audit Logging (Future)
```

## Error Handling Architecture

### Error Categories
```
1. OCR Processing Errors
   ├── Model Loading Failures
   ├── Text Extraction Errors
   ├── Timeout Errors
   └── Memory Errors

2. File Processing Errors
   ├── Invalid File Types
   ├── Corrupted Files
   ├── Size Limit Exceeded
   └── Upload Failures

3. Data Processing Errors
   ├── Invalid Parameter Values
   ├── Missing Required Data
   ├── Date Parsing Errors
   └── Patient Name Extraction Errors

4. UI/UX Errors
   ├── Component Rendering Errors
   ├── State Management Errors
   ├── Network Errors
   └── Browser Compatibility Issues
```

### Error Handling Strategy
```
Error Detection
    ↓
Error Classification
    ├── Critical Errors
    ├── Warning Errors
    └── Informational Errors
    ↓
Error Response
    ├── User Notification
    ├── Fallback Mechanisms
    ├── Retry Logic
    └── Logging
    ↓
Recovery Actions
    ├── Manual Data Entry
    ├── Alternative Processing
    ├── Data Recovery
    └── System Reset
```

## Scalability Architecture

### Current Scalability
```
Client-Side Processing
├── Single User Application
├── Local Resource Utilization
├── Browser Memory Limits
└── Processing Time Constraints
```

### Future Scalability Plans
```
1. Backend Architecture
   ├── Microservices
   ├── Load Balancing
   ├── Auto-scaling
   └── Distributed Processing

2. Database Architecture
   ├── PostgreSQL (Primary)
   ├── Redis (Caching)
   ├── Read Replicas
   └── Sharding (Future)

3. Processing Architecture
   ├── Queue-based Processing
   ├── Background Jobs
   ├── Parallel Processing
   └── GPU Acceleration
```

## Monitoring & Analytics

### Current Monitoring
```
Browser Console Logging
├── OCR Processing Logs
├── Error Logs
├── Performance Metrics
└── User Interaction Logs
```

### Future Monitoring Strategy
```
1. Application Monitoring
   ├── Performance Metrics
   ├── Error Tracking
   ├── User Analytics
   └── Usage Statistics

2. Infrastructure Monitoring
   ├── Server Health
   ├── Database Performance
   ├── Network Latency
   └── Resource Utilization

3. Business Metrics
   ├── User Engagement
   ├── Feature Usage
   ├── Conversion Rates
   └── User Satisfaction
```

## Deployment Architecture

### Current Deployment
```
Development Environment
├── Vite Dev Server
├── Local File System
├── Browser-based Processing
└── No Backend Services
```

### Production Deployment Strategy
```
1. Frontend Deployment
   ├── Static Site Generation
   ├── CDN Distribution
   ├── Service Worker (Caching)
   └── Progressive Web App

2. Backend Deployment
   ├── Container Orchestration
   ├── Load Balancing
   ├── Auto-scaling
   └── Health Checks

3. Infrastructure
   ├── Cloud Platform (AWS/GCP/Azure)
   ├── Database as a Service
   ├── Object Storage
   └── Monitoring & Logging
```

## Development Workflow

### Development Environment
```
Local Development
├── Node.js Environment
├── Vite Dev Server
├── Hot Module Replacement
└── TypeScript Compilation

Code Quality
├── ESLint (Linting)
├── Prettier (Formatting)
├── TypeScript (Type Checking)
└── Git Hooks (Pre-commit)

Testing Strategy
├── Unit Tests (Jest)
├── Component Tests (React Testing Library)
├── Integration Tests (Cypress)
└── E2E Tests (Playwright)
```

### Build & Deployment Pipeline
```
Source Code
    ↓
Build Process
    ├── TypeScript Compilation
    ├── Bundle Optimization
    ├── Asset Optimization
    └── Static Generation
    ↓
Testing
    ├── Unit Tests
    ├── Integration Tests
    ├── E2E Tests
    └── Performance Tests
    ↓
Deployment
    ├── Staging Environment
    ├── Production Environment
    ├── Monitoring Setup
    └── Health Checks
```

This technical architecture document provides a comprehensive overview of the system's structure, data flow, performance considerations, security measures, and scalability plans. It serves as a blueprint for understanding and extending the Health Insight Tracker application. 