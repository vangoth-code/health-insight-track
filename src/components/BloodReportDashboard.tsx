import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, TrendingUp, TrendingDown, AlertTriangle, Activity, FileText, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "./FileUpload";
import { ParameterCard } from "./ParameterCard";
import { TrendChart } from "./TrendChart";
import { ComparisonView } from "./ComparisonView";
import { SuggestionsPanel } from "./SuggestionsPanel";
import { PatientSelector } from "./PatientSelector";
import { BloodReportExtractor, ExtractedReport } from "@/services/BloodReportExtractor";

interface BloodParameter {
  value: number;
  unit: string;
  optimal: string;
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

// Mock data for demonstration - dates represent actual test/report dates, not upload dates
const mockReports: BloodReport[] = [
  {
    id: 1,
    date: "2024-01-15", // Actual test date from the blood report
    type: "Complete Blood Count",
    uploadDate: "2024-01-20", // When the report was uploaded (separate field)
    patientName: "John Smith",
    parameters: {
      hemoglobin: { value: 13.2, unit: "g/dL", optimal: "12-15" },
      wbc: { value: 7200, unit: "/μL", optimal: "4500-11000" },
      platelets: { value: 250000, unit: "/μL", optimal: "150000-450000" },
      glucose: { value: 95, unit: "mg/dL", optimal: "70-100" },
      cholesterol: { value: 185, unit: "mg/dL", optimal: "<200" },
      triglycerides: { value: 120, unit: "mg/dL", optimal: "<150" }
    }
  },
  {
    id: 2,
    date: "2024-01-01", // Actual test date from the blood report
    type: "Complete Blood Count", 
    uploadDate: "2024-01-05", // When the report was uploaded (separate field)
    patientName: "John Smith",
    parameters: {
      hemoglobin: { value: 12.8, unit: "g/dL", optimal: "12-15" },
      wbc: { value: 6800, unit: "/μL", optimal: "4500-11000" },
      platelets: { value: 240000, unit: "/μL", optimal: "150000-450000" },
      glucose: { value: 105, unit: "mg/dL", optimal: "70-100" },
      cholesterol: { value: 195, unit: "mg/dL", optimal: "<200" },
      triglycerides: { value: 140, unit: "mg/dL", optimal: "<150" }
    }
  }
];

export const BloodReportDashboard = () => {
  const [reports, setReports] = useState<BloodReport[]>(mockReports);
  const [showUpload, setShowUpload] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string | null>("John Smith"); // Default to first patient
  const { toast } = useToast();
  
  // Filter reports by selected patient
  const patientReports = selectedPatient 
    ? reports.filter(report => report.patientName === selectedPatient)
    : [];
    
  const latestReport = patientReports[0];
  const previousReport = patientReports[1];

  const getParameterStatus = (value: number, optimal: string) => {
    // Simple logic for demonstration
    if (optimal.includes("<")) {
      const limit = parseFloat(optimal.replace("<", ""));
      return value < limit ? "normal" : "high";
    }
    if (optimal.includes("-")) {
      const [min, max] = optimal.split("-").map(n => parseFloat(n));
      if (value < min) return "low";
      if (value > max) return "high";
      return "normal";
    }
    return "normal";
  };

  const getCriticalChanges = () => {
    if (!latestReport || !previousReport) return [];
    
    const changes = [];
    Object.entries(latestReport.parameters).forEach(([key, current]) => {
      const previous = previousReport.parameters[key as keyof typeof previousReport.parameters];
      if (previous) {
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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Blood Report Tracker</h1>
            <p className="text-muted-foreground">Monitor your health parameters and trends</p>
          </div>
          <Button onClick={() => setShowUpload(!showUpload)} className="gap-2">
            <Upload size={20} />
            Upload Report
          </Button>
        </div>

        {/* Upload Section */}
        {showUpload && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText size={20} />
                Upload Blood Reports
              </CardTitle>
              <CardDescription>
                Upload your blood reports as PDF or images. The system will automatically extract test dates and parameter values for tracking.
                <br />
                <span className="text-xs text-muted-foreground mt-1 block">
                  ✓ PDF text extraction ✓ Parameter recognition ✓ Date detection ✓ Batch processing
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload onUpload={async (files) => {
                console.log("Uploaded files:", files);
                setIsProcessing(true);
                
                try {
                  // Extract data from uploaded files
                  const extractedReports = await BloodReportExtractor.processFiles(files);
                  
                  if (extractedReports.length > 0) {
                    // Convert extracted reports to match our BloodReport interface
                    const newReports: BloodReport[] = extractedReports.map(report => ({
                      ...report,
                      id: report.id,
                      uploadDate: new Date().toISOString().split('T')[0]
                    }));
                    
                    // Add new reports to existing ones and sort by date
                    setReports(prevReports => {
                      const allReports = [...prevReports, ...newReports];
                      return allReports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    });
                    
                    // If this is the first patient or patient from new reports doesn't match selected
                    const newPatients = [...new Set(newReports.map(r => r.patientName))];
                    if (newPatients.length > 0 && (!selectedPatient || !newPatients.includes(selectedPatient))) {
                      setSelectedPatient(newPatients[0]); // Auto-select the first new patient
                    }
                    
                    toast({
                      title: "Reports processed successfully",
                      description: `${extractedReports.length} blood report(s) extracted and added to your health records.`,
                    });
                  } else {
                    toast({
                      title: "No data extracted",
                      description: "Unable to extract blood test parameters from the uploaded files. Please ensure the files contain readable blood test results.",
                      variant: "destructive"
                    });
                  }
                } catch (error) {
                  console.error("Error processing files:", error);
                  toast({
                    title: "Processing failed",
                    description: "An error occurred while processing your files. Please try again.",
                    variant: "destructive"
                  });
                } finally {
                  setIsProcessing(false);
                }
                
                setShowUpload(false);
              }} />
              
              {isProcessing && (
                <div className="mt-4 p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-primary font-medium">
                    Processing uploaded files and extracting blood test parameters...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Patient Selection */}
        <PatientSelector 
          reports={reports}
          selectedPatient={selectedPatient}
          onPatientChange={setSelectedPatient}
        />

        {/* Show message if no patient selected */}
        {!selectedPatient && reports.length > 0 && (
          <Card className="border-muted">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                Please select a patient above to view their health data and trends.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Show message if no data for selected patient */}
        {selectedPatient && patientReports.length === 0 && (
          <Card className="border-muted">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                No reports found for {selectedPatient}. Upload blood reports to start tracking.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Main Content - Only show if we have patient data */}
        {selectedPatient && latestReport && (
        <>
        {/* Critical Alerts */}
        {criticalChanges.length > 0 && (
          <Card className="border-warning">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <AlertTriangle size={20} />
                Attention Required - {selectedPatient}
              </CardTitle>
              <CardDescription>
                Significant changes detected in {selectedPatient}'s latest report
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {criticalChanges.slice(0, 3).map((change) => (
                  <div key={change.parameter} className="flex items-center justify-between p-3 bg-warning/10 rounded-lg">
                    <div>
                      <p className="font-medium capitalize">{change.parameter.replace(/([A-Z])/g, ' $1')}</p>
                      <p className="text-sm text-muted-foreground">
                        {change.previous} → {change.current} {change.unit}
                      </p>
                    </div>
                    <Badge variant={change.change > 0 ? "destructive" : "secondary"}>
                      {change.change > 0 ? "+" : ""}{change.change.toFixed(1)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
            <TabsTrigger value="suggestions">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Latest Report Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity size={20} />
                  Latest Report - {latestReport.date} ({selectedPatient})
                </CardTitle>
                <CardDescription>{latestReport.type}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(latestReport.parameters).map(([key, param]) => (
                    <ParameterCard
                      key={key}
                      name={key}
                      value={param.value}
                      unit={param.unit}
                      optimal={param.optimal}
                      status={getParameterStatus(param.value, param.optimal)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp size={20} />
                  Parameter Trends - {selectedPatient}
                </CardTitle>
                <CardDescription>
                  Track how {selectedPatient}'s health parameters change over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TrendChart reports={patientReports} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-6">
            <ComparisonView 
              latestReport={latestReport} 
              previousReport={previousReport} 
            />
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-6">
            <SuggestionsPanel 
              criticalChanges={criticalChanges}
              latestReport={latestReport}
            />
          </TabsContent>
        </Tabs>
        </>
        )}
      </div>
    </div>
  );
};