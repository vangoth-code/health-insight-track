import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Brain, 
  Heart, 
  Activity, 
  Apple, 
  Dumbbell, 
  Moon, 
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Target
} from "lucide-react";

interface CriticalChange {
  parameter: string;
  change: number;
  status: string;
  current: number;
  previous: number;
  unit: string;
}

interface Report {
  id: number | string;
  date: string;
  type: string;
  parameters: Record<string, { value: number; unit: string; optimal: string }>;
}

interface SuggestionsPanelProps {
  criticalChanges: CriticalChange[];
  latestReport: Report;
}

export const SuggestionsPanel = ({ criticalChanges, latestReport }: SuggestionsPanelProps) => {
  const formatParameterName = (name: string) => {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const getParameterSuggestions = (parameter: string, status: string, change: number) => {
    const suggestions = {
      hemoglobin: {
        low: {
          icon: <Heart className="w-5 h-5 text-red-500" />,
          title: "Iron-Rich Diet Needed",
          suggestions: [
            "Include iron-rich foods: spinach, red meat, lentils",
            "Take vitamin C with iron-rich meals for better absorption",
            "Consider iron supplements (consult your doctor first)",
            "Avoid tea/coffee with meals as they reduce iron absorption"
          ]
        },
        high: {
          icon: <AlertTriangle className="w-5 h-5 text-orange-500" />,
          title: "Monitor Iron Intake",
          suggestions: [
            "Reduce iron supplement intake if taking any",
            "Stay hydrated and donate blood if eligible",
            "Check for underlying conditions with your doctor",
            "Monitor for symptoms like fatigue or joint pain"
          ]
        }
      },
      glucose: {
        high: {
          icon: <Apple className="w-5 h-5 text-red-500" />,
          title: "Blood Sugar Management",
          suggestions: [
            "Reduce refined carbs and sugary foods",
            "Increase fiber intake with whole grains and vegetables",
            "Regular physical activity (30 mins daily)",
            "Consider smaller, more frequent meals",
            "Check HbA1c levels and consult an endocrinologist"
          ]
        },
        low: {
          icon: <Activity className="w-5 h-5 text-blue-500" />,
          title: "Blood Sugar Support",
          suggestions: [
            "Eat regular, balanced meals",
            "Include complex carbohydrates in your diet",
            "Avoid skipping meals",
            "Monitor for hypoglycemic symptoms"
          ]
        }
      },
      cholesterol: {
        high: {
          icon: <Heart className="w-5 h-5 text-red-500" />,
          title: "Cardiovascular Health",
          suggestions: [
            "Adopt a heart-healthy diet (Mediterranean style)",
            "Increase omega-3 fatty acids (fish, walnuts, flax seeds)",
            "Regular cardio exercise (150 mins/week)",
            "Consider statins if recommended by doctor",
            "Limit saturated and trans fats"
          ]
        }
      },
      triglycerides: {
        high: {
          icon: <Dumbbell className="w-5 h-5 text-orange-500" />,
          title: "Metabolic Health",
          suggestions: [
            "Reduce simple carbohydrates and alcohol",
            "Increase physical activity and strength training",
            "Focus on healthy fats (avocado, olive oil, nuts)",
            "Maintain a healthy weight",
            "Consider fish oil supplements"
          ]
        }
      },
      wbc: {
        high: {
          icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
          title: "Immune System Alert",
          suggestions: [
            "Check for infections or inflammatory conditions",
            "Ensure adequate rest and stress management",
            "Follow up with your doctor for further evaluation",
            "Monitor for fever, fatigue, or other symptoms"
          ]
        },
        low: {
          icon: <Moon className="w-5 h-5 text-blue-500" />,
          title: "Immune Support",
          suggestions: [
            "Prioritize sleep (7-9 hours nightly)",
            "Eat immune-boosting foods (citrus, garlic, ginger)",
            "Manage stress through meditation or yoga",
            "Avoid exposure to infections when possible"
          ]
        }
      }
    };

    const paramKey = parameter.toLowerCase() as keyof typeof suggestions;
    const statusKey = status as 'high' | 'low';
    
    return suggestions[paramKey]?.[statusKey] || {
      icon: <Target className="w-5 h-5 text-muted-foreground" />,
      title: "General Health Monitoring",
      suggestions: [
        "Continue monitoring this parameter",
        "Maintain a healthy lifestyle",
        "Consult your healthcare provider for specific guidance"
      ]
    };
  };

  const getOverallHealthScore = () => {
    const totalParams = Object.keys(latestReport.parameters).length;
    const normalParams = Object.entries(latestReport.parameters).filter(([_, param]) => {
      if (param.optimal.includes("<")) {
        const limit = parseFloat(param.optimal.replace("<", ""));
        return param.value < limit;
      }
      if (param.optimal.includes("-")) {
        const [min, max] = param.optimal.split("-").map(n => parseFloat(n));
        return param.value >= min && param.value <= max;
      }
      return true;
    }).length;

    return Math.round((normalParams / totalParams) * 100);
  };

  const healthScore = getOverallHealthScore();

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-orange-500";
    return "text-red-500";
  };

  const priorityChanges = criticalChanges.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Health Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Overall Health Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className={`text-6xl font-bold ${getScoreColor(healthScore)}`}>
              {healthScore}%
            </div>
            <div className="space-y-2">
              <p className="text-muted-foreground">
                {healthScore >= 80 && "Excellent! Most parameters are within optimal range."}
                {healthScore >= 60 && healthScore < 80 && "Good, but some parameters need attention."}
                {healthScore < 60 && "Several parameters require immediate attention."}
              </p>
              <div className="flex justify-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {Object.entries(latestReport.parameters).filter(([_, param]) => {
                    if (param.optimal.includes("<")) {
                      const limit = parseFloat(param.optimal.replace("<", ""));
                      return param.value < limit;
                    }
                    if (param.optimal.includes("-")) {
                      const [min, max] = param.optimal.split("-").map(n => parseFloat(n));
                      return param.value >= min && param.value <= max;
                    }
                    return true;
                  }).length} Normal
                </span>
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  {Object.keys(latestReport.parameters).length - Object.entries(latestReport.parameters).filter(([_, param]) => {
                    if (param.optimal.includes("<")) {
                      const limit = parseFloat(param.optimal.replace("<", ""));
                      return param.value < limit;
                    }
                    if (param.optimal.includes("-")) {
                      const [min, max] = param.optimal.split("-").map(n => parseFloat(n));
                      return param.value >= min && param.value <= max;
                    }
                    return true;
                  }).length} Need Attention
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Priority Actions */}
      {priorityChanges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Priority Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {priorityChanges.map((change, index) => {
              const suggestion = getParameterSuggestions(change.parameter, change.status, change.change);
              
              return (
                <Alert key={change.parameter} className="border-l-4 border-l-orange-500">
                  <div className="flex items-start gap-3">
                    {suggestion.icon}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{suggestion.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          Priority {index + 1}
                        </Badge>
                      </div>
                      <AlertDescription>
                        <p className="text-sm mb-2">
                          {formatParameterName(change.parameter)}: {change.previous} → {change.current} {change.unit}
                          <span className={`ml-2 font-medium ${change.change > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            ({change.change > 0 ? '+' : ''}{change.change.toFixed(1)}%)
                          </span>
                        </p>
                        <ul className="text-sm space-y-1 list-disc list-inside">
                          {suggestion.suggestions.slice(0, 3).map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* General Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>General Health Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Apple className="w-4 h-4 text-green-500" />
                Nutrition
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Follow a balanced, whole foods diet</li>
                <li>• Stay hydrated (8-10 glasses water daily)</li>
                <li>• Limit processed foods and added sugars</li>
                <li>• Include variety of colorful vegetables</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-blue-500" />
                Exercise
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• 150 minutes moderate cardio weekly</li>
                <li>• Strength training 2-3 times per week</li>
                <li>• Include flexibility and balance work</li>
                <li>• Take regular breaks from sitting</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Moon className="w-4 h-4 text-purple-500" />
                Sleep & Recovery
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Aim for 7-9 hours quality sleep</li>
                <li>• Maintain consistent sleep schedule</li>
                <li>• Create relaxing bedtime routine</li>
                <li>• Limit screens before bedtime</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-500" />
                Monitoring
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Regular health checkups</li>
                <li>• Track blood reports quarterly</li>
                <li>• Monitor symptoms and changes</li>
                <li>• Maintain health records</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};