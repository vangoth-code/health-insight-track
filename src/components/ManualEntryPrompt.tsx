import React from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { FileText, AlertTriangle, ArrowRight } from 'lucide-react';

interface ManualEntryPromptProps {
  fileName: string;
  failureReason: string;
  onManualEntry: () => void;
  onRetryUpload?: () => void;
}

export const ManualEntryPrompt: React.FC<ManualEntryPromptProps> = ({
  fileName,
  failureReason,
  onManualEntry,
  onRetryUpload
}) => {
  return (
    <Alert className="border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-800">
        PDF Processing Failed
      </AlertTitle>
      <AlertDescription className="text-orange-700 mt-2">
        <div className="space-y-3">
          <div>
            <p className="font-medium">File: {fileName}</p>
            <p className="text-sm mt-1">
              <strong>Reason:</strong> {failureReason}
            </p>
          </div>
          
          <div className="bg-orange-100 p-3 rounded-md">
            <p className="text-sm font-medium text-orange-800 mb-2">
              What happened?
            </p>
            <ul className="text-xs text-orange-700 space-y-1 list-disc list-inside">
              <li>PDF.js worker failed to load (browser compatibility issue)</li>
              <li>Tesseract.js OCR couldn't convert PDF to readable image</li>
              <li>No embedded text found in the PDF</li>
              <li>File format may be corrupted or unsupported</li>
            </ul>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={onManualEntry}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <FileText className="h-4 w-4 mr-2" />
              Enter Data Manually
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            
            {onRetryUpload && (
              <Button 
                onClick={onRetryUpload}
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                Try Different File
              </Button>
            )}
          </div>
          
          <div className="text-xs text-orange-600 bg-orange-100 p-2 rounded">
            <p className="font-medium">💡 Tip:</p>
            <p>Try converting your PDF to an image (PNG/JPG) first, or use the Manual Data Entry tab to input the results directly.</p>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};

