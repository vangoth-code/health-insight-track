import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Image, X, CheckCircle, AlertCircle, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onUpload: (files: File[]) => void;
}

interface FileWithStatus {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress?: number;
  errorMessage?: string;
}

export const FileUpload = ({ onUpload }: FileUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileWithStatus[]>([]);
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

    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files);
      addFiles(files);
    }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      addFiles(files);
    }
    // Reset the input value so the same file can be selected again
    e.target.value = '';
  }, []);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      return {
        valid: false,
        error: "Invalid file type. Please upload PDF or image files (JPG, PNG)"
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: "File too large. Please upload files smaller than 10MB"
      };
    }

    return { valid: true };
  };

  const addFiles = (newFiles: File[]) => {
    const validatedFiles: FileWithStatus[] = [];
    let hasErrors = false;

    newFiles.forEach(file => {
      // Check if file already exists
      const exists = selectedFiles.some(f => f.file.name === file.name && f.file.size === file.size);
      if (exists) {
        toast({
          title: "Duplicate file",
          description: `${file.name} is already in the upload queue`,
          variant: "destructive"
        });
        return;
      }

      const validation = validateFile(file);
      if (validation.valid) {
        validatedFiles.push({
          file,
          id: Math.random().toString(36).substr(2, 9),
          status: 'pending'
        });
      } else {
        hasErrors = true;
        toast({
          title: "Invalid file",
          description: `${file.name}: ${validation.error}`,
          variant: "destructive"
        });
      }
    });

    if (validatedFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validatedFiles]);
      toast({
        title: "Files added",
        description: `${validatedFiles.length} file(s) added to upload queue`,
      });
    }
  };

  const removeFile = (id: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== id));
  };

  const removeAllFiles = () => {
    setSelectedFiles([]);
  };

  const handleBatchUpload = async () => {
    if (selectedFiles.length === 0) return;

    const filesToUpload = selectedFiles.filter(f => f.status === 'pending');
    if (filesToUpload.length === 0) {
      toast({
        title: "No files to upload",
        description: "All files have already been processed",
        variant: "destructive"
      });
      return;
    }

    // Update status to uploading
    setSelectedFiles(prev => 
      prev.map(f => 
        f.status === 'pending' 
          ? { ...f, status: 'uploading' as const, progress: 0 }
          : f
      )
    );

    try {
      // Simulate upload process with progress
      for (let i = 0; i < filesToUpload.length; i++) {
        const fileToUpload = filesToUpload[i];
        
        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 20) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setSelectedFiles(prev => 
            prev.map(f => 
              f.id === fileToUpload.id 
                ? { ...f, progress }
                : f
            )
          );
        }

        // Mark as successful
        setSelectedFiles(prev => 
          prev.map(f => 
            f.id === fileToUpload.id 
              ? { ...f, status: 'success' as const, progress: 100 }
              : f
          )
        );
      }

      // Call the upload handler with all files
      const files = filesToUpload.map(f => f.file);
      onUpload(files);

      toast({
        title: "Batch upload successful",
        description: `${files.length} blood report(s) have been processed and added to your records.`,
      });

    } catch (error) {
      // Mark failed uploads
      setSelectedFiles(prev => 
        prev.map(f => 
          f.status === 'uploading' 
            ? { ...f, status: 'error' as const, errorMessage: 'Upload failed' }
            : f
        )
      );

      toast({
        title: "Upload failed",
        description: "Some files failed to upload. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getFileIcon = (file: File) => {
    return file.type === 'application/pdf' ? (
      <FileText className="w-6 h-6 text-red-500" />
    ) : (
      <Image className="w-6 h-6 text-blue-500" />
    );
  };

  const getStatusIcon = (status: FileWithStatus['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: FileWithStatus['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'uploading':
        return <Badge variant="default">Uploading...</Badge>;
      case 'success':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return null;
    }
  };

  const pendingCount = selectedFiles.filter(f => f.status === 'pending').length;
  const successCount = selectedFiles.filter(f => f.status === 'success').length;

  return (
    <div className="space-y-4">
      {/* Upload Drop Zone */}
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
              <h3 className="text-lg font-medium">Upload Blood Reports</h3>
              <p className="text-muted-foreground">
                Drag and drop multiple reports here, or click to browse. The system will extract test dates for accurate trend analysis.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <FileText size={16} />
              <span>PDF</span>
              <span>•</span>
              <Image size={16} />
              <span>JPG, PNG</span>
              <span>•</span>
              <span>Max 10MB each</span>
              <span>•</span>
              <span>Multiple files supported</span>
            </div>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleChange}
              className="hidden"
              id="file-upload"
              multiple
            />
            <div className="flex gap-2 justify-center">
              <label htmlFor="file-upload">
                <Button variant="outline" className="cursor-pointer gap-2" asChild>
                  <span>
                    <Plus size={16} />
                    Add Files
                  </span>
                </Button>
              </label>
              {selectedFiles.length > 0 && (
                <Button onClick={removeAllFiles} variant="ghost" size="sm">
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {selectedFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{selectedFiles.length} file(s) selected</span>
                  {successCount > 0 && <span>{successCount} uploaded</span>}
                  {pendingCount > 0 && <span>{pendingCount} pending</span>}
                </div>
                {pendingCount > 0 && (
                  <Button onClick={handleBatchUpload} className="gap-2">
                    <Upload size={16} />
                    Upload All ({pendingCount})
                  </Button>
                )}
              </div>

              {/* File List */}
              <div className="space-y-3">
                {selectedFiles.map((fileWithStatus) => (
                  <div key={fileWithStatus.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      {getFileIcon(fileWithStatus.file)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{fileWithStatus.file.name}</p>
                          {getStatusIcon(fileWithStatus.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {(fileWithStatus.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        {fileWithStatus.status === 'uploading' && fileWithStatus.progress !== undefined && (
                          <Progress value={fileWithStatus.progress} className="w-full mt-1" />
                        )}
                        {fileWithStatus.status === 'error' && fileWithStatus.errorMessage && (
                          <p className="text-xs text-red-500 mt-1">{fileWithStatus.errorMessage}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getStatusBadge(fileWithStatus.status)}
                      <Button 
                        onClick={() => removeFile(fileWithStatus.id)} 
                        variant="ghost" 
                        size="sm"
                        className="text-destructive hover:text-destructive"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};