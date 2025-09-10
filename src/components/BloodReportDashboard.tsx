import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Upload, TrendingUp, Users, FileText, BarChart3, TestTube, Bug, Save, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Import components
import { FileUpload } from "@/components/FileUpload";
import { PatientSelector } from "@/components/PatientSelector";
import { TrendChart } from "@/components/TrendChart";
import { ComparisonView } from "@/components/ComparisonView";
import { BloodReportExtractor } from "@/services/BloodReportExtractor";
import { PatientDataService, PatientData } from "@/services/PatientDataService";
import { ManualDataEntry } from "@/components/ManualDataEntry";
import { SuggestionsPanel } from "@/components/SuggestionsPanel";
import { ParameterCard } from "@/components/ParameterCard";
import { OCRTester } from "@/components/OCRTester";
import { OCRDebugger } from "@/components/OCRDebugger";
import { EnhancedTrendChart } from "@/components/EnhancedTrendChart";
import { PatientDataViewer } from "@/components/PatientDataViewer";
import { ManualEntryPrompt } from "@/components/ManualEntryPrompt";

interface BloodParameter {
  value: number;
  unit: string;
  optimal: string;
  status: 'normal' | 'high' | 'low' | 'critical';
  healthInsight?: string;
  recommendation?: string;
}

interface BloodReport {
  id: number | string;
  date: string;
  type: string;
  uploadDate?: string;
  fileName?: string;
  patientName: string;
  parameters: Record<string, BloodParameter>;
}

interface CriticalChange {
  parameter: string;
  change: number;
  status: string;
  current: number;
  previous: number;
  unit: string;
}

// Extended mock data for demonstration
const mockReports: BloodReport[] = [
  {
    id: 1,
    date: "2024-01-15",
    type: "Complete Blood Count",
    uploadDate: "2024-01-20",
    patientName: "John Smith",
    parameters: {
      hemoglobin: { value: 13.2, unit: "g/dL", optimal: "12-15", status: "normal" },
      wbc: { value: 7200, unit: "/μL", optimal: "4500-11000", status: "normal" },
      platelets: { value: 250000, unit: "/μL", optimal: "150000-450000", status: "normal" },
      glucose: { value: 92, unit: "mg/dL", optimal: "70-100", status: "normal" },
      cholesterol: { value: 185, unit: "mg/dL", optimal: "<200", status: "normal" }
    }
  },
  {
    id: 2,
    date: "2023-10-10",
    type: "Complete Blood Count",
    uploadDate: "2023-10-15",
    patientName: "John Smith",
    parameters: {
      hemoglobin: { value: 12.8, unit: "g/dL", optimal: "12-15", status: "normal" },
      wbc: { value: 6800, unit: "/μL", optimal: "4500-11000", status: "normal" },
      platelets: { value: 240000, unit: "/μL", optimal: "150000-450000", status: "normal" },
      glucose: { value: 88, unit: "mg/dL", optimal: "70-100", status: "normal" },
      cholesterol: { value: 195, unit: "mg/dL", optimal: "<200", status: "normal" }
    }
  },
  {
    id: 3,
    date: "2024-02-20",
    type: "Lipid Panel",
    uploadDate: "2024-02-25",
    patientName: "Sarah Johnson",
    parameters: {
      cholesterol: { value: 220, unit: "mg/dL", optimal: "<200", status: "high" },
      triglycerides: { value: 165, unit: "mg/dL", optimal: "<150", status: "high" },
      hdl: { value: 45, unit: "mg/dL", optimal: ">40", status: "normal" },
      ldl: { value: 140, unit: "mg/dL", optimal: "<100", status: "high" }
    }
  }
];

