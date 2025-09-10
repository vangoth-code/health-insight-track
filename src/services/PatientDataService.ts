import { BloodParameter, ExtractedReport } from './BloodReportExtractor';

export interface PatientData {
  patientId: string;
  name: string;
  age: number;
  gender: 'M' | 'F';
  relationship: string;
  reports: ExtractedReport[];
  trends: {
    lastUpdated: string | null;
    parameterTrends: Record<string, ParameterTrend>;
  };
  metadata: {
    created: string;
    lastModified: string;
    totalReports: number;
  };
}

export interface ParameterTrend {
  trend: 'increasing' | 'decreasing' | 'stable';
  lastValue: number;
  previousValue?: number;
  change?: string;
  timeframe?: string;
  lastReportDate: string;
}

export class PatientDataService {
  private static readonly DATA_DIR = '/data/patients/';
  private static readonly DEFAULT_PATIENT = 'urmila-sharma';

  /**
   * Load patient data from JSON file
   */
  static async loadPatientData(patientId: string = this.DEFAULT_PATIENT): Promise<PatientData | null> {
    try {
      // First, check if we have updated data in localStorage
      const localStorageKey = `patient_${patientId}`;
      const localStorageData = localStorage.getItem(localStorageKey);
      
      if (localStorageData) {
        console.log(`📱 Loading from localStorage (most recent data)`);
        const data = JSON.parse(localStorageData) as PatientData;
        console.log(`📊 Loaded data from localStorage:`, data);
        console.log(`📊 Number of reports:`, data.reports?.length || 0);
        return data;
      }
      
      // Fallback to JSON file if no localStorage data
      console.log(`🔍 Loading patient data from: ${this.DATA_DIR}${patientId}.json`);
      const response = await fetch(`${this.DATA_DIR}${patientId}.json?t=${Date.now()}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      console.log(`📡 Response status:`, response.status, response.statusText);
      
      if (!response.ok) {
        console.warn(`Could not load patient data for ${patientId}:`, response.statusText);
        return null;
      }
      
      const data = await response.json();
      console.log(`📊 Loaded data from JSON:`, data);
      console.log(`📊 Number of reports:`, data.reports?.length || 0);
      
      // Also save to localStorage for backup
      localStorage.setItem(`patient_${patientId}`, JSON.stringify(data));
      
      return data as PatientData;
    } catch (error) {
      console.error('Error loading patient data:', error);
      
      // Try loading from localStorage as fallback
      try {
        const fallbackData = localStorage.getItem(`patient_${patientId}`);
        if (fallbackData) {
          console.log(`📱 Loading from localStorage fallback due to error`);
          return JSON.parse(fallbackData) as PatientData;
        }
      } catch (fallbackError) {
        console.error('Fallback loading also failed:', fallbackError);
      }
      
      return null;
    }
  }

  /**
   * Save patient data to JSON file
   * Note: In a real app, this would write to the file system
   * For now, we'll use localStorage as a fallback and prepare for file writing
   */
  static async savePatientData(patientData: PatientData): Promise<boolean> {
    try {
      console.log(`💾 Saving patient data for: ${patientData.patientId}`);
      console.log(`💾 Number of reports: ${patientData.reports.length}`);
      
      // Update metadata
      patientData.metadata.lastModified = new Date().toISOString();
      patientData.metadata.totalReports = patientData.reports.length;
      
      console.log(`💾 Updated metadata:`, patientData.metadata);

      // For now, save to localStorage as fallback
      const localStorageKey = `patient_${patientData.patientId}`;
      localStorage.setItem(localStorageKey, JSON.stringify(patientData));
      
      // Verify the save worked
      const savedData = localStorage.getItem(localStorageKey);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        console.log(`✅ Data saved to localStorage. Reports count: ${parsed.reports.length}`);
      } else {
        console.error(`❌ Failed to save to localStorage`);
      }
      
      // Try to write to the JSON file using File System Access API
      await this.writeToJsonFile(patientData);
      
      // Also try to update the public JSON file directly
      await this.updatePublicJsonFile(patientData);
      
      return true;
    } catch (error) {
      console.error('❌ Error saving patient data:', error);
      return false;
    }
  }

  /**
   * Write patient data to JSON file using File System Access API or fallback
   */
  private static async writeToJsonFile(patientData: PatientData): Promise<void> {
    try {
      // Check if File System Access API is available
      if ('showSaveFilePicker' in window) {
        console.log('💾 Using File System Access API to save JSON file');
        
        try {
          // Create a new file handle
          const fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: `${patientData.patientId}.json`,
            types: [{
              description: 'JSON files',
              accept: { 'application/json': ['.json'] }
            }]
          });
          
          // Write the data to the file
          const writable = await fileHandle.createWritable();
          await writable.write(JSON.stringify(patientData, null, 2));
          await writable.close();
          
          console.log('✅ Successfully wrote to JSON file using File System Access API');
        } catch (error) {
          console.log('⚠️ File System Access API failed, using fallback method');
          await this.fallbackFileWrite(patientData);
        }
      } else {
        console.log('💾 File System Access API not available, using fallback method');
        await this.fallbackFileWrite(patientData);
      }
    } catch (error) {
      console.error('❌ Error writing to JSON file:', error);
      // Don't throw - this is not critical for the app to function
    }
  }

  /**
   * Fallback method to write JSON file (downloads the file)
   */
  private static async fallbackFileWrite(patientData: PatientData): Promise<void> {
    try {
      console.log('💾 Using fallback method: downloading JSON file');
      
      // Create a blob with the JSON data
      const jsonData = JSON.stringify(patientData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      
      // Create a download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${patientData.patientId}.json`;
      a.style.display = 'none';
      
      // Trigger download
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      console.log('✅ JSON file downloaded successfully');
      console.log('📝 Instructions:');
      console.log('   1. The JSON file has been downloaded to your Downloads folder');
      console.log('   2. Copy the downloaded file to: /data/patients/ directory in your project');
      console.log('   3. Replace the existing file with the same name');
      console.log('   4. Refresh the application to see the updated data');
    } catch (error) {
      console.error('❌ Fallback file write failed:', error);
    }
  }

  /**
   * Update the public JSON file directly (for development)
   */
  private static async updatePublicJsonFile(patientData: PatientData): Promise<void> {
    try {
      console.log('💾 Attempting to update public JSON file directly');
      
      // This is a development-only approach
      // In production, you'd typically use a backend API
      const publicJsonPath = `/data/patients/${patientData.patientId}.json`;
      
      // Note: This won't actually work in a browser environment due to CORS
      // But it shows the intended approach
      console.log(`📝 Would update: ${publicJsonPath}`);
      console.log('📝 In a real application, this would be handled by a backend API');
      console.log('📝 For now, the data is saved to localStorage and can be downloaded');
      
    } catch (error) {
      console.log('⚠️ Direct file update not possible in browser environment');
    }
  }

  /**
   * Clear all data for a patient (public method for UI)
   */
  static async clearPatientData(patientId: string = this.DEFAULT_PATIENT): Promise<boolean> {
    try {
      console.log(`🗑️ Clearing all data for patient: ${patientId}`);
      
      // First, load the original patient data to get the basic info
      const originalData = await this.loadPatientData(patientId);
      if (!originalData) {
        console.error('❌ Could not load original patient data');
        return false;
      }
      
      // Create a clean patient data structure with no reports
      const cleanPatientData: PatientData = {
        patientId: originalData.patientId,
        name: originalData.name,
        age: originalData.age,
        gender: originalData.gender,
        relationship: originalData.relationship,
        reports: [], // Empty reports array
        trends: {
          lastUpdated: new Date().toISOString(),
          parameterTrends: {}
        },
        metadata: {
          created: originalData.metadata.created,
          lastModified: new Date().toISOString(),
          totalReports: 0
        }
      };
      
      // Save the clean data to localStorage
      const localStorageKey = `patient_${patientId}`;
      localStorage.setItem(localStorageKey, JSON.stringify(cleanPatientData));
      
      console.log('✅ Patient data cleared - all reports removed');
      return true;
    } catch (error) {
      console.error('❌ Error clearing patient data:', error);
      return false;
    }
  }

  /**
   * Save current patient data to JSON file (public method for UI)
   */
  static async saveCurrentDataToFile(patientId: string = this.DEFAULT_PATIENT): Promise<boolean> {
    try {
      console.log(`💾 Saving current data to file for patient: ${patientId}`);
      
      const patientData = await this.loadPatientData(patientId);
      if (!patientData) {
        console.error(`❌ No data found for patient ${patientId}`);
        return false;
      }
      
      // Write to JSON file
      await this.writeToJsonFile(patientData);
      
      console.log('✅ Data saved to file successfully');
      return true;
    } catch (error) {
      console.error('❌ Error saving data to file:', error);
      return false;
    }
  }

  /**
   * Add a new report to patient data
   */
  static async addReport(patientId: string, report: ExtractedReport): Promise<boolean> {
    try {
      console.log(`🔧 Adding report to patient: ${patientId}`);
      console.log(`🔧 Report to add:`, report);
      
      const patientData = await this.loadPatientData(patientId);
      if (!patientData) {
        console.error(`❌ Patient ${patientId} not found`);
        return false;
      }

      console.log(`📊 Current patient data has ${patientData.reports.length} reports`);
      
      // Add report
      patientData.reports.push(report);
      console.log(`📊 Patient data now has ${patientData.reports.length} reports`);

      // Update trends
      await this.updateTrends(patientData);

      // Save updated data
      const saveResult = await this.savePatientData(patientData);
      console.log(`💾 Save result:`, saveResult);
      
      return saveResult;
    } catch (error) {
      console.error('❌ Error adding report:', error);
      return false;
    }
  }

  /**
   * Update trends based on current reports
   */
  private static async updateTrends(patientData: PatientData): Promise<void> {
    const parameterTrends: Record<string, ParameterTrend> = {};
    
    // Group reports by parameter
    const parameterGroups: Record<string, ExtractedReport[]> = {};
    
    patientData.reports.forEach(report => {
      Object.keys(report.parameters).forEach(paramName => {
        if (!parameterGroups[paramName]) {
          parameterGroups[paramName] = [];
        }
        parameterGroups[paramName].push(report);
      });
    });

    // Calculate trends for each parameter
    Object.keys(parameterGroups).forEach(paramName => {
      const reports = parameterGroups[paramName]
        .sort((a, b) => new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime());

      if (reports.length >= 2) {
        const latest = reports[reports.length - 1];
        const previous = reports[reports.length - 2];
        
        const latestValue = latest.parameters[paramName]?.value;
        const previousValue = previous.parameters[paramName]?.value;
        
        if (latestValue !== undefined && previousValue !== undefined) {
          const change = latestValue - previousValue;
          const trend: 'increasing' | 'decreasing' | 'stable' = 
            change > 0 ? 'increasing' : change < 0 ? 'decreasing' : 'stable';
          
          const timeframe = this.calculateTimeframe(previous.reportDate, latest.reportDate);
          
          parameterTrends[paramName] = {
            trend,
            lastValue: latestValue,
            previousValue,
            change: `${change > 0 ? '+' : ''}${change.toFixed(2)}`,
            timeframe,
            lastReportDate: latest.reportDate
          };
        }
      }
    });

    patientData.trends.parameterTrends = parameterTrends;
    patientData.trends.lastUpdated = new Date().toISOString();
  }

  /**
   * Calculate timeframe between two dates
   */
  private static calculateTimeframe(date1: string, date2: string): string {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) return `${diffDays} days`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks`;
    if (diffDays <= 365) return `${Math.ceil(diffDays / 30)} months`;
    return `${Math.ceil(diffDays / 365)} years`;
  }

  /**
   * Get all patients (for future expansion)
   */
  static async getAllPatients(): Promise<string[]> {
    try {
      // For now, return the default patient
      // TODO: Scan data directory for all patient files
      return [this.DEFAULT_PATIENT];
    } catch (error) {
      console.error('Error getting all patients:', error);
      return [];
    }
  }

  /**
   * Export patient data as JSON string
   */
  static exportPatientData(patientData: PatientData): string {
    return JSON.stringify(patientData, null, 2);
  }

  /**
   * Import patient data from JSON string
   */
  static importPatientData(jsonString: string): PatientData | null {
    try {
      return JSON.parse(jsonString) as PatientData;
    } catch (error) {
      console.error('Error parsing imported data:', error);
      return null;
    }
  }
}
