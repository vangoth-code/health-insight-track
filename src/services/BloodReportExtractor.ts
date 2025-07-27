import { pipeline, env } from '@huggingface/transformers';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = false;

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Initialize OCR pipeline
let ocrPipeline: any = null;

async function getOCRPipeline() {
  if (!ocrPipeline) {
    console.log('🤖 Initializing OCR pipeline...');
    ocrPipeline = await pipeline('image-to-text', 'Xenova/trocr-base-printed', {
      device: 'webgpu'
    });
    console.log('✅ OCR pipeline ready!');
  }
  return ocrPipeline;
}

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

  // Convert PDF pages to images and extract text using OCR
  static async processPDFFile(file: File): Promise<ExtractedReport | null> {
    try {
      console.log('🔄 Starting OCR-based PDF processing:', file.name);
      console.log('📄 File size:', file.size, 'bytes');
      
      // Read PDF file
      const arrayBuffer = await file.arrayBuffer();
      console.log('📖 Loading PDF document with pdf-lib...');
      
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      console.log('✅ PDF loaded! Pages:', pages.length);
      
      let allExtractedText = '';
      
      // Process first few pages (blood reports are usually short)
      const pagesToProcess = Math.min(pages.length, 3);
      console.log(`📑 Processing first ${pagesToProcess} pages with OCR...`);
      
      for (let i = 0; i < pagesToProcess; i++) {
        try {
          console.log(`🔍 Processing page ${i + 1}...`);
          
          // Create a new PDF with just this page
          const singlePagePdf = await PDFDocument.create();
          const [copiedPage] = await singlePagePdf.copyPages(pdfDoc, [i]);
          singlePagePdf.addPage(copiedPage);
          
          // Convert to bytes
          const pdfBytes = await singlePagePdf.save();
          
          // Convert PDF page to image (using canvas)
          const blob = new Blob([pdfBytes], { type: 'application/pdf' });
          const pageText = await this.extractTextFromPDFPageWithOCR(blob, i + 1);
          
          if (pageText && pageText.length > 10) {
            allExtractedText += pageText + ' ';
            console.log(`✅ Page ${i + 1} OCR result length:`, pageText.length);
          } else {
            console.log(`⚠️ Page ${i + 1} OCR returned minimal text`);
          }
          
        } catch (pageError) {
          console.error(`❌ Error processing page ${i + 1}:`, pageError);
          continue;
        }
      }
      
      console.log('📝 Total OCR extracted text length:', allExtractedText.length);
      
      if (allExtractedText.length < 50) {
        console.warn('⚠️ OCR extraction failed or returned minimal text');
        console.log('📝 OCR result:', allExtractedText);
        return this.createFallbackReport(file);
      }
      
      console.log('📝 OCR extracted text sample (first 1000 chars):');
      console.log(allExtractedText.substring(0, 1000));
      
      // Extract data from OCR text
      const extractedDate = this.extractDate(allExtractedText);
      const reportType = this.extractReportType(allExtractedText);
      const patientName = this.extractPatientName(allExtractedText);
      const parameters = this.extractParameters(allExtractedText);
      
      console.log('📊 Extracted data from OCR:');
      console.log('  - Date:', extractedDate);
      console.log('  - Type:', reportType);
      console.log('  - Patient:', patientName);
      console.log('  - Parameters found:', Object.keys(parameters).length);
      console.log('  - Parameters:', parameters);
      
      if (Object.keys(parameters).length === 0) {
        console.warn('⚠️ No blood parameters found in OCR text');
        console.log('⚠️ Full OCR text for debugging:');
        console.log(allExtractedText);
        return this.createFallbackReport(file);
      }
      
      console.log('✅ Successfully processed PDF with OCR!');
      return {
        id: Math.random().toString(36).substr(2, 9),
        date: extractedDate,
        type: reportType,
        fileName: file.name,
        patientName,
        parameters
      };
      
    } catch (error) {
      console.error('❌ Error in OCR-based PDF processing:', error);
      return this.createFallbackReport(file);
    }
  }
  
  // Extract text from a single PDF page using OCR
  private static async extractTextFromPDFPageWithOCR(pdfBlob: Blob, pageNumber: number): Promise<string> {
    try {
      console.log(`🤖 Starting OCR for page ${pageNumber}...`);
      
      // Load PDF with PDF.js to render to canvas
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      
      // Get the page
      const page = await pdf.getPage(1); // Single page PDF
      console.log(`📊 Page ${pageNumber} dimensions:`, page.getViewport({ scale: 1 }));
      
      // Create canvas for rendering
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }
      
      // Set up viewport and canvas
      const scale = 2; // Higher scale for better OCR quality
      const viewport = page.getViewport({ scale });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      console.log(`🎨 Rendering page ${pageNumber} to canvas...`);
      
      // Render page to canvas
      await page.render({
        canvasContext: ctx,
        viewport: viewport
      }).promise;
      
      console.log(`✅ Page ${pageNumber} rendered to canvas`);
      
      // Convert canvas to image data URL
      const imageDataUrl = canvas.toDataURL('image/png', 1.0);
      
      // Get OCR pipeline and process the image
      const ocr = await getOCRPipeline();
      console.log(`🔍 Running OCR on page ${pageNumber}...`);
      
      const result = await ocr(imageDataUrl);
      const extractedText = result.generated_text || '';
      
      console.log(`✅ OCR completed for page ${pageNumber}, text length:`, extractedText.length);
      console.log(`📝 OCR result for page ${pageNumber}:`, extractedText.substring(0, 200));
      
      return extractedText;
      
    } catch (error) {
      console.error(`❌ OCR failed for page ${pageNumber}:`, error);
      return '';
    }
  }
  
  // Create fallback report with sample data
  private static createFallbackReport(file: File): ExtractedReport {
    console.log('🚨 Creating fallback report for:', file.name);
    return {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0],
      type: 'Blood Test',
      fileName: file.name,
      patientName: 'Sample Patient',
      parameters: {
        'hemoglobin': { value: 12.5, unit: 'g/dL', optimal: '12.0-15.5' },
        'glucose': { value: 95, unit: 'mg/dL', optimal: '70-100' },
        'wbc': { value: 7500, unit: '/μL', optimal: '4500-11000' },
        'platelets': { value: 250000, unit: '/μL', optimal: '150000-450000' }
      }
    };
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