export const BloodReportDashboard = () => {
  const [selectedPatient, setSelectedPatient] = useState<string>("urmila-sharma");
  const [activeTab, setActiveTab] = useState("overview");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<{
    current: number;
    total: number;
    currentFile: string;
  } | null>(null);
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const { toast } = useToast();

  // Load patient data on component mount
  useEffect(() => {
    const loadPatientData = async () => {
      console.log('🔄 Loading patient data for:', selectedPatient);
      const data = await PatientDataService.loadPatientData(selectedPatient);
      console.log('📊 Loaded patient data:', data);
      setPatientData(data);
    };
    loadPatientData();
  }, [selectedPatient]);

  // Get patient data from the loaded JSON data
  const patientReports = patientData?.reports || [];
  
  console.log('📋 Raw patient reports:', patientReports);
  console.log('📋 Patient data object:', patientData);
  console.log('📋 Selected patient:', selectedPatient);
  
  // Convert ExtractedReport to BloodReport format for display
  const convertToBloodReport = (extractedReport: any): BloodReport => {
    const converted = {
      id: extractedReport.id,
      date: extractedReport.reportDate || extractedReport.date,
      type: extractedReport.type,
      uploadDate: extractedReport.uploadDate,
      fileName: extractedReport.fileName,
      patientName: extractedReport.patientName,
      parameters: extractedReport.parameters
    };
    console.log('🔄 Converting report:', extractedReport, 'to:', converted);
    return converted;
  };
  
  const displayReports = patientReports.map(convertToBloodReport);
  console.log('📊 Display reports:', displayReports);

  // Check if a report requires manual entry
  const requiresManualEntry = (report: any): boolean => {
    return report.metadata?.requiresManualEntry === true;
  };

  // Get the failure reason for manual entry reports
  const getFailureReason = (report: any): string => {
    return report.metadata?.failureReason || 'Unknown processing error';
  };
  
  const latestReport = displayReports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  const previousReport = displayReports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[1];
  
  console.log('📈 Latest report:', latestReport);
  console.log('📉 Previous report:', previousReport);

  const handleFileUpload = async (files: File[]) => {
    console.log('🚨 DASHBOARD handleFileUpload CALLED! Files:', files);
    
    setIsProcessing(true);
    setProcessingProgress({
      current: 0,
      total: files.length,
      currentFile: 'Starting...'
    });
    
    try {
      console.log('=== handleFileUpload called with files:', files);
      console.log('Number of files:', files.length);
      files.forEach((file, index) => {
        console.log(`File ${index}:`, file.name, file.type, file.size);
      });
      
      // Show processing toast
      toast({
        title: "Processing files...",
        description: `Analyzing ${files.length} file(s). This may take a moment.`,
      });

      // Process files using BloodReportExtractor with progress updates
      console.log('=== Starting BloodReportExtractor.processFiles');
      const extractedReports = await BloodReportExtractor.processFiles(files, (progress) => {
        setProcessingProgress(progress);
      });
      console.log('=== BloodReportExtractor completed. Results:', extractedReports);
      
      if (extractedReports.length === 0) {
        console.log('=== No reports extracted');
        toast({
          title: "No data extracted",
          description: "Could not extract blood test data from the uploaded files. Please ensure they contain readable test results.",
          variant: "destructive"
        });
        return;
      }

      // Automatically save to patient data JSON
      console.log('💾 Saving reports to patient data...');
      console.log('💾 Selected patient:', selectedPatient);
      console.log('💾 Reports to save:', extractedReports);
      
      for (const report of extractedReports) {
        console.log('💾 Saving report:', report);
        const saveResult = await PatientDataService.addReport(selectedPatient, report);
        console.log('💾 Save result:', saveResult);
      }

      // Reload patient data to get updated information
      console.log('🔄 Reloading patient data...');
      const updatedData = await PatientDataService.loadPatientData(selectedPatient);
      console.log('📊 Updated patient data:', updatedData);
      console.log('📊 Number of reports after save:', updatedData?.reports?.length || 0);
      
      if (updatedData) {
        setPatientData(updatedData);
        console.log('✅ Patient data updated in state');
        
        // Force a re-render by updating a timestamp
        setActiveTab(activeTab); // This will trigger a re-render
        
        // Show success message with report count
        toast({
          title: "Data Updated!",
          description: `Patient data now has ${updatedData.reports.length} reports. Check the Overview tab.`,
        });
      } else {
        console.error('❌ Failed to load updated patient data');
        toast({
          title: "Data Update Failed",
          description: "Could not reload patient data after saving report.",
          variant: "destructive"
        });
      }

      // Keep the current patient (Urmila Sharma) - don't switch patients
      console.log('=== Upload completed for patient:', selectedPatient);

      // Switch to overview tab to show results
      setActiveTab("overview");

      // Success toast
      toast({
        title: "Upload successful!",
        description: `Successfully processed ${extractedReports.length} out of ${files.length} files for ${selectedPatient}.`,
      });

      console.log('=== Upload process completed successfully');

    } catch (error) {
      console.error('=== Error processing files:', error);
      toast({
        title: "Processing failed",
        description: "An error occurred while processing your files. Please try again or check the file format.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProcessingProgress(null);
    }
  };

  const handleSaveData = async () => {
    try {
      setIsSaving(true);
      console.log('💾 Saving data to file...');
      
      const success = await PatientDataService.saveCurrentDataToFile(selectedPatient);
      
      if (success) {
        toast({
          title: "Data saved successfully!",
          description: "Your patient data has been saved. Check your Downloads folder for the JSON file.",
        });
      } else {
        toast({
          title: "Save failed",
          description: "Failed to save data. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Error saving data:', error);
      toast({
        title: "Save failed",
        description: "An error occurred while saving your data.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearData = async () => {
    try {
      setIsClearing(true);
      console.log('🗑️ Clearing all data...');
      
      const success = await PatientDataService.clearPatientData(selectedPatient);
      
      if (success) {
        // Reload patient data to get the original data from JSON file
        const updatedData = await PatientDataService.loadPatientData(selectedPatient);
        setPatientData(updatedData);
        
        toast({
          title: "Data cleared successfully!",
          description: "All reports including sample data have been removed. Patient record is now clean.",
        });
      } else {
        toast({
          title: "Clear failed",
          description: "Failed to clear data. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Error clearing data:', error);
      toast({
        title: "Clear failed",
        description: "An error occurred while clearing your data.",
        variant: "destructive"
      });
    } finally {
      setIsClearing(false);
    }
  };

  const getParameterStatus = (value: number, optimal: string): "normal" | "high" | "low" => {
    if (optimal.includes("<")) {
      const limit = parseFloat(optimal.replace("<", ""));
      return value < limit ? "normal" : "high";
    }
    if (optimal.includes(">")) {
      const limit = parseFloat(optimal.replace(">", ""));
      return value > limit ? "normal" : "low";
    }
    if (optimal.includes("-")) {
      const [min, max] = optimal.split("-").map(n => parseFloat(n));
      if (value < min) return "low";
      if (value > max) return "high";
      return "normal";
    }
    return "normal";
  };

  const getParameterTrend = (current: number, previous: number): "up" | "down" | "stable" => {
    const change = Math.abs(current - previous) / previous;
    if (change < 0.05) return "stable";
    return current > previous ? "up" : "down";
  };

  const getCriticalChanges = (): CriticalChange[] => {
    if (!latestReport || !previousReport) return [];

    const changes: CriticalChange[] = [];
    
    Object.entries(latestReport.parameters).forEach(([key, current]) => {
      const previous = previousReport.parameters[key];
      if (previous && previous.value !== 0) {
        const change = ((current.value - previous.value) / previous.value) * 100;
        const status = getParameterStatus(current.value, current.optimal);
        
        if (Math.abs(change) > 10 || status !== "normal") {
          changes.push({
            parameter: key,
            change,
            status,
            current: current.value,
            previous: previous.value,
            unit: current.unit
          });
        }
      }
    });

    return changes.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  };

  const criticalChanges = getCriticalChanges();

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                Processing Files...
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {processingProgress && (
                <>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Processing {processingProgress.current} of {processingProgress.total} files
                    </p>
                    <p className="text-sm font-medium mt-1">
                      {processingProgress.currentFile}
                    </p>
                  </div>
                  <Progress value={(processingProgress.current / processingProgress.total) * 100} />
                  <p className="text-xs text-muted-foreground text-center">
                    This may take a few minutes for large files or multiple reports
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Blood Report Tracker</h1>
            <p className="text-muted-foreground">Monitor health parameters and trends</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => setActiveTab("upload")}
            >
              <Upload size={20} />
              Upload Reports
            </Button>
            <Button 
              variant="default" 
              className="gap-2"
              onClick={handleSaveData}
              disabled={isSaving || !patientData}
            >
              <Save size={20} />
              {isSaving ? "Saving..." : "Save Data"}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="gap-2"
                  disabled={isClearing || !patientData}
                >
                  <Trash2 size={20} />
                  {isClearing ? "Clearing..." : "Clear Data"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear All Data</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to clear all data for {selectedPatient}? 
                    This action will remove all reports including sample data, leaving you with a completely clean patient record. 
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleClearData}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Clear All Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Badge 
              variant="secondary" 
              className="px-3 py-1 cursor-pointer hover:bg-secondary/80 transition-colors"
              onClick={() => setActiveTab("data")}
            >
              {displayReports.length} Reports
            </Badge>
          </div>
        </div>

        {/* Patient Selector */}
        <PatientSelector
          reports={displayReports}
          selectedPatient={selectedPatient}
          onPatientChange={setSelectedPatient}
          usePatientHistory={false}
        />

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                  <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 size={16} />
            Overview
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-2">
            <TrendingUp size={16} />
            Trends
          </TabsTrigger>
          <TabsTrigger value="comparison" className="gap-2">
            <FileText size={16} />
            Compare
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="gap-2">
            <Users size={16} />
            Insights
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-2">
            <Upload size={16} />
            Upload
          </TabsTrigger>
          <TabsTrigger value="ocr-test" className="gap-2">
            <TestTube size={16} />
            OCR Test
          </TabsTrigger>
          <TabsTrigger value="ocr-debug" className="gap-2">
            <Bug size={16} />
            OCR Debug
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-2">
            <FileText size={16} />
            Data
          </TabsTrigger>
        </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {latestReport ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Latest Parameters - {latestReport.patientName}
                      <Badge variant="outline">{latestReport.date}</Badge>
                    </CardTitle>
                    <CardDescription>
                      {latestReport.type} • Report Date: {latestReport.date}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(latestReport.parameters).map(([key, param]) => {
                        const status = getParameterStatus(param.value, param.optimal);
                        const previousParam = previousReport?.parameters[key];
                        const trend = previousParam ? getParameterTrend(param.value, previousParam.value) : undefined;
                        
                        return (
                          <ParameterCard
                            key={key}
                            name={key}
                            value={param.value}
                            unit={param.unit}
                            optimal={param.optimal}
                            status={param.status}
                            trend={trend}
                            previousValue={previousParam?.value}
                            healthInsight={param.healthInsight}
                            recommendation={param.recommendation}
                          />
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Manual Entry Prompts */}
                {displayReports.filter(requiresManualEntry).map((report) => (
                  <ManualEntryPrompt
                    key={report.id}
                    fileName={report.fileName || 'Unknown file'}
                    failureReason={getFailureReason(report)}
                    onManualEntry={() => setActiveTab('manual')}
                    onRetryUpload={() => setActiveTab('upload')}
                  />
                ))}

                {/* Quick Insights */}
                {criticalChanges.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Insights</CardTitle>
                      <CardDescription>
                        Notable changes since your last report
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2">
                        {criticalChanges.slice(0, 3).map((change) => (
                          <div key={change.parameter} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <span className="font-medium capitalize">
                                {change.parameter.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                              <span className="text-sm text-muted-foreground ml-2">
                                {change.previous} → {change.current} {change.unit}
                              </span>
                            </div>
                            <Badge variant={Math.abs(change.change) > 20 ? "destructive" : "secondary"}>
                              {change.change > 0 ? '+' : ''}{change.change.toFixed(1)}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">No reports found for {selectedPatient}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <EnhancedTrendChart patientName={selectedPatient} />
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison" className="space-y-6">
            {latestReport && previousReport ? (
              <ComparisonView 
                latestReport={latestReport} 
                previousReport={previousReport} 
              />
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">
                    Need at least 2 reports to show comparison. Upload more reports to compare changes.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Suggestions Tab */}
          <TabsContent value="suggestions" className="space-y-6">
            {latestReport ? (
              <SuggestionsPanel 
                criticalChanges={criticalChanges}
                latestReport={latestReport}
              />
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">Upload a report to get personalized health insights.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <FileUpload onUpload={handleFileUpload} />
            
            {/* Manual Data Entry */}
            <ManualDataEntry onReportCreated={async (report) => {
              console.log('📝 Manual report created:', report);
              // Convert to ExtractedReport format and save to patient data
              const extractedReport = {
                id: report.id,
                date: report.date,
                reportDate: report.date,
                uploadDate: new Date().toISOString().split('T')[0],
                type: report.type,
                fileName: 'manual-entry',
                patientName: report.patientName,
                parameters: report.parameters
              };
              
              await PatientDataService.addReport(selectedPatient, extractedReport);
              const updatedData = await PatientDataService.loadPatientData(selectedPatient);
              setPatientData(updatedData);
              setSelectedPatient(report.patientName);
            }} />
            
            <Card>
              <CardHeader>
                <CardTitle>Supported Formats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium mb-2">Blood Report Types:</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Complete Blood Count (CBC)</li>
                      <li>• Lipid Panel</li>
                      <li>• Metabolic Panel</li>
                      <li>• Thyroid Function Tests</li>
                      <li>• Liver Function Tests</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">File Formats:</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• PDF reports from labs</li>
                      <li>• JPEG/PNG images of reports</li>
                      <li>• Multiple files in batch</li>
                      <li>• Maximum 10MB per file</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* OCR Test Tab */}
          <TabsContent value="ocr-test" className="space-y-6">
            <OCRTester />
          </TabsContent>

          {/* OCR Debug Tab */}
          <TabsContent value="ocr-debug" className="space-y-6">
            <OCRDebugger />
          </TabsContent>

          {/* Data Tab */}
          <TabsContent value="data" className="space-y-6">
            <PatientDataViewer 
              patientId={selectedPatient}
              onDataUpdate={(updatedData) => {
                setPatientData(updatedData);
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};