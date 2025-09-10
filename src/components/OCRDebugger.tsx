import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileText, Image, Upload, Bug, Eye, EyeOff } from 'lucide-react';
import { BloodReportExtractor, ExtractedReport, testOCRWithSampleText } from '@/services/BloodReportExtractor';
import { useToast } from '@/hooks/use-toast';

interface OCRDebugResult {
  fileName: string;
  rawText: string;
  extractedReport: ExtractedReport | null;
  processingTime: number;
  error?: string;
}

export const OCRDebugger = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<OCRDebugResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [showRawText, setShowRawText] = useState(true);
  const { toast } = useToast();

  const testOCRWithSimpleText = async () => {
    try {
      setIsProcessing(true);
      const result = await testOCRWithSampleText();
      
      toast({
        title: "OCR Test Result",
        description: result.length > 10 ? "OCR is working!" : "OCR test failed",
        variant: result.length > 10 ? "default" : "destructive"
      });
      
      console.log('🧪 OCR Test Result:', result);
    } catch (error) {
      console.error('🧪 OCR Test Error:', error);
      toast({
        title: "OCR Test Failed",
        description: "Error testing OCR functionality",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const testWithSampleImages = async () => {
    setIsProcessing(true);
    setProgress(0);
    setResults([]);

    try {
      // Create File objects from the sample images
      const sampleImages = [
        '1753600763889-debac937-eab8-4372-8d74-7ff00e0930b8_1.jpg',
        '1753600763889-debac937-eab8-4372-8d74-7ff00e0930b8_2.jpg',
        '1753600763889-debac937-eab8-4372-8d74-7ff00e0930b8_3.jpg',
        '1753600763889-debac937-eab8-4372-8d74-7ff00e0930b8_4.jpg'
      ];

      const files: File[] = [];

      for (const imageName of sampleImages) {
        try {
          const response = await fetch(`/report_sample_images/${imageName}`);
          const blob = await response.blob();
          const file = new File([blob], imageName, { type: 'image/jpeg' });
          files.push(file);
        } catch (error) {
          console.error(`Failed to load sample image ${imageName}:`, error);
        }
      }

      if (files.length === 0) {
        toast({
          title: "No sample images found",
          description: "Please ensure the sample images are in the public/report_sample_images directory",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Testing OCR Debug",
        description: `Processing ${files.length} sample images with detailed logging...`
      });

      // Process each file with progress updates
      const debugResults: OCRDebugResult[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress((i / files.length) * 100);
        
        try {
          console.log(`🔍 DEBUG: Processing sample image ${i + 1}/${files.length}: ${file.name}`);
          
          const startTime = Date.now();
          
          // Create a custom OCR processing function that captures raw text
          const rawText = await getRawOCRText(file);
          const processingTime = Date.now() - startTime;
          
          console.log(`🔍 DEBUG: Raw OCR text for ${file.name}:`, rawText);
          
          // Now process with the normal extractor
          const result = await BloodReportExtractor.processFile(file);
          
          debugResults.push({
            fileName: file.name,
            rawText: rawText,
            extractedReport: result,
            processingTime: processingTime
          });
          
          console.log(`✅ DEBUG: Successfully processed ${file.name}:`, result);
          
        } catch (error) {
          console.error(`❌ DEBUG: Error processing ${file.name}:`, error);
          debugResults.push({
            fileName: file.name,
            rawText: '',
            extractedReport: null,
            processingTime: 0,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      setProgress(100);
      setResults(debugResults);

      toast({
        title: "OCR Debug Complete",
        description: `Processed ${debugResults.length} images. Check console for detailed logs.`
      });

    } catch (error) {
      console.error('Error in OCR debug test:', error);
      toast({
        title: "OCR Debug Failed",
        description: "An error occurred while testing the OCR functionality",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to get raw OCR text without parameter extraction
  const getRawOCRText = async (file: File): Promise<string> => {
    try {
      // Method 1: Try Hugging Face OCR
      try {
        const { pipeline } = await import('@huggingface/transformers');
        const imageDataUrl = await fileToDataURL(file);
        
        const ocr = await pipeline('image-to-text', 'Xenova/trocr-base-printed', { 
          device: 'wasm'
        });
        
        const result = await ocr(imageDataUrl);
        const text = (result as any).generated_text || '';
        if (text && text.length > 10) {
          return `[Hugging Face OCR] ${text}`;
        }
      } catch (error) {
        console.warn('Hugging Face OCR failed:', error);
      }
      
      // Method 2: Try Tesseract.js
      try {
        const { createWorker } = await import('tesseract.js');
        const worker = await createWorker('eng');
        
        const result = await worker.recognize(file);
        const text = result.data.text;
        await worker.terminate();
        
        if (text && text.length > 10) {
          return `[Tesseract.js OCR] ${text}`;
        }
      } catch (error) {
        console.warn('Tesseract.js OCR failed:', error);
      }
      
      return 'All OCR methods failed to extract meaningful text';
      
    } catch (error) {
      console.error('Error getting raw OCR text:', error);
      return `OCR Error: ${error instanceof Error ? error.message : String(error)}`;
    }
  };

  // Helper function to convert file to data URL
  const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const formatParameterName = (name: string) => {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5" />
            OCR Debug Tool
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Debug the OCR functionality by showing raw OCR output and detailed processing information. 
            This will help identify why parameters aren't being extracted correctly.
          </p>
          
          <div className="flex gap-2">
            <Button 
              onClick={testOCRWithSimpleText} 
              disabled={isProcessing}
              variant="outline"
              className="gap-2"
            >
              <Bug size={16} />
              {isProcessing ? 'Testing...' : 'Test OCR with Simple Text'}
            </Button>
            
            <Button 
              onClick={testWithSampleImages} 
              disabled={isProcessing}
              className="gap-2"
            >
              <Upload size={16} />
              {isProcessing ? 'Processing...' : 'Debug OCR with Sample Images'}
            </Button>
            
            <Button 
              onClick={() => setShowRawText(!showRawText)}
              variant="outline"
              className="gap-2"
            >
              {showRawText ? <EyeOff size={16} /> : <Eye size={16} />}
              {showRawText ? 'Hide Raw Text' : 'Show Raw Text'}
            </Button>
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing sample images...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">OCR Debug Results</h3>
          
          {results.map((result, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    {result.fileName}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={result.error ? "destructive" : "outline"}>
                      {result.error ? 'Error' : 'Success'}
                    </Badge>
                    <Badge variant="secondary">
                      {result.processingTime}ms
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Error Display */}
                {result.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 font-medium">Error:</p>
                    <p className="text-red-700 text-sm">{result.error}</p>
                  </div>
                )}

                {/* Raw OCR Text */}
                {showRawText && (
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <FileText size={16} />
                      Raw OCR Text ({result.rawText.length} characters)
                    </h4>
                    <div className="p-3 bg-gray-50 border rounded-lg max-h-40 overflow-y-auto">
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                        {result.rawText || 'No text extracted'}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Extracted Report */}
                {result.extractedReport && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Extracted Report</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(result.extractedReport.parameters).map(([key, param]) => (
                        <div key={key} className="p-3 border rounded-lg">
                          <div className="font-medium text-sm">
                            {formatParameterName(key)}
                          </div>
                          <div className="text-lg font-bold">
                            {param.value} {param.unit}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Normal: {param.optimal}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {Object.keys(result.extractedReport.parameters).length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No blood parameters were extracted from this image</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Processing Info */}
                <div className="text-xs text-muted-foreground">
                  <p>Processing Time: {result.processingTime}ms</p>
                  <p>Raw Text Length: {result.rawText.length} characters</p>
                  <p>Parameters Found: {result.extractedReport ? Object.keys(result.extractedReport.parameters).length : 0}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}; 