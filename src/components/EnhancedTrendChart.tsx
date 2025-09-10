import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Calendar, Activity } from 'lucide-react';
import { PatientDataService, PatientData } from '@/services/PatientDataService';

interface EnhancedTrendChartProps {
  patientName: string;
}

export const EnhancedTrendChart = ({ patientName }: EnhancedTrendChartProps) => {
  const [selectedParameter, setSelectedParameter] = useState<string>('');
  const [trendData, setTrendData] = useState<any>(null);
  const [availableParameters, setAvailableParameters] = useState<string[]>([]);
  const [patientSummary, setPatientSummary] = useState<any>(null);

  useEffect(() => {
    loadPatientData();
  }, [patientName]);

  useEffect(() => {
    if (selectedParameter) {
      loadTrendData();
    }
  }, [selectedParameter, patientName]);

  const loadPatientData = async () => {
    const patientData = await PatientDataService.loadPatientData(patientName);
    if (patientData) {
      const parameters = Object.keys(patientData.trends.parameterTrends);
      setAvailableParameters(parameters);
      if (parameters.length > 0 && !selectedParameter) {
        setSelectedParameter(parameters[0]);
      }
      
      // Create summary from patient data
      const summary = {
        name: patientData.name,
        totalReports: patientData.reports.length,
        lastReportDate: patientData.reports.length > 0 
          ? patientData.reports[patientData.reports.length - 1].reportDate 
          : null,
        parameterCount: Object.keys(patientData.trends.parameterTrends).length
      };
      setPatientSummary(summary);
    }
  };

  const loadTrendData = async () => {
    if (selectedParameter) {
      const patientData = await PatientDataService.loadPatientData(patientName);
      if (patientData) {
        // Find the parameter in the patient data
        const parameterData = patientData.trends.parameterTrends[selectedParameter];
        if (parameterData) {
          // Create trend data from patient reports
          const reports = patientData.reports
            .filter(report => report.parameters[selectedParameter])
            .sort((a, b) => new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime());
          
          const trendData = {
            parameter: selectedParameter,
            unit: reports[0]?.parameters[selectedParameter]?.unit || '',
            data: reports.map(report => ({
              date: report.reportDate,
              value: report.parameters[selectedParameter]?.value || 0,
              status: report.parameters[selectedParameter]?.status || 'normal'
            }))
          };
          setTrendData(trendData);
        }
      }
    }
  };

  const getTrendIcon = (direction: string) => {
    if (!direction) return <Minus size={16} className="text-gray-500" />;
    
    switch (direction) {
      case 'increasing': return <TrendingUp size={16} className="text-red-500" />;
      case 'decreasing': return <TrendingDown size={16} className="text-green-500" />;
      case 'fluctuating': return <Activity size={16} className="text-yellow-500" />;
      default: return <Minus size={16} className="text-gray-500" />;
    }
  };

  const getTrendColor = (direction: string) => {
    if (!direction) return 'text-gray-600';
    
    switch (direction) {
      case 'increasing': return 'text-red-600';
      case 'decreasing': return 'text-green-600';
      case 'fluctuating': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{formatDate(label)}</p>
          <p className="text-sm">
            Value: <span className="font-medium">{data.value}</span> {trendData?.unit}
          </p>
          <p className="text-sm">
            Status: <Badge variant={data.status === 'normal' ? 'secondary' : 'destructive'} className="text-xs">
              {data.status.toUpperCase()}
            </Badge>
          </p>
        </div>
      );
    }
    return null;
  };

  if (!patientSummary) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">No data available for {patientName}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Patient Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar size={20} />
            Patient History Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{patientSummary.totalReports}</div>
              <div className="text-sm text-muted-foreground">Total Reports</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{patientSummary.criticalAlerts}</div>
              <div className="text-sm text-muted-foreground">Critical Alerts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{patientSummary.improvingParameters}</div>
              <div className="text-sm text-muted-foreground">Improving</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{patientSummary.worseningParameters}</div>
              <div className="text-sm text-muted-foreground">Worsening</div>
            </div>
          </div>
          {patientSummary.lastReportDate && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Last Report: {formatDate(patientSummary.lastReportDate)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Parameter Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Parameter Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Select value={selectedParameter} onValueChange={setSelectedParameter}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select parameter" />
              </SelectTrigger>
              <SelectContent>
                {availableParameters.map(param => (
                  <SelectItem key={param} value={param}>
                    {param.replace(/([A-Z])/g, ' $1').trim()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {trendData && trendData.data && (
            <div className="space-y-4">
              {/* Trend Summary */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  {getTrendIcon(trendData.trendDirection)}
                  <span className={`font-medium ${getTrendColor(trendData.trendDirection)}`}>
                    {trendData.trendDirection ? trendData.trendDirection.charAt(0).toUpperCase() + trendData.trendDirection.slice(1) : 'Unknown'}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Change Rate</div>
                  <div className={`font-bold ${trendData.changeRate && trendData.changeRate > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {trendData.changeRate && trendData.changeRate > 0 ? '+' : ''}{trendData.changeRate ? trendData.changeRate.toFixed(1) : '0.0'}%
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData.data || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                    />
                    {/* Reference lines for optimal range */}
                    {trendData.optimalRange && typeof trendData.optimalRange === 'string' && trendData.optimalRange.includes('-') && (
                      <>
                        <ReferenceLine 
                          y={parseFloat(trendData.optimalRange.split('-')[0])} 
                          stroke="#10b981" 
                          strokeDasharray="3 3"
                          label="Min"
                        />
                        <ReferenceLine 
                          y={parseFloat(trendData.optimalRange.split('-')[1])} 
                          stroke="#10b981" 
                          strokeDasharray="3 3"
                          label="Max"
                        />
                      </>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Data Points */}
              <div className="space-y-2">
                <h4 className="font-medium">Data Points</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {(trendData.data || []).map((point: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="text-sm font-medium">{formatDate(point.date)}</div>
                        <div className="text-xs text-muted-foreground">
                          {point.value} {trendData.unit || ''}
                        </div>
                      </div>
                      <Badge variant={point.status === 'normal' ? 'secondary' : 'destructive'} className="text-xs">
                        {point.status ? point.status.toUpperCase() : 'UNKNOWN'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {(!trendData || !trendData.data) && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No trend data available for the selected parameter.</p>
              <p className="text-sm mt-2">Upload more reports to see trends.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 