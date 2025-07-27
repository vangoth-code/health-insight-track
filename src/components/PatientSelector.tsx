import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { User, Users } from "lucide-react";

interface BloodReport {
  id: number | string;
  date: string;
  type: string;
  uploadDate?: string;
  fileName?: string;
  patientName: string;
  parameters: Record<string, { value: number; unit: string; optimal: string }>;
}

interface PatientSelectorProps {
  reports: BloodReport[];
  selectedPatient: string | null;
  onPatientChange: (patientName: string) => void;
}

export const PatientSelector = ({ reports, selectedPatient, onPatientChange }: PatientSelectorProps) => {
  console.log('PatientSelector rendering with:', { reports, selectedPatient });
  
  // Get unique patients and their report counts
  const patientStats = reports.reduce((acc, report) => {
    const patientName = report.patientName;
    if (!acc[patientName]) {
      acc[patientName] = {
        name: patientName,
        reportCount: 0,
        latestDate: report.date
      };
    }
    acc[patientName].reportCount++;
    
    // Update latest date if this report is more recent
    if (new Date(report.date) > new Date(acc[patientName].latestDate)) {
      acc[patientName].latestDate = report.date;
    }
    
    return acc;
  }, {} as Record<string, { name: string; reportCount: number; latestDate: string }>);

  const patients = Object.values(patientStats).sort((a, b) => 
    new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime()
  );

  const selectedPatientData = selectedPatient ? patientStats[selectedPatient] : null;

  if (patients.length === 0) {
    return null;
  }

  if (patients.length === 1) {
    // Single patient - show info card instead of selector
    const patient = patients[0];
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <User size={18} />
            Patient Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{patient.name}</p>
              <p className="text-sm text-muted-foreground">
                {patient.reportCount} report{patient.reportCount !== 1 ? 's' : ''} • Latest: {new Date(patient.latestDate).toLocaleDateString()}
              </p>
            </div>
            <Badge variant="secondary">{patient.reportCount} Reports</Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Users size={18} />
          Select Patient
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Select 
              value={selectedPatient || ""} 
              onValueChange={onPatientChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a patient to view their health data" />
              </SelectTrigger>
              <SelectContent>
                {patients.map(patient => (
                  <SelectItem key={patient.name} value={patient.name}>
                    <div className="flex items-center justify-between w-full">
                      <span>{patient.name}</span>
                      <Badge variant="outline" className="ml-2">
                        {patient.reportCount} reports
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedPatientData && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{selectedPatientData.name}</p>
                <p className="text-sm text-muted-foreground">
                  Latest report: {new Date(selectedPatientData.latestDate).toLocaleDateString()}
                </p>
              </div>
              <Badge variant="secondary">
                {selectedPatientData.reportCount} Report{selectedPatientData.reportCount !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
        )}

        {!selectedPatient && patients.length > 1 && (
          <div className="text-sm text-muted-foreground">
            <p>⚠️ Multiple patients detected. Please select a patient to view their health trends and analysis.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};