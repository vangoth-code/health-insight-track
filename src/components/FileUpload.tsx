import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Image, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onUpload: (file: File) => void;
}

export const FileUpload = ({ onUpload }: FileUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  }, []);

  const validateAndSetFile = (file: File) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or image file (JPG, PNG)",
        variant: "destructive"
      });
      return;
    }

    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
      toast({
        title: "Report uploaded successfully",
        description: "Your blood report has been processed and added to your records.",
      });
      setSelectedFile(null);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  return (
    <div className="space-y-4">
      <Card 
        className={`border-2 border-dashed transition-colors ${
          dragActive 
            ? "border-primary bg-primary/5" 
            : "border-border hover:border-primary/50"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Upload Blood Report</h3>
              <p className="text-muted-foreground">
                Drag and drop your report here, or click to browse. The system will extract the test date from the report for accurate trend analysis.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <FileText size={16} />
              <span>PDF</span>
              <span>•</span>
              <Image size={16} />
              <span>JPG, PNG</span>
              <span>•</span>
              <span>Max 10MB</span>
            </div>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button variant="outline" className="cursor-pointer" asChild>
                <span>Choose File</span>
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>

      {selectedFile && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedFile.type === 'application/pdf' ? (
                  <FileText className="w-8 h-8 text-red-500" />
                ) : (
                  <Image className="w-8 h-8 text-blue-500" />
                )}
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleUpload} size="sm">
                  Upload
                </Button>
                <Button 
                  onClick={removeFile} 
                  variant="ghost" 
                  size="sm"
                  className="text-destructive hover:text-destructive"
                >
                  <X size={16} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};