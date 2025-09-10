import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileText, Image, Upload, TestTube } from 'lucide-react';
import { BloodReportExtractor, ExtractedReport } from '@/services/BloodReportExtractor';
import { useToast } from '@/hooks/use-toast';

export const OCRTester = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ExtractedReport[]>([]);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

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
        title: "Testing OCR",
        description: `Processing ${files.length} sample images...`
      });

      // Process each file with progress updates
      const processedResults: ExtractedReport[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress((i / files.length) * 100);
        
        try {
          console.log(`Processing sample image ${i + 1}/${files.length}: ${file.name}`);
          const result = await BloodReportExtractor.processFile(file);
          
          if (result) {
            processedResults.push(result);
            console.log(`✅ Successfully processed ${file.name}:`, result);
          } else {
            console.warn(`⚠️ Failed to process ${file.name}`);
          }
        } catch (error) {
          console.error(`❌ Error processing ${file.name}:`, error);
        }
      }

      setProgress(100);
      setResults(processedResults);

      toast({
        title: "OCR Test Complete",
        description: `Successfully processed ${processedResults.length} out of ${files.length} images`
      });

    } catch (error) {
      console.error('Error in OCR test:', error);
      toast({
        title: "OCR Test Failed",
        description: "An error occurred while testing the OCR functionality",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
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
            <TestTube className="w-5 h-5" />
            OCR Testing Tool
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Test the OCR functionality with the sample blood report images. This will process the images 
            in the report_sample_images directory and show the extracted blood parameters.
          </p>
          
          <Button 
            onClick={testWithSampleImages} 
            disabled={isProcessing}
            className="gap-2"
          >
            <Upload size={16} />
            {isProcessing ? 'Processing...' : 'Test OCR with Sample Images'}
          </Button>

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
          <h3 className="text-lg font-semibold">OCR Test Results</h3>
          
          {results.map((result, index) => (
            <Card key={result.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    {result.fileName}
                  </div>
                  <Badge variant="outline">{result.type}</Badge>
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  Patient: {result.patientName} • Date: {result.date}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(result.parameters).map(([key, param]) => (
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
                
                {Object.keys(result.parameters).length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No blood parameters were extracted from this image</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}; 