import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Upload, TrendingUp, Users, FileText, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Import components
import { FileUpload } from "@/components/FileUpload";
import { PatientSelector } from "@/components/PatientSelector";
import { TrendChart } from "@/components/TrendChart";
import { ComparisonView } from "@/components/ComparisonView";
import { BloodReportExtractor } from "@/services/BloodReportExtractor";
import { SuggestionsPanel } from "@/components/SuggestionsPanel";
import { ParameterCard } from "@/components/ParameterCard";

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
      hemoglobin: { value: 13.2, unit: "g/dL", optimal: "12-15" },
      wbc: { value: 7200, unit: "/μL", optimal: "4500-11000" },
      platelets: { value: 250000, unit: "/μL", optimal: "150000-450000" },
      glucose: { value: 92, unit: "mg/dL", optimal: "70-100" },
      cholesterol: { value: 185, unit: "mg/dL", optimal: "<200" }
    }
  },
  {
    id: 2,
    date: "2023-10-10",
    type: "Complete Blood Count",
    uploadDate: "2023-10-15",
    patientName: "John Smith",
    parameters: {
      hemoglobin: { value: 12.8, unit: "g/dL", optimal: "12-15" },
      wbc: { value: 6800, unit: "/μL", optimal: "4500-11000" },
      platelets: { value: 240000, unit: "/μL", optimal: "150000-450000" },
      glucose: { value: 88, unit: "mg/dL", optimal: "70-100" },
      cholesterol: { value: 195, unit: "mg/dL", optimal: "<200" }
    }
  },
  {
    id: 3,
    date: "2024-02-20",
    type: "Lipid Panel",
    uploadDate: "2024-02-25",
    patientName: "Sarah Johnson",
    parameters: {
      cholesterol: { value: 220, unit: "mg/dL", optimal: "<200" },
      triglycerides: { value: 165, unit: "mg/dL", optimal: "<150" },
      hdl: { value: 45, unit: "mg/dL", optimal: ">40" },
      ldl: { value: 140, unit: "mg/dL", optimal: "<100" }
    }
  }
];

export const BloodReportDashboard = () => {
  const [reports, setReports] = useState<BloodReport[]>(mockReports);
  const [selectedPatient, setSelectedPatient] = useState<string>("John Smith");
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  const patientReports = reports.filter(report => report.patientName === selectedPatient);
  const latestReport = patientReports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  const previousReport = patientReports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[1];

  const handleFileUpload = async (files: File[]) => {
    console.log('🚨 DASHBOARD handleFileUpload CALLED! Files:', files);
    alert('handleFileUpload called with ' + files.length + ' files'); // Temporary alert to verify
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

      // Process files using BloodReportExtractor
      console.log('=== Starting BloodReportExtractor.processFiles');
      const extractedReports = await BloodReportExtractor.processFiles(files);
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

      // Convert extracted reports to BloodReport format and add to state
      const newReports: BloodReport[] = extractedReports.map(extracted => ({
        id: extracted.id,
        date: extracted.date,
        type: extracted.type,
        uploadDate: new Date().toISOString().split('T')[0],
        fileName: extracted.fileName,
        patientName: extracted.patientName,
        parameters: extracted.parameters
      }));

      console.log('=== New reports to add:', newReports);

      // Add new reports to existing reports
      setReports(prevReports => {
        console.log('=== Previous reports:', prevReports);
        const updatedReports = [...prevReports, ...newReports];
        console.log('=== Updated reports:', updatedReports);
        return updatedReports;
      });

      // If this is a new patient, switch to them
      const newPatients = [...new Set(newReports.map(r => r.patientName))];
      if (newPatients.length > 0) {
        console.log('=== New patients found:', newPatients);
        setSelectedPatient(newPatients[0]);
      }

      // Switch to overview tab to show results
      setActiveTab("overview");

      // Success toast
      toast({
        title: "Upload successful!",
        description: `Successfully processed ${extractedReports.length} out of ${files.length} files. ${newPatients.join(', ')} added to your records.`,
      });

      console.log('=== Upload process completed successfully');

    } catch (error) {
      console.error('=== Error processing files:', error);
      toast({
        title: "Processing failed",
        description: "An error occurred while processing your files. Please try again or check the file format.",
        variant: "destructive"
      });
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
            <Badge variant="secondary" className="px-3 py-1">
              {reports.length} Reports
            </Badge>
          </div>
        </div>

        {/* Patient Selector */}
        <PatientSelector
          reports={reports}
          selectedPatient={selectedPatient}
          onPatientChange={setSelectedPatient}
        />

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
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
                      {latestReport.type} • Uploaded {latestReport.uploadDate}
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
                            status={status}
                            trend={trend}
                            previousValue={previousParam?.value}
                          />
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

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
            {patientReports.length > 1 ? (
              <TrendChart reports={patientReports} />
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">
                    Need at least 2 reports to show trends. Upload more reports to see parameter changes over time.
                  </p>
                </CardContent>
              </Card>
            )}
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
        </Tabs>
      </div>
    </div>
  );
};