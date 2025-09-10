import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";

interface ParameterCardProps {
  name: string;
  value: number;
  unit: string;
  optimal: string;
  status: "normal" | "high" | "low" | "critical";
  trend?: "up" | "down" | "stable";
  previousValue?: number;
  healthInsight?: string;
  recommendation?: string;
}

export const ParameterCard = ({ 
  name, 
  value, 
  unit, 
  optimal, 
  status, 
  trend, 
  previousValue,
  healthInsight,
  recommendation
}: ParameterCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal": return "bg-success/10 text-success border-success/20";
      case "high": return "bg-destructive/10 text-destructive border-destructive/20";
      case "low": return "bg-warning/10 text-warning border-warning/20";
      case "critical": return "bg-red-500/10 text-red-600 border-red-500/20";
      default: return "bg-muted/10 text-muted-foreground border-muted/20";
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "normal": return "secondary";
      case "high": return "destructive";
      case "low": return "default";
      case "critical": return "destructive";
      default: return "secondary";
    }
  };

  const formatParameterName = (name: string) => {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend) {
      case "up": return <TrendingUp size={16} className="text-red-500" />;
      case "down": return <TrendingDown size={16} className="text-blue-500" />;
      case "stable": return <Minus size={16} className="text-muted-foreground" />;
      default: return null;
    }
  };

  const getChangePercentage = () => {
    if (!previousValue || previousValue === 0) return null;
    const change = ((value - previousValue) / previousValue) * 100;
    return change;
  };

  const changePercentage = getChangePercentage();

  return (
    <Card className={`relative ${status !== "normal" ? "ring-1 " + getStatusColor(status).split(" ")[2] : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {formatParameterName(name)}
          </CardTitle>
          {status !== "normal" && (
            <AlertTriangle size={16} className="text-warning" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold">{value}</span>
          <span className="text-sm text-muted-foreground">{unit}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Optimal: {optimal}
          </div>
          <Badge variant={getStatusVariant(status)} className="text-xs">
            {status.toUpperCase()}
          </Badge>
        </div>

        {trend && previousValue && (
          <div className="flex items-center gap-2 pt-2 border-t">
            {getTrendIcon()}
            <span className="text-xs text-muted-foreground">
              {previousValue} {unit}
            </span>
            {changePercentage && (
              <span className={`text-xs font-medium ${
                changePercentage > 0 ? "text-red-500" : "text-green-500"
              }`}>
                {changePercentage > 0 ? "+" : ""}{changePercentage.toFixed(1)}%
              </span>
            )}
          </div>
        )}

        {status !== "normal" && healthInsight && (
          <div className="pt-2 border-t space-y-2">
            <div className="text-xs">
              <span className="font-medium text-destructive">Health Insight:</span>
              <p className="text-muted-foreground mt-1">{healthInsight}</p>
            </div>
            {recommendation && (
              <div className="text-xs">
                <span className="font-medium text-blue-600">Recommendation:</span>
                <p className="text-muted-foreground mt-1">{recommendation}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};