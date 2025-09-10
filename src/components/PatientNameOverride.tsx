import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Edit, Check, X } from 'lucide-react';

interface PatientNameOverrideProps {
  extractedName: string;
  onNameOverride: (newName: string) => void;
  onCancel: () => void;
}

export const PatientNameOverride = ({ 
  extractedName, 
  onNameOverride, 
  onCancel 
}: PatientNameOverrideProps) => {
  const [newName, setNewName] = useState(extractedName);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    if (newName.trim()) {
      onNameOverride(newName.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setNewName(extractedName);
    setIsEditing(false);
    onCancel();
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User size={20} />
          Patient Name Correction
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            The OCR extracted "{extractedName}" as the patient name. 
            If this is incorrect, please provide the correct name.
          </AlertDescription>
        </Alert>

        {isEditing ? (
          <div className="space-y-3">
            <div>
              <Label htmlFor="patient-name">Patient Name</Label>
              <Input
                id="patient-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter correct patient name"
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} size="sm" className="gap-2">
                <Check size={16} />
                Save
              </Button>
              <Button onClick={handleCancel} variant="outline" size="sm" className="gap-2">
                <X size={16} />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label>Extracted Name</Label>
              <div className="mt-1 p-2 bg-muted rounded-md">
                {extractedName}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsEditing(true)} size="sm" className="gap-2">
                <Edit size={16} />
                Edit Name
              </Button>
              <Button onClick={onCancel} variant="outline" size="sm">
                Keep As Is
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 