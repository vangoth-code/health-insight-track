import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, TrendingUp, TrendingDown, AlertTriangle, Activity, FileText, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

// Mock data for demonstration
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
      glucose: { value: 95, unit: "mg/dL", optimal: "70-100" },
      cholesterol: { value: 185, unit: "mg/dL", optimal: "<200" },
      triglycerides: { value: 120, unit: "mg/dL", optimal: "<150" }
    }
  }
];

export const BloodReportDashboard = () => {
  console.log('BloodReportDashboard component starting to render...');
  
  const [reports] = useState<BloodReport[]>(mockReports);
  const [selectedPatient] = useState<string>("John Smith");
  const { toast } = useToast();
  
  console.log('State initialized, reports:', reports);
  console.log('Selected patient:', selectedPatient);

  const patientReports = reports.filter(report => report.patientName === selectedPatient);
  const latestReport = patientReports[0];
  
  console.log('Patient reports:', patientReports);
  console.log('Latest report:', latestReport);

  try {
    console.log('About to render component...');
    
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Blood Report Tracker</h1>
              <p className="text-muted-foreground">Monitor health parameters and trends</p>
            </div>
            <Button className="gap-2">
              <Upload size={20} />
              Upload Report
            </Button>
          </div>

          {/* Patient Info */}
          <Card>
            <CardHeader>
              <CardTitle>Current Patient: {selectedPatient}</CardTitle>
              <CardDescription>
                {patientReports.length} report(s) available
              </CardDescription>
            </CardHeader>
            <CardContent>
              {latestReport ? (
                <div>
                  <p>Latest Report: {latestReport.date}</p>
                  <p>Type: {latestReport.type}</p>
                  <p>Parameters: {Object.keys(latestReport.parameters).length}</p>
                </div>
              ) : (
                <p>No reports found for this patient</p>
              )}
            </CardContent>
          </Card>

          {/* Simple parameter display */}
          {latestReport && (
            <Card>
              <CardHeader>
                <CardTitle>Latest Parameters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(latestReport.parameters).map(([key, param]) => (
                    <div key={key} className="p-4 border rounded-lg">
                      <h4 className="font-medium capitalize">{key}</h4>
                      <p className="text-2xl font-bold">{param.value} {param.unit}</p>
                      <p className="text-sm text-muted-foreground">Optimal: {param.optimal}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering component:', error);
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <h1 className="text-xl font-bold text-red-500">Error</h1>
            <p>Component failed to render. Check console for details.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
};