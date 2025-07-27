import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker for PDF.js - using a more reliable CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.min.js';

export interface BloodParameter {
  value: number;
  unit: string;
  optimal: string;
}

export interface ExtractedReport {
  id: string;
  date: string;
  type: string;
  fileName: string;
  patientName: string;
  parameters: Record<string, BloodParameter>;
}

export class BloodReportExtractor {
  // Common blood parameter patterns and their optimal ranges
  private static parameterPatterns = {
    hemoglobin: {
      patterns: [
        /hemoglobin[:\s]+(\d+\.?\d*)\s*(g\/dl|mg\/dl)/i,
        /hgb[:\s]+(\d+\.?\d*)\s*(g\/dl|mg\/dl)/i,
        /hb[:\s]+(\d+\.?\d*)\s*(g\/dl|mg\/dl)/i
      ],
      optimal: "12-15",
      unit: "g/dL"
    },
    wbc: {
      patterns: [
        /white blood cell[s]?[:\s]+(\d+\.?\d*)\s*(cells|k|thousand)/i,
        /wbc[:\s]+(\d+\.?\d*)\s*(cells|k|thousand)/i,
        /leukocytes[:\s]+(\d+\.?\d*)\s*(cells|k|thousand)/i
      ],
      optimal: "4500-11000",
      unit: "/μL"
    },
    platelets: {
      patterns: [
        /platelet[s]?[:\s]+(\d+\.?\d*)\s*(cells|k|thousand)/i,
        /plt[:\s]+(\d+\.?\d*)\s*(cells|k|thousand)/i,
        /thrombocytes[:\s]+(\d+\.?\d*)\s*(cells|k|thousand)/i
      ],
      optimal: "150000-450000",
      unit: "/μL"
    },
    glucose: {
      patterns: [
        /glucose[:\s]+(\d+\.?\d*)\s*(mg\/dl|mmol\/l)/i,
        /blood glucose[:\s]+(\d+\.?\d*)\s*(mg\/dl|mmol\/l)/i,
        /fasting glucose[:\s]+(\d+\.?\d*)\s*(mg\/dl|mmol\/l)/i
      ],
      optimal: "70-100",
      unit: "mg/dL"
    },
    cholesterol: {
      patterns: [
        /total cholesterol[:\s]+(\d+\.?\d*)\s*(mg\/dl|mmol\/l)/i,
        /cholesterol[:\s]+(\d+\.?\d*)\s*(mg\/dl|mmol\/l)/i,
        /chol[:\s]+(\d+\.?\d*)\s*(mg\/dl|mmol\/l)/i
      ],
      optimal: "<200",
      unit: "mg/dL"
    },
    triglycerides: {
      patterns: [
        /triglycerides[:\s]+(\d+\.?\d*)\s*(mg\/dl|mmol\/l)/i,
        /trig[:\s]+(\d+\.?\d*)\s*(mg\/dl|mmol\/l)/i,
        /trigs[:\s]+(\d+\.?\d*)\s*(mg\/dl|mmol\/l)/i
      ],
      optimal: "<150",
      unit: "mg/dL"
    },
    creatinine: {
      patterns: [
        /creatinine[:\s]+(\d+\.?\d*)\s*(mg\/dl)/i,
        /creat[:\s]+(\d+\.?\d*)\s*(mg\/dl)/i
      ],
      optimal: "0.6-1.2",
      unit: "mg/dL"
    },
    bun: {
      patterns: [
        /blood urea nitrogen[:\s]+(\d+\.?\d*)\s*(mg\/dl|mmol\/l)/i,
        /bun[:\s]+(\d+\.?\d*)\s*(mg\/dl|mmol\/l)/i,
        /urea[:\s]+(\d+\.?\d*)\s*(mg\/dl|mmol\/l)/i
      ],
      optimal: "7-20",
      unit: "mg/dL"
    }
  };

