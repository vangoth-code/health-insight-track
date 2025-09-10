# Health Insight Tracker - Data Storage System

## Overview

The app now uses JSON files for data storage instead of localStorage. This provides better data persistence, easier backup/restore, and more professional data management.

## System Architecture Flow

```mermaid
graph TB
    A[User Uploads Blood Test Report] --> B[OCR Processing]
    B --> C[Data Extraction]
    C --> D[Parameter Analysis]
    D --> E[Health Insights Generation]
    E --> F[Save to Patient JSON]
    F --> G[Update Trends]
    G --> H[Display in Dashboard]
    
    I[Patient Data JSON] --> J[Load on App Start]
    J --> K[Display Patient Info]
    J --> L[Show Report History]
    J --> M[Calculate Trends]
    
    N[Data Management] --> O[Export JSON]
    N --> P[Import JSON]
    N --> Q[Edit Patient Details]
    
    F --> I
    O --> R[Backup/Share]
    P --> S[Restore Data]
```

## Data Flow Diagram

```mermaid
flowchart TD
    A[Blood Test Report<br/>PDF/Image] --> B[File Upload]
    B --> C[OCR Processing<br/>Hugging Face + Tesseract]
    C --> D[Text Extraction]
    D --> E[Parameter Parsing<br/>Regex Patterns]
    E --> F[Data Validation]
    F --> G[Create Report Object]
    G --> H[Add to Patient JSON]
    H --> I[Calculate Trends]
    I --> J[Update Metadata]
    J --> K[Save to Storage]
    
    L[Patient JSON File] --> M[Load Patient Data]
    M --> N[Display Reports]
    M --> O[Show Trends]
    M --> P[Generate Insights]
    
    Q[User Actions] --> R[Edit Patient Info]
    Q --> S[Export Data]
    Q --> T[Import Data]
    Q --> U[View Trends]
    
    K --> L
    R --> L
    S --> V[Download JSON]
    T --> W[Upload JSON]
    W --> L
```

## Report Processing Flow

```mermaid
sequenceDiagram
    participant U as User
    participant A as App
    participant O as OCR Service
    participant P as PatientDataService
    participant J as JSON File
    participant L as localStorage

    U->>A: Upload Report File
    A->>O: Process with OCR
    O->>A: Return Extracted Text
    A->>A: Parse Parameters
    A->>A: Generate Health Insights
    A->>P: Add Report to Patient
    P->>J: Load Current JSON
    P->>P: Update Reports Array
    P->>P: Calculate New Trends
    P->>P: Update Metadata
    P->>L: Save to localStorage (fallback)
    P->>A: Return Updated Data
    A->>A: Refresh Dashboard
    A->>U: Show Success Message
```

## Data Storage Architecture

```mermaid
graph LR
    subgraph "Repository Structure"
        A[data/patients/] --> B[urmila-sharma.json]
        C[public/data/patients/] --> D[urmila-sharma.json]
    end
    
    subgraph "App Components"
        E[BloodReportDashboard] --> F[PatientDataService]
        F --> G[File Operations]
        F --> H[Trend Calculations]
    end
    
    subgraph "Storage Layers"
        I[JSON Files] --> J[Primary Storage]
        K[localStorage] --> L[Fallback Storage]
        M[Git Version Control] --> N[Data Backup]
    end
    
    B --> I
    D --> I
    F --> I
    F --> K
    I --> M
```

## Trend Calculation Flow

```mermaid
flowchart TD
    A[New Report Added] --> B[Load Patient Data]
    B --> C[Group Reports by Parameter]
    C --> D[Sort Reports by Date]
    D --> E[Calculate Changes]
    E --> F{Enough Data?}
    F -->|Yes| G[Compute Trend Direction]
    F -->|No| H[Skip Trend Calculation]
    
    G --> I[Determine Trend Type]
    I --> J[Calculate Change Amount]
    J --> K[Determine Timeframe]
    K --> L[Update Parameter Trends]
    L --> M[Save to JSON]
    
    I --> N{Value Increased?}
    N -->|Yes| O[Trend: Increasing]
    N -->|No| P{Value Decreased?}
    P -->|Yes| Q[Trend: Decreasing]
    P -->|No| R[Trend: Stable]
    
    O --> L
    Q --> L
    R --> L
```

