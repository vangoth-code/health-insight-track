import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Upload, Edit3, Save, X } from 'lucide-react';
import { PatientDataService, PatientData } from '@/services/PatientDataService';

interface PatientDataViewerProps {
  patientId: string;
  onDataUpdate?: (data: PatientData) => void;
}

export const PatientDataViewer = ({ patientId, onDataUpdate }: PatientDataViewerProps) => {
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<PatientData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPatientData();
  }, [patientId]);

  const loadPatientData = async () => {
    setIsLoading(true);
    try {
      const data = await PatientDataService.loadPatientData(patientId);
      setPatientData(data);
      setEditedData(data);
    } catch (error) {
      console.error('Error loading patient data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedData(patientData);
  };

  const handleSave = async () => {
    if (editedData) {
      try {
        await PatientDataService.savePatientData(editedData);
        setPatientData(editedData);
        setIsEditing(false);
        onDataUpdate?.(editedData);
      } catch (error) {
        console.error('Error saving patient data:', error);
      }
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData(patientData);
  };

  const handleExport = () => {
    if (patientData) {
      const jsonString = PatientDataService.exportPatientData(patientData);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${patientData.patientId}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const jsonString = e.target?.result as string;
          const importedData = PatientDataService.importPatientData(jsonString);
          if (importedData) {
            await PatientDataService.savePatientData(importedData);
            setPatientData(importedData);
            setEditedData(importedData);
            onDataUpdate?.(importedData);
          }
        } catch (error) {
          console.error('Error importing data:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading patient data...</p>
        </CardContent>
      </Card>
    );
  }

  if (!patientData) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">No patient data found for {patientId}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Patient Data
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Edit3 size={16} className="mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download size={16} className="mr-2" />
                  Export
                </Button>
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button variant="outline" size="sm">
                    <Upload size={16} className="mr-2" />
                    Import
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button size="sm" onClick={handleSave}>
                  <Save size={16} className="mr-2" />
                  Save
                </Button>
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  <X size={16} className="mr-2" />
                  Cancel
                </Button>
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Patient ID</label>
            {isEditing ? (
              <input
                type="text"
                value={editedData?.patientId || ''}
                onChange={(e) => setEditedData(prev => prev ? { ...prev, patientId: e.target.value } : null)}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              />
            ) : (
              <p className="mt-1 font-medium">{patientData.patientId}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Name</label>
            {isEditing ? (
              <input
                type="text"
                value={editedData?.name || ''}
                onChange={(e) => setEditedData(prev => prev ? { ...prev, name: e.target.value } : null)}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              />
            ) : (
              <p className="mt-1 font-medium">{patientData.name}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Age</label>
            {isEditing ? (
              <input
                type="number"
                value={editedData?.age || 0}
                onChange={(e) => setEditedData(prev => prev ? { ...prev, age: parseInt(e.target.value) || 0 } : null)}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              />
            ) : (
              <p className="mt-1 font-medium">{patientData.age}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Gender</label>
            {isEditing ? (
              <select
                value={editedData?.gender || 'F'}
                onChange={(e) => setEditedData(prev => prev ? { ...prev, gender: e.target.value as 'M' | 'F' } : null)}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            ) : (
              <p className="mt-1 font-medium">{patientData.gender}</p>
            )}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">Relationship</label>
          {isEditing ? (
            <input
              type="text"
              value={editedData?.relationship || ''}
              onChange={(e) => setEditedData(prev => prev ? { ...prev, relationship: e.target.value } : null)}
              className="w-full mt-1 px-3 py-2 border rounded-md"
            />
          ) : (
            <p className="mt-1 font-medium">{patientData.relationship}</p>
          )}
        </div>

        <div className="flex gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Total Reports</label>
            <p className="mt-1 font-medium">{patientData.metadata.totalReports}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Last Modified</label>
            <p className="mt-1 font-medium">
              {patientData.metadata.lastModified 
                ? new Date(patientData.metadata.lastModified).toLocaleDateString()
                : 'Never'
              }
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Trends Updated</label>
            <p className="mt-1 font-medium">
              {patientData.trends.lastUpdated
                ? new Date(patientData.trends.lastUpdated).toLocaleDateString()
                : 'Never'
              }
            </p>
          </div>
        </div>

        {patientData.trends.parameterTrends && Object.keys(patientData.trends.parameterTrends).length > 0 && (
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Parameter Trends</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(patientData.trends.parameterTrends).map(([param, trend]) => (
                <div key={param} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{param}</span>
                    <Badge variant={trend.trend === 'increasing' ? 'destructive' : 'secondary'}>
                      {trend.trend}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Current: {trend.lastValue}</p>
                    {trend.previousValue && <p>Previous: {trend.previousValue}</p>}
                    {trend.change && <p>Change: {trend.change}</p>}
                    {trend.timeframe && <p>Timeframe: {trend.timeframe}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
