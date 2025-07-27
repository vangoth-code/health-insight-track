
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

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
      platelets: { value: 250000, unit: "/μL", optimal: "150000-450000" }
    }
  }
];

export const BloodReportDashboard = () => {
  console.log('=== BloodReportDashboard: Starting render ===');
  
  try {
    const [reports] = useState<BloodReport[]>(mockReports);
    const [selectedPatient] = useState<string>("John Smith");
    
    console.log('=== BloodReportDashboard: State initialized ===');
    console.log('Reports:', reports);
    console.log('Selected patient:', selectedPatient);

    const patientReports = reports.filter(report => report.patientName === selectedPatient);
    const latestReport = patientReports[0];
    
    console.log('=== BloodReportDashboard: Data processed ===');
    console.log('Patient reports:', patientReports);
    console.log('Latest report:', latestReport);

    console.log('=== BloodReportDashboard: About to return JSX ===');
    
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
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

          <Card>
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>Component loaded successfully!</p>
                <p>Reports count: {reports.length}</p>
                <p>Selected patient: {selectedPatient}</p>
                <p>Patient reports: {patientReports.length}</p>
                <p>Latest report available: {latestReport ? 'Yes' : 'No'}</p>
              </div>
            </CardContent>
          </Card>

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
    console.error('=== BloodReportDashboard: Error caught ===', error);
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Component failed to render:</p>
            <pre className="mt-2 text-sm bg-muted p-2 rounded">
              {error instanceof Error ? error.message : 'Unknown error'}
            </pre>
          </CardContent>
        </Card>
      </div>
    );
  }
};
