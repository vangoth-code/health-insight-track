import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useState } from "react";

interface Report {
  id: number;
  date: string;
  type: string;
  parameters: Record<string, { value: number; unit: string; optimal: string }>;
}

interface TrendChartProps {
  reports: Report[];
}

export const TrendChart = ({ reports }: TrendChartProps) => {
  const [selectedParameter, setSelectedParameter] = useState("hemoglobin");

  // Get all available parameters
  const availableParameters = reports.length > 0 
    ? Object.keys(reports[0].parameters)
    : [];

  // Transform data for the chart
  const chartData = reports
    .map(report => ({
      date: report.date,
      value: report.parameters[selectedParameter]?.value || 0,
      unit: report.parameters[selectedParameter]?.unit || ""
    }))
    .reverse(); // Reverse to show chronological order

  const formatParameterName = (name: string) => {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const getOptimalRange = () => {
    if (reports.length === 0 || !reports[0].parameters[selectedParameter]) return null;
    
    const optimal = reports[0].parameters[selectedParameter].optimal;
    if (optimal.includes("-")) {
      const [min, max] = optimal.split("-").map(n => parseFloat(n));
      return { min, max };
    }
    return null;
  };

  const optimalRange = getOptimalRange();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-md">
          <p className="font-medium">{label}</p>
          <p className="text-primary">
            {formatParameterName(selectedParameter)}: {data.value} {data.payload.unit}
          </p>
          {optimalRange && (
            <p className="text-xs text-muted-foreground">
              Optimal: {optimalRange.min}-{optimalRange.max} {data.payload.unit}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Parameter Trends</h3>
          <p className="text-sm text-muted-foreground">
            Track changes in your health parameters over time
          </p>
        </div>
        <Select value={selectedParameter} onValueChange={setSelectedParameter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableParameters.map(param => (
              <SelectItem key={param} value={param}>
                {formatParameterName(param)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {formatParameterName(selectedParameter)} Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-muted-foreground"
                  fontSize={12}
                />
                <YAxis 
                  className="text-muted-foreground"
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {/* Optimal range background */}
                {optimalRange && (
                  <>
                    <defs>
                      <pattern id="optimalRange" patternUnits="userSpaceOnUse" width="4" height="4">
                        <rect width="4" height="4" fill="hsl(var(--success))" fillOpacity="0.1"/>
                      </pattern>
                    </defs>
                  </>
                )}
                
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {optimalRange && (
            <div className="mt-4 p-3 bg-success/10 rounded-lg">
              <p className="text-sm text-success font-medium">
                Optimal Range: {optimalRange.min} - {optimalRange.max} {chartData[0]?.unit}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};