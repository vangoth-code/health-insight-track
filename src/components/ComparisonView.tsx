import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Calendar } from "lucide-react";

interface Report {
  id: number | string;
  date: string;
  type: string;
  patientName?: string;
  parameters: Record<string, { value: number; unit: string; optimal: string }>;
}

interface ComparisonViewProps {
  latestReport: Report;
  previousReport: Report;
}

export const ComparisonView = ({ latestReport, previousReport }: ComparisonViewProps) => {
  const formatParameterName = (name: string) => {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const getChange = (current: number, previous: number) => {
    return ((current - previous) / previous) * 100;
  };

  const getTrendIcon = (change: number) => {
    if (change > 2) return <TrendingUp size={16} className="text-red-500" />;
    if (change < -2) return <TrendingDown size={16} className="text-green-500" />;
    return <Minus size={16} className="text-muted-foreground" />;
  };

  const getChangeColor = (change: number) => {
    if (Math.abs(change) < 2) return "text-muted-foreground";
    return change > 0 ? "text-red-500" : "text-green-500";
  };

  const getSignificanceLevel = (change: number) => {
    const absChange = Math.abs(change);
    if (absChange < 5) return { level: "Minimal", variant: "secondary" as const };
    if (absChange < 15) return { level: "Moderate", variant: "default" as const };
    return { level: "Significant", variant: "destructive" as const };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar size={18} />
              Latest Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{latestReport.date}</p>
              <p className="text-muted-foreground">{latestReport.type}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar size={18} />
              Previous Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{previousReport.date}</p>
              <p className="text-muted-foreground">{previousReport.type}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Parameter Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(latestReport.parameters).map(([key, current]) => {
              const previous = previousReport.parameters[key];
              if (!previous) return null;

              const change = getChange(current.value, previous.value);
              const significance = getSignificanceLevel(change);

              return (
                <div key={key} className="grid grid-cols-1 md:grid-cols-7 gap-4 p-4 border rounded-lg">
                  {/* Parameter Name */}
                  <div className="md:col-span-2">
                    <h4 className="font-medium">{formatParameterName(key)}</h4>
                    <p className="text-xs text-muted-foreground">
                      Optimal: {current.optimal}
                    </p>
                  </div>

                  {/* Previous Value */}
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Previous</p>
                    <p className="font-semibold">
                      {previous.value} <span className="text-xs">{previous.unit}</span>
                    </p>
                  </div>

                  {/* Trend Icon */}
                  <div className="flex justify-center items-center">
                    {getTrendIcon(change)}
                  </div>

                  {/* Current Value */}
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Current</p>
                    <p className="font-semibold">
                      {current.value} <span className="text-xs">{current.unit}</span>
                    </p>
                  </div>

                  {/* Change Percentage */}
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Change</p>
                    <p className={`font-semibold ${getChangeColor(change)}`}>
                      {change > 0 ? "+" : ""}{change.toFixed(1)}%
                    </p>
                  </div>

                  {/* Significance */}
                  <div className="flex justify-center">
                    <Badge variant={significance.variant} className="text-xs">
                      {significance.level}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-2">
              <p className="text-2xl font-bold text-green-500">
                {Object.values(latestReport.parameters).filter((param, idx) => {
                  const key = Object.keys(latestReport.parameters)[idx];
                  const prev = previousReport.parameters[key];
                  return prev && Math.abs(getChange(param.value, prev.value)) < 5;
                }).length}
              </p>
              <p className="text-sm text-muted-foreground">Parameters Stable</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-2">
              <p className="text-2xl font-bold text-orange-500">
                {Object.values(latestReport.parameters).filter((param, idx) => {
                  const key = Object.keys(latestReport.parameters)[idx];
                  const prev = previousReport.parameters[key];
                  return prev && Math.abs(getChange(param.value, prev.value)) >= 5 && Math.abs(getChange(param.value, prev.value)) < 15;
                }).length}
              </p>
              <p className="text-sm text-muted-foreground">Moderate Changes</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-2">
              <p className="text-2xl font-bold text-red-500">
                {Object.values(latestReport.parameters).filter((param, idx) => {
                  const key = Object.keys(latestReport.parameters)[idx];
                  const prev = previousReport.parameters[key];
                  return prev && Math.abs(getChange(param.value, prev.value)) >= 15;
                }).length}
              </p>
              <p className="text-sm text-muted-foreground">Significant Changes</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};