  // Extract date patterns from text
  private static extractDate(text: string): string {
    const datePatterns = [
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/,
      /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,
      /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}/i,
      /\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}/i
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        const dateStr = match[0];
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }
    }

    // Fallback to today's date
    return new Date().toISOString().split('T')[0];
  }

  // Extract report type from text
  private static extractReportType(text: string): string {
    const typePatterns = [
      /complete blood count/i,
      /cbc/i,
      /basic metabolic panel/i,
      /comprehensive metabolic panel/i,
      /lipid panel/i,
      /liver function/i,
      /kidney function/i,
      /thyroid function/i
    ];

    for (const pattern of typePatterns) {
      if (pattern.test(text)) {
        return text.match(pattern)?.[0] || "Blood Test";
      }
    }

    return "Blood Test";
  }

  // Extract patient name from text
  private static extractPatientName(text: string): string {
    const namePatterns = [
      /patient[:\s]+([A-Za-z\s,]+)(?:\n|DOB|Date of Birth|MRN|ID|Test)/i,
      /name[:\s]+([A-Za-z\s,]+)(?:\n|DOB|Date of Birth|MRN|ID|Test)/i,
      /patient name[:\s]+([A-Za-z\s,]+)(?:\n|DOB|Date of Birth|MRN|ID|Test)/i,
      /^([A-Za-z]+(?:\s+[A-Za-z]+)+)(?:\s*\n|\s+DOB|\s+Date)/im,
      /for[:\s]+([A-Za-z\s,]+)(?:\n|DOB|Date of Birth|MRN|ID|Test)/i
    ];

    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        let name = match[1].trim();
        // Clean up the name - remove common suffixes and format
        name = name.replace(/[,\n\r]+$/, ''); // Remove trailing commas/newlines
        name = name.replace(/\s+/g, ' '); // Normalize spaces
        if (name.length > 2 && name.length < 50) { // Reasonable name length
          return name;
        }
      }
    }

    // If no name found, try to extract from filename
    const fileName = text.match(/filename:\s*([^.]+)/i);
    if (fileName && fileName[1]) {
      const nameFromFile = fileName[1].replace(/[-_]/g, ' ').trim();
      if (nameFromFile.length > 2) {
        return nameFromFile;
      }
    }

    // Fallback to "Unknown Patient"
    return "Unknown Patient";
  }

  // Extract parameters from text using patterns
  private static extractParameters(text: string): Record<string, BloodParameter> {
    const parameters: Record<string, BloodParameter> = {};

    Object.entries(this.parameterPatterns).forEach(([paramName, config]) => {
      for (const pattern of config.patterns) {
        const match = text.match(pattern);
        if (match) {
          const value = parseFloat(match[1]);
          if (!isNaN(value)) {
            // Handle unit conversion if needed
            let finalValue = value;
            let finalUnit = config.unit;

            // Convert thousands notation for blood cells
            if ((paramName === 'wbc' || paramName === 'platelets') && match[2]?.toLowerCase().includes('k')) {
              finalValue = value * 1000;
            }

            parameters[paramName] = {
              value: finalValue,
              unit: finalUnit,
              optimal: config.optimal
            };
            break; // Found match, move to next parameter
          }
        }
      }
    });

    return parameters;
  }

  // Process PDF file using PDF.js
  static async processPDFFile(file: File): Promise<ExtractedReport | null> {
    try {
      console.log('🔄 Processing PDF file:', file.name);
      
      const arrayBuffer = await file.arrayBuffer();
      console.log('📄 File buffer created, size:', arrayBuffer.byteLength);
      
      const typedArray = new Uint8Array(arrayBuffer);
      
      // Add timeout for PDF loading
      const loadPDFWithTimeout = () => {
        return Promise.race([
          pdfjsLib.getDocument(typedArray).promise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('PDF loading timeout')), 10000)
          )
        ]);
      };
      
      console.log('📖 Loading PDF document...');
      const pdf = await loadPDFWithTimeout() as any;
      console.log('✅ PDF loaded successfully! Pages:', pdf.numPages);
      
      let extractedText = '';
      
      // Extract text from all pages
      for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) { // Limit to first 5 pages
        console.log(`📑 Processing page ${i}...`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => ('str' in item ? item.str : ''))
          .join(' ');
        extractedText += pageText + ' ';
        console.log(`📝 Page ${i} text length:`, pageText.length);
      }

      console.log('📋 Total extracted text length:', extractedText.length);
      console.log('📋 First 500 chars:', extractedText.substring(0, 500));

      const extractedDate = this.extractDate(extractedText);
      const reportType = this.extractReportType(extractedText);
      const patientName = this.extractPatientName(extractedText);
      const parameters = this.extractParameters(extractedText);

      console.log('📊 Extracted data:');
      console.log('  - Date:', extractedDate);
      console.log('  - Type:', reportType);
      console.log('  - Patient:', patientName);
      console.log('  - Parameters:', parameters);

      if (Object.keys(parameters).length === 0) {
        console.warn('⚠️ No blood parameters found in PDF text');
        console.log('Full text for debugging:', extractedText);
        return null;
      }

      const result = {
        id: Math.random().toString(36).substr(2, 9),
        date: extractedDate,
        type: reportType,
        fileName: file.name,
        patientName,
        parameters
      };

      console.log('✅ Successfully extracted report:', result);
      return result;

    } catch (error) {
      console.error('❌ Error processing PDF:', error);
      console.error('Error details:', error instanceof Error ? error.message : error);
      return null;
    }
  }

  // Process image file (basic OCR simulation)
  static async processImageFile(file: File): Promise<ExtractedReport | null> {
    try {
      console.log('Processing image file:', file.name);
      
      // For now, return a simulated extraction result
      // In a real implementation, you would use OCR libraries like Tesseract.js
      console.log('Image OCR not fully implemented - returning simulated data');
      
      // Simulate some extracted data based on filename or return null
      if (file.name.toLowerCase().includes('blood') || file.name.toLowerCase().includes('test')) {
        return {
          id: Math.random().toString(36).substr(2, 9),
          date: new Date().toISOString().split('T')[0],
          type: "Blood Test (Image)",
          fileName: file.name,
          patientName: "Sample Patient", // In real implementation, extract from OCR
          parameters: {
            // Simulated data - in real implementation this would come from OCR
            hemoglobin: { value: 13.5, unit: "g/dL", optimal: "12-15" },
            glucose: { value: 92, unit: "mg/dL", optimal: "70-100" }
          }
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error processing image:', error);
      return null;
    }
  }

  // Main processing function
  static async processFile(file: File): Promise<ExtractedReport | null> {
    console.log('Processing file:', file.name, 'Type:', file.type);

    if (file.type === 'application/pdf') {
      return await this.processPDFFile(file);
    } else if (file.type.startsWith('image/')) {
      return await this.processImageFile(file);
    } else {
      console.error('Unsupported file type:', file.type);
      return null;
    }
  }

  // Process multiple files
  static async processFiles(files: File[]): Promise<ExtractedReport[]> {
    console.log('Processing', files.length, 'files');
    
    const results: ExtractedReport[] = [];
    
    for (const file of files) {
      try {
        const result = await this.processFile(file);
        if (result) {
          results.push(result);
        }
      } catch (error) {
        console.error('Error processing file:', file.name, error);
      }
    }
    
    console.log('Successfully processed', results.length, 'out of', files.length, 'files');
    return results;
  }
}