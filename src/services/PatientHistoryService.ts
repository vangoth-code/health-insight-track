import { ExtractedReport, BloodParameter } from './BloodReportExtractor';

export interface PatientHistory {
  patientName: string;
  reports: ExtractedReport[];
  parameterTrends: Record<string, ParameterTrend>;
  lastUpdated: string;
}

export interface ParameterTrend {
  parameterName: string;
  values: TrendPoint[];
  unit: string;
  optimalRange: string;
  trendDirection: 'increasing' | 'decreasing' | 'stable' | 'fluctuating';
  changeRate: number; // percentage change over time
  alerts: TrendAlert[];
}

export interface TrendPoint {
  date: string;
  value: number;
  status: 'normal' | 'high' | 'low' | 'critical';
  reportId: string;
}

export interface TrendAlert {
  type: 'critical' | 'warning' | 'improvement';
  message: string;
  date: string;
  parameter: string;
  value: number;
}

export class PatientHistoryService {
  private static readonly STORAGE_KEY = 'patient_history_data';

  // Get all patient histories
  static getAllPatientHistories(): PatientHistory[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading patient histories:', error);
      return [];
    }
  }

  // Get history for a specific patient
  static getPatientHistory(patientName: string): PatientHistory | null {
    const histories = this.getAllPatientHistories();
    return histories.find(h => h.patientName === patientName) || null;
  }

  // Add or update a report for a patient
  static addReport(report: ExtractedReport): void {
    const histories = this.getAllPatientHistories();
    let patientHistory = histories.find(h => h.patientName === report.patientName);

    if (!patientHistory) {
      // Create new patient history
      patientHistory = {
        patientName: report.patientName,
        reports: [],
        parameterTrends: {},
        lastUpdated: new Date().toISOString()
      };
      histories.push(patientHistory);
    }

    // Check if report already exists (by date and type)
    const existingIndex = patientHistory.reports.findIndex(
      r => r.date === report.date && r.type === report.type
    );

    if (existingIndex >= 0) {
      // Update existing report
      patientHistory.reports[existingIndex] = report;
    } else {
      // Add new report
      patientHistory.reports.push(report);
    }

    // Sort reports by date
    patientHistory.reports.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Update parameter trends
    patientHistory.parameterTrends = this.calculateParameterTrends(patientHistory.reports);
    patientHistory.lastUpdated = new Date().toISOString();

    // Save to localStorage
    this.savePatientHistories(histories);
  }

  // Calculate trends for all parameters across reports
  private static calculateParameterTrends(reports: ExtractedReport[]): Record<string, ParameterTrend> {
    const trends: Record<string, ParameterTrend> = {};

    if (reports.length === 0) return trends;

    // Get all unique parameters across all reports
    const allParameters = new Set<string>();
    reports.forEach(report => {
      Object.keys(report.parameters).forEach(param => allParameters.add(param));
    });

    // Calculate trends for each parameter
    allParameters.forEach(paramName => {
      const trendPoints: TrendPoint[] = [];
      let unit = '';
      let optimalRange = '';

      // Collect all values for this parameter
      reports.forEach(report => {
        const param = report.parameters[paramName];
        if (param) {
          trendPoints.push({
            date: report.date,
            value: param.value,
            status: param.status,
            reportId: report.id
          });
          unit = param.unit;
          optimalRange = param.optimal;
        }
      });

      if (trendPoints.length > 0) {
        // Sort by date
        trendPoints.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Calculate trend direction and change rate
        const trendDirection = this.calculateTrendDirection(trendPoints);
        const changeRate = this.calculateChangeRate(trendPoints);
        const alerts = this.generateTrendAlerts(trendPoints, paramName);

        trends[paramName] = {
          parameterName: paramName,
          values: trendPoints,
          unit,
          optimalRange,
          trendDirection,
          changeRate,
          alerts
        };
      }
    });

    return trends;
  }

  // Calculate trend direction
  private static calculateTrendDirection(trendPoints: TrendPoint[]): 'increasing' | 'decreasing' | 'stable' | 'fluctuating' {
    if (trendPoints.length < 2) return 'stable';

    const values = trendPoints.map(p => p.value);
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const totalChange = lastValue - firstValue;
    const percentChange = (totalChange / firstValue) * 100;

    // Check for fluctuations (multiple direction changes)
    let directionChanges = 0;
    for (let i = 1; i < values.length; i++) {
      if ((values[i] > values[i - 1] && values[i - 1] < values[i - 2]) ||
          (values[i] < values[i - 1] && values[i - 1] > values[i - 2])) {
        directionChanges++;
      }
    }

    if (directionChanges >= 2) return 'fluctuating';
    if (Math.abs(percentChange) < 5) return 'stable';
    return percentChange > 0 ? 'increasing' : 'decreasing';
  }

  // Calculate change rate (percentage change over time)
  private static calculateChangeRate(trendPoints: TrendPoint[]): number {
    if (trendPoints.length < 2) return 0;

    const firstValue = trendPoints[0].value;
    const lastValue = trendPoints[trendPoints.length - 1].value;
    const totalChange = lastValue - firstValue;
    return (totalChange / firstValue) * 100;
  }

  // Generate alerts for concerning trends
  private static generateTrendAlerts(trendPoints: TrendPoint[], paramName: string): TrendAlert[] {
    const alerts: TrendAlert[] = [];

    if (trendPoints.length < 2) return alerts;

    // Check for critical values
    const criticalPoints = trendPoints.filter(p => p.status === 'critical');
    criticalPoints.forEach(point => {
      alerts.push({
        type: 'critical',
        message: `${paramName} is critically ${point.value > 0 ? 'high' : 'low'} (${point.value})`,
        date: point.date,
        parameter: paramName,
        value: point.value
      });
    });

    // Check for worsening trends
    const recentPoints = trendPoints.slice(-3); // Last 3 measurements
    const worseningCount = recentPoints.filter(p => p.status === 'high' || p.status === 'low').length;
    
    if (worseningCount >= 2) {
      alerts.push({
        type: 'warning',
        message: `${paramName} has been consistently abnormal in recent measurements`,
        date: recentPoints[recentPoints.length - 1].date,
        parameter: paramName,
        value: recentPoints[recentPoints.length - 1].value
      });
    }

    // Check for improvements
    const allAbnormal = trendPoints.filter(p => p.status !== 'normal');
    const recentImprovements = recentPoints.filter(p => p.status === 'normal').length;
    
    if (allAbnormal.length > 0 && recentImprovements >= 2) {
      alerts.push({
        type: 'improvement',
        message: `${paramName} has improved to normal levels`,
        date: recentPoints[recentPoints.length - 1].date,
        parameter: paramName,
        value: recentPoints[recentPoints.length - 1].value
      });
    }

    return alerts;
  }

  // Get all patients
  static getAllPatients(): string[] {
    const histories = this.getAllPatientHistories();
    return histories.map(h => h.patientName);
  }

  // Delete a patient's history
  static deletePatientHistory(patientName: string): void {
    const histories = this.getAllPatientHistories();
    const filtered = histories.filter(h => h.patientName !== patientName);
    this.savePatientHistories(filtered);
  }

  // Save all patient histories
  private static savePatientHistories(histories: PatientHistory[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(histories));
    } catch (error) {
      console.error('Error saving patient histories:', error);
    }
  }

  // Get trend data for charting
  static getTrendData(patientName: string, parameterName: string) {
    const history = this.getPatientHistory(patientName);
    if (!history || !history.parameterTrends[parameterName]) {
      return null;
    }

    const trend = history.parameterTrends[parameterName];
    return {
      data: trend.values.map(point => ({
        date: point.date,
        value: point.value,
        status: point.status
      })),
      unit: trend.unit,
      optimalRange: trend.optimalRange,
      trendDirection: trend.trendDirection,
      changeRate: trend.changeRate
    };
  }

  // Get summary statistics for a patient
  static getPatientSummary(patientName: string) {
    const history = this.getPatientHistory(patientName);
    if (!history) return null;

    const totalReports = history.reports.length;
    const criticalAlerts = Object.values(history.parameterTrends)
      .flatMap(trend => trend.alerts)
      .filter(alert => alert.type === 'critical').length;

    const parameters = Object.keys(history.parameterTrends);
    const improvingParameters = parameters.filter(param => 
      history.parameterTrends[param].trendDirection === 'decreasing' && 
      history.parameterTrends[param].changeRate < -5
    ).length;

    const worseningParameters = parameters.filter(param => 
      history.parameterTrends[param].trendDirection === 'increasing' && 
      history.parameterTrends[param].changeRate > 5
    ).length;

    return {
      totalReports,
      criticalAlerts,
      improvingParameters,
      worseningParameters,
      parameters: parameters.length,
      lastReportDate: history.reports.length > 0 ? 
        history.reports[history.reports.length - 1].date : null
    };
  }
} 