import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface BloodParameter {
  value: number;
  unit: string;
  optimal: string;
}

interface ManualReport {
  patientName: string;
  date: string;
  reportType: string;
  parameters: Record<string, BloodParameter>;
}

interface ManualDataEntryProps {
  onReportCreated: (report: any) => void;
}

const commonParameters = [
  { key: 'hemoglobin', label: 'Hemoglobin', unit: 'g/dL', optimal: '12.0-15.5' },
  { key: 'glucose', label: 'Glucose', unit: 'mg/dL', optimal: '70-100' },
  { key: 'wbc', label: 'White Blood Cells', unit: '/μL', optimal: '4500-11000' },
  { key: 'platelets', label: 'Platelets', unit: '/μL', optimal: '150000-450000' },
  { key: 'cholesterol', label: 'Total Cholesterol', unit: 'mg/dL', optimal: '<200' },
  { key: 'triglycerides', label: 'Triglycerides', unit: 'mg/dL', optimal: '<150' },
  { key: 'hdl', label: 'HDL Cholesterol', unit: 'mg/dL', optimal: '>40' },
  { key: 'ldl', label: 'LDL Cholesterol', unit: 'mg/dL', optimal: '<100' },
  { key: 'creatinine', label: 'Creatinine', unit: 'mg/dL', optimal: '0.6-1.2' },
  { key: 'bun', label: 'Blood Urea Nitrogen', unit: 'mg/dL', optimal: '6-20' }
];

export const ManualDataEntry: React.FC<ManualDataEntryProps> = ({ onReportCreated }) => {
  const [patientName, setPatientName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportType, setReportType] = useState('Blood Test');
  const [parameters, setParameters] = useState<Record<string, string>>({});

  const handleParameterChange = (key: string, value: string) => {
    setParameters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubmit = () => {
    if (!patientName.trim()) {
      toast.error('Please enter patient name');
      return;
    }

    const filledParameters: Record<string, BloodParameter> = {};
    let hasParameters = false;

    commonParameters.forEach(param => {
      const value = parameters[param.key];
      if (value && value.trim() && !isNaN(Number(value))) {
        filledParameters[param.key] = {
          value: Number(value),
          unit: param.unit,
          optimal: param.optimal
        };
        hasParameters = true;
      }
    });

    if (!hasParameters) {
      toast.error('Please enter at least one blood parameter value');
      return;
    }

    const report = {
      id: Math.random().toString(36).substr(2, 9),
      date,
      type: reportType,
      fileName: 'Manual Entry',
      patientName: patientName.trim(),
      parameters: filledParameters
    };

    console.log('📝 Creating manual report:', report);
    onReportCreated(report);
    
    // Reset form
    setPatientName('');
    setDate(new Date().toISOString().split('T')[0]);
    setReportType('Blood Test');
    setParameters({});
    
    toast.success(`Blood report created for ${patientName}`);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Manual Blood Report Entry</CardTitle>
        <CardDescription>
          Enter blood test data manually while we work on improving the OCR functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="patient-name">Patient Name *</Label>
            <Input
              id="patient-name"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Enter patient name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-date">Report Date</Label>
            <Input
              id="report-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-type">Report Type</Label>
            <Input
              id="report-type"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              placeholder="Blood Test"
            />
          </div>
        </div>

        <Separator />

        {/* Blood Parameters */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Blood Parameters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {commonParameters.map(param => (
              <div key={param.key} className="space-y-2">
                <Label htmlFor={param.key}>
                  {param.label} ({param.unit})
                  <span className="text-sm text-muted-foreground ml-2">
                    Normal: {param.optimal}
                  </span>
                </Label>
                <Input
                  id={param.key}
                  type="number"
                  step="any"
                  value={parameters[param.key] || ''}
                  onChange={(e) => handleParameterChange(param.key, e.target.value)}
                  placeholder="Enter value"
                />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="flex justify-end">
          <Button onClick={handleSubmit} className="px-8">
            Create Blood Report
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};