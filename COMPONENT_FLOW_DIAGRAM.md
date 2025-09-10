# Health Insight Tracker - Component Flow Diagram

## Application Entry Point

```
index.html
    ↓
main.tsx (React Entry)
    ↓
App.tsx (Root Component)
    ├── QueryClientProvider (Data Fetching)
    ├── TooltipProvider (UI Tooltips)
    ├── Toaster (Notifications)
    └── BrowserRouter (Routing)
        └── Routes
            ├── Index (Main Dashboard)
            └── NotFound (404 Page)
```

## Main Dashboard Flow

```
Index.tsx
    ↓
BloodReportDashboard (Main Container)
    ├── State Management
    │   ├── reports: BloodReport[]
    │   ├── selectedPatient: string
    │   └── activeTab: string
    │
    ├── PatientSelector
    │   ├── Patient List Generation
    │   ├── Patient Statistics
    │   └── Patient Selection Handler
    │
    └── Tab System (6 Tabs)
        ├── Overview Tab
        ├── Trends Tab
        ├── Comparison Tab
        ├── Insights Tab
        ├── Upload Tab
        └── OCR Test Tab
```

## Detailed Component Interactions

### 1. File Upload Flow

```
User Action: Drag & Drop Files
    ↓
FileUpload Component
    ├── File Validation
    │   ├── Type Check (PDF, JPEG, PNG)
    │   └── Size Check (Max 10MB)
    │
    ├── Progress Tracking
    │   ├── Upload Progress
    │   └── Processing Status
    │
    └── Batch Processing
        ↓
BloodReportDashboard.handleFileUpload()
    ↓
BloodReportExtractor.processFiles()
    ├── File Type Detection
    │   ├── Image Files → processImageFile()
    │   └── PDF Files → processPDFFile()
    │
    ├── OCR Processing
    │   ├── Image Preprocessing
    │   ├── OCR Pipeline (Hugging Face)
    │   └── Text Extraction
    │
    ├── Data Extraction
    │   ├── Parameter Extraction (Regex)
    │   ├── Date Extraction
    │   ├── Patient Name Extraction
    │   └── Report Type Detection
    │
    └── State Update
        ↓
Dashboard State Update
    ├── Add New Reports
    ├── Update Patient List
    └── Switch to Overview Tab
```

### 2. OCR Processing Pipeline

```
Input File
    ↓
File Type Detection
    ├── Image File (.jpg, .png)
    └── PDF File (.pdf)
    ↓
Preprocessing
    ├── Image Enhancement
    │   ├── Contrast Adjustment
    │   ├── Brightness Normalization
    │   └── Grayscale Conversion
    │
    ├── PDF Processing (if PDF)
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
    │   ├── Parameter Patterns (13+ parameters)
    │   ├── Date Patterns
    │   ├── Patient Name Patterns
    │   └── Report Type Patterns
    │
    ├── Data Validation
    └── Structured Output
```

### 3. Data Visualization Flow

```
Patient Selection
    ↓
Report Filtering
    ├── Filter by Patient
    ├── Sort by Date
    └── Group by Type
    ↓
Data Aggregation
    ├── Parameter Values
    ├── Date Ranges
    └── Trend Calculations
    ↓
Chart Rendering
    ├── TrendChart Component
    │   ├── Parameter Selection
    │   ├── Line Chart (Recharts)
    │   ├── Optimal Range Display
    │   └── Interactive Tooltips
    │
    ├── ComparisonView Component
    │   ├── Side-by-side Comparison
    │   ├── Change Calculations
    │   ├── Significance Indicators
    │   └── Summary Statistics
    │
    └── ParameterCard Components
        ├── Individual Parameter Display
        ├── Status Indicators
        ├── Trend Indicators
        └── Optimal Range Display
```

### 4. Health Insights Flow

```
Latest Report Data
    ↓
Health Score Calculation
    ├── Parameter Analysis
    │   ├── Normal Range Check
    │   ├── Status Classification
    │   └── Score Calculation
    │
    ├── Critical Changes Detection
    │   ├── Previous Report Comparison
    │   ├── Change Percentage
    │   └── Priority Ranking
    │
    └── Recommendations Generation
        ↓
SuggestionsPanel Component
    ├── Overall Health Score
    │   ├── Percentage Display
    │   ├── Status Indicators
    │   └── Summary Text
    │
    ├── Priority Actions
    │   ├── Critical Changes
    │   ├── Parameter-specific Advice
    │   └── Action Items
    │
    └── General Recommendations
        ├── Nutrition Guidelines
        ├── Exercise Recommendations
        ├── Sleep & Recovery
        └── Monitoring Tips
```

## Component State Management

### BloodReportDashboard State
```typescript
interface DashboardState {
  // Core Data
  reports: BloodReport[];
  selectedPatient: string;
  activeTab: string;
  
  // UI State
  isProcessing: boolean;
  processingProgress: number;
  
  // Computed Data
  patientReports: BloodReport[];
  latestReport: BloodReport | null;
  previousReport: BloodReport | null;
  criticalChanges: CriticalChange[];
}
```

### Component Communication
```
BloodReportDashboard (Parent)
    ├── State: reports, selectedPatient, activeTab
    ├── Handlers: handleFileUpload, handlePatientChange
    └── Props Passing
        ↓
Child Components
    ├── PatientSelector
    │   ├── Props: reports, selectedPatient
    │   └── Events: onPatientChange
    │
    ├── FileUpload
    │   ├── Props: onUpload
    │   └── Events: fileUploadComplete
    │
    ├── TrendChart
    │   ├── Props: reports (filtered by patient)
    │   └── Events: parameterSelection
    │
    ├── ComparisonView
    │   ├── Props: latestReport, previousReport
    │   └── Events: none (read-only)
    │
    └── SuggestionsPanel
        ├── Props: criticalChanges, latestReport
        └── Events: none (read-only)
```

## Data Transformation Flow

### 1. Raw OCR Text → Structured Data
```
Raw OCR Output
"hemoglobin: 13.2 g/dL glucose: 95 mg/dL..."
    ↓
Pattern Matching
├── Parameter Patterns
│   ├── /hemoglobin[:\s]*(\d+\.?\d*)\s*(g\/dl|mg\/dl)/i
│   ├── /glucose[:\s]*(\d+\.?\d*)\s*(mg\/dl)/i
│   └── ... (13+ patterns)
│
├── Date Patterns
│   ├── /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/
│   └── /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}/i
│
└── Patient Name Patterns
    ├── /patient[:\s]+([A-Za-z\s,]+)(?:\n|DOB|Date of Birth|MRN|ID|Test|Report)/i
    └── /name[:\s]+([A-Za-z\s,]+)(?:\n|DOB|Date of Birth|MRN|ID|Test|Report)/i
    ↓
Structured Data
{
  id: "abc123",
  date: "2024-01-15",
  type: "Blood Test",
  patientName: "John Smith",
  parameters: {
    hemoglobin: { value: 13.2, unit: "g/dL", optimal: "12.0-15.5" },
    glucose: { value: 95, unit: "mg/dL", optimal: "70-100" }
  }
}
```

### 2. Report Data → Visualization Data
```
BloodReport[]
    ↓
Filter by Patient
    ↓
Sort by Date
    ↓
Parameter Selection
    ↓
Chart Data Transformation
{
  date: "Jan 15",
  value: 13.2,
  unit: "g/dL",
  fullDate: "2024-01-15"
}
```

### 3. Report Comparison → Change Analysis
```
Current Report vs Previous Report
    ↓
Parameter Matching
    ↓
Change Calculation
    ├── Percentage Change: ((current - previous) / previous) * 100
    ├── Status Classification: normal/high/low
    └── Significance Level: minimal/moderate/significant
    ↓
Critical Changes Array
[
  {
    parameter: "hemoglobin",
    change: 3.1,
    status: "normal",
    current: 13.2,
    previous: 12.8,
    unit: "g/dL"
  }
]
```

## Error Handling Flow

### 1. OCR Processing Errors
```
OCR Processing
    ↓
Error Detection
    ├── Pipeline Initialization Error
    ├── Text Extraction Error
    ├── Timeout Error
    └── Memory Error
    ↓
Error Handling
    ├── Fallback Report Creation
    ├── User Notification
    └── Logging
    ↓
Recovery
    ├── Manual Data Entry Option
    ├── Retry Mechanism
    └── Alternative Processing
```

### 2. File Upload Errors
```
File Upload
    ↓
Validation Errors
    ├── Invalid File Type
    ├── File Too Large
    ├── Corrupted File
    └── Network Error
    ↓
Error Handling
    ├── User Feedback
    ├── File Rejection
    └── Error Logging
```

### 3. Data Processing Errors
```
Data Processing
    ↓
Validation Errors
    ├── Invalid Parameter Values
    ├── Missing Required Data
    ├── Date Parsing Errors
    └── Patient Name Extraction Errors
    ↓
Error Handling
    ├── Default Values
    ├── Data Cleaning
    └── User Notifications
```

## Performance Optimization Flow

### 1. Image Processing Optimization
```
Original Image
    ↓
Preprocessing
    ├── Resolution Optimization
    ├── Contrast Enhancement
    ├── Grayscale Conversion
    └── Quality Improvement
    ↓
OCR Processing
    ├── Optimized Image Input
    ├── Faster Processing
    └── Better Accuracy
```

### 2. Component Rendering Optimization
```
Component Updates
    ↓
React Optimization
    ├── Memoization
    ├── useCallback Hooks
    ├── useMemo Hooks
    └── React.memo
    ↓
Rendering Performance
    ├── Reduced Re-renders
    ├── Faster Updates
    └── Better User Experience
```

### 3. Data Caching Strategy
```
Data Requests
    ↓
React Query Caching
    ├── Query Caching
    ├── Background Updates
    ├── Stale Data Handling
    └── Cache Invalidation
    ↓
Performance Benefits
    ├── Faster Data Access
    ├── Reduced API Calls
    ├── Offline Support
    └── Better UX
```

## Security Flow

### 1. File Upload Security
```
File Upload
    ↓
Security Validation
    ├── File Type Validation
    ├── Size Limits
    ├── Content Inspection
    └── Malware Scanning (Future)
    ↓
Secure Processing
    ├── Local Processing Only
    ├── No Server Storage
    └── Client-Side Encryption (Future)
```

### 2. Data Privacy Flow
```
Data Processing
    ↓
Privacy Protection
    ├── Local Processing
    ├── No External Transmission
    ├── Temporary Storage Only
    └── Automatic Cleanup
    ↓
User Control
    ├── Data Deletion
    ├── Export Options
    └── Privacy Settings
```

This comprehensive flow diagram shows how all components interact, how data flows through the system, and how the application handles various scenarios including errors, performance optimization, and security considerations. 