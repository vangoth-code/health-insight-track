import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, TrendingUp, TrendingDown, AlertTriangle, Activity, FileText, Camera } from "lucide-react";
import { FileUpload } from "./FileUpload";
import { ParameterCard } from "./ParameterCard";
import { TrendChart } from "./TrendChart";
import { ComparisonView } from "./ComparisonView";
import { SuggestionsPanel } from "./SuggestionsPanel";

// Mock data for demonstration
const mockReports = [
  {
    id: 1,
    date: "2024-01-15",
    type: "Complete Blood Count",
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
    date: "2024-01-01",
    type: "Complete Blood Count",
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
  const [reports] = useState(mockReports);
  const [showUpload, setShowUpload] = useState(false);
  const latestReport = reports[0];
  const previousReport = reports[1];

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
    if (!previousReport) return [];
    
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
                Upload Blood Report
              </CardTitle>
              <CardDescription>
                Upload your blood report as PDF or image to track your health parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload onUpload={(file) => {
                console.log("Uploaded:", file);
                setShowUpload(false);
              }} />
            </CardContent>
          </Card>
        )}

        {/* Critical Alerts */}
        {criticalChanges.length > 0 && (
          <Card className="border-warning">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <AlertTriangle size={20} />
                Attention Required
              </CardTitle>
              <CardDescription>
                Significant changes detected in your latest report
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
                  Latest Report - {latestReport.date}
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
                  Parameter Trends
                </CardTitle>
                <CardDescription>
                  Track how your health parameters change over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TrendChart reports={reports} />
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
      </div>
    </div>
  );
};