## User Interaction Flow

```mermaid
graph TD
    A[User Opens App] --> B[Load Patient Data]
    B --> C[Display Dashboard]
    
    C --> D[Overview Tab]
    C --> E[Trends Tab]
    C --> F[Data Tab]
    C --> G[Upload Tab]
    
    D --> H[Show Latest Report]
    D --> I[Display Parameters]
    D --> J[Show Health Insights]
    
    E --> K[Parameter Selection]
    K --> L[Trend Chart Display]
    L --> M[Trend Analysis]
    
    F --> N[View Patient Info]
    F --> O[Edit Patient Details]
    F --> P[Export Data]
    F --> Q[Import Data]
    
    G --> R[File Selection]
    R --> S[OCR Processing]
    S --> T[Data Extraction]
    T --> U[Save to JSON]
    U --> V[Update Dashboard]
```

## Data Export/Import Flow

```mermaid
flowchart LR
    subgraph "Export Process"
        A[User Clicks Export] --> B[Load Patient Data]
        B --> C[Convert to JSON String]
        C --> D[Create Blob]
        D --> E[Download File]
    end
    
    subgraph "Import Process"
        F[User Selects File] --> G[Read File Content]
        G --> H[Parse JSON]
        H --> I[Validate Data]
        I --> J[Save to Storage]
        J --> K[Update Dashboard]
    end
    
    subgraph "File Formats"
        L[Patient JSON] --> M[Complete Patient Data]
        M --> N[Reports + Trends + Metadata]
    end
```

## Error Handling & Fallbacks

```mermaid
flowchart TD
    A[Load Patient Data] --> B{JSON File Accessible?}
    B -->|Yes| C[Load from JSON]
    B -->|No| D[Load from localStorage]
    
    C --> E{Data Valid?}
    E -->|Yes| F[Use JSON Data]
    E -->|No| G[Use localStorage Fallback]
    
    D --> H{localStorage Data?}
    H -->|Yes| I[Use localStorage Data]
    H -->|No| J[Create Empty Patient]
    
    F --> K[Display Data]
    I --> K
    J --> K
    
    L[Save Data] --> M{File Write Success?}
    M -->|Yes| N[Update JSON File]
    M -->|No| O[Save to localStorage]
    
    N --> P[Success]
    O --> P
```

## Data Structure

### File Location
- **Source**: `/data/patients/` (in repository)
- **Public**: `/public/data/patients/` (served by Vite)
- **Current Patient**: `urmila-sharma.json`

### JSON Schema
```json
{
  "patientId": "urmila-sharma",
  "name": "Urmila Sharma",
  "age": 52,
  "gender": "F",
  "relationship": "Mother",
  "reports": [
    {
      "id": "unique-report-id",
      "reportDate": "2024-01-15T08:30:00Z",
      "uploadDate": "2024-01-15T10:00:00Z",
      "type": "Blood Test",
      "fileName": "original-file-name.pdf",
      "patientName": "Urmila Sharma",
      "parameters": {
        "hemoglobin": {
          "value": 12.5,
          "unit": "g/dL",
          "normalRange": [12.0, 15.5],
          "status": "normal",
          "healthInsight": "Normal hemoglobin levels",
          "recommendation": "Continue current diet and lifestyle"
        }
      },
      "ocrRawText": "Full OCR output for debugging"
    }
  ],
  "trends": {
    "lastUpdated": "2024-01-15T10:00:00Z",
    "parameterTrends": {
      "hemoglobin": {
        "trend": "increasing",
        "lastValue": 12.5,
        "previousValue": 12.0,
        "change": "+0.5",
        "timeframe": "3 months",
        "lastReportDate": "2024-01-15T08:30:00Z"
      }
    }
  },
  "metadata": {
    "created": "2024-01-15T10:00:00Z",
    "lastModified": "2024-01-15T10:00:00Z",
    "totalReports": 1
  }
}
```

## How It Works

### 1. **Data Loading**
- App loads patient data from JSON files on startup
- Data is fetched from `/data/patients/{patientId}.json`
- Falls back to localStorage if JSON loading fails

### 2. **Data Saving**
- New reports are added to the JSON structure
- Trends are automatically calculated and updated
- Data is saved to localStorage (temporary fallback)
- **TODO**: Implement actual file writing when File System Access API is available

### 3. **Trend Calculation**
- Automatically calculates trends between consecutive reports
- Identifies increasing/decreasing/stable patterns
- Provides timeframe information (days, weeks, months, years)

## Usage

### **Upload Reports**
1. Go to the "Upload" tab
2. Select blood test report files (PDF/Images)
3. App extracts data using OCR
4. Data is automatically added to patient JSON
5. Trends are recalculated

### **View Data**
1. Go to the "Data" tab
2. View current patient information
3. Edit patient details if needed
4. Export data as JSON file
5. Import data from JSON file

### **View Trends**
1. Go to the "Trends" tab
2. Select parameter to analyze
3. View trend line chart
4. See trend direction and changes

## Data Management

### **Export Data**
- Click "Export" button in Data tab
- Downloads JSON file with current patient data
- Use for backup or sharing with healthcare providers

### **Import Data**
- Click "Import" button in Data tab
- Select JSON file to restore data
- Useful for data migration or recovery

### **Manual Editing**
- Click "Edit" button in Data tab
- Modify patient details, age, gender, relationship
- Save changes to update the data

## Git Integration

### **Commit Strategy**
- Commit JSON file after each new report
- Use meaningful commit messages: "Add blood test report from March 2024"
- Git history becomes a health timeline

### **Benefits**
- **Version Control**: Track changes over time
- **Data Recovery**: Easy rollback if needed
- **Collaboration**: Share data with other developers
- **Backup**: Git becomes your data backup system

## Future Enhancements

### **File System Access API**
- Direct file writing to user's device
- No more localStorage fallback
- True file-based storage

### **Multiple Patients**
- Support for multiple patient JSON files
- Patient selection and management
- Cross-patient analysis

### **Cloud Sync**
- Backup JSON files to cloud storage
- Cross-device synchronization
- Automatic backup scheduling

### **Data Validation**
- JSON schema validation
- Data integrity checks
- Error handling and recovery

## Troubleshooting

### **Data Not Loading**
- Check if JSON file exists in `/public/data/patients/`
- Verify file permissions and format
- Check browser console for errors

### **Reports Not Saving**
- App falls back to localStorage if JSON saving fails
- Check browser console for error messages
- Verify file structure and permissions

### **Trends Not Updating**
- Ensure at least 2 reports exist for trend calculation
- Check report dates are in correct format
- Verify parameter names match between reports

## File Locations

```
health-insight-track/
├── data/                          # Source data directory
│   └── patients/
│       └── urmila-sharma.json    # Patient data file
├── public/                        # Public assets (served by Vite)
│   └── data/
│       └── patients/
│           └── urmila-sharma.json # Public patient data
└── src/
    └── services/
        └── PatientDataService.ts  # Data management service
```

## Security Notes

- **Private Repository**: Ensure this is a private GitHub repository
- **Personal Data**: Contains actual health information
- **Access Control**: Only you should have access to the data
- **Backup**: Regularly export and backup your data

## Next Steps

1. **Test the new system** with your mom's actual reports
2. **Commit the initial JSON file** to start version control
3. **Upload a few reports** to see the system in action
4. **Explore the Data tab** to manage patient information
5. **Use the Trends tab** to analyze health patterns

The app is now ready to be a real family health tracking tool! 🏥✨
