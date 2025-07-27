import pdfParse from 'pdf-parse';

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
        /white blood cell[s]?[:\s]+(\d+\.?\d*)\s*([\/μl|cells\/μl|k\/μl])/i,
        /wbc[:\s]+(\d+\.?\d*)\s*([\/μl|cells\/μl|k\/μl])/i,
        /leukocytes[:\s]+(\d+\.?\d*)\s*([\/μl|cells\/μl|k\/μl])/i
      ],
      optimal: "4500-11000",
      unit: "/μL"
    },
    platelets: {
      patterns: [
        /platelet[s]?[:\s]+(\d+\.?\d*)\s*([\/μl|cells\/μl|k\/μl])/i,
        /plt[:\s]+(\d+\.?\d*)\s*([\/μl|cells\/μl|k\/μl])/i,
        /thrombocytes[:\s]+(\d+\.?\d*)\s*([\/μl|cells\/μl|k\/μl])/i
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
        /creatinine[:\s]+(\d+\.?\d*)\s*(mg\/dl|μmol\/l)/i,
        /creat[:\s]+(\d+\.?\d*)\s*(mg\/dl|μmol\/l)/i
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

  // Process PDF file
  static async processPDFFile(file: File): Promise<ExtractedReport | null> {
    try {
      console.log('Processing PDF file:', file.name);
      
      const arrayBuffer = await file.arrayBuffer();
      const data = await pdfParse(Buffer.from(arrayBuffer));
      const text = data.text;

      console.log('Extracted PDF text:', text.substring(0, 500) + '...');

      const extractedDate = this.extractDate(text);
      const reportType = this.extractReportType(text);
      const parameters = this.extractParameters(text);

      console.log('Extracted parameters:', parameters);

      if (Object.keys(parameters).length === 0) {
        console.warn('No parameters found in PDF');
        return null;
      }

      return {
        id: Math.random().toString(36).substr(2, 9),
        date: extractedDate,
        type: reportType,
        fileName: file.name,
        parameters
      };
    } catch (error) {
      console.error('Error processing PDF:', error);
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
      const result = await this.processFile(file);
      if (result) {
        results.push(result);
      }
    }
    
    console.log('Successfully processed', results.length, 'out of', files.length, 'files');
    return results;
  }
}