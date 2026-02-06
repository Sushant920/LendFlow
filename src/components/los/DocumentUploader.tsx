
import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface DocumentUploaderProps {
    applicationId: string;
    onAnalysisComplete: (data: any) => void;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({ applicationId, onAnalysisComplete }) => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const { toast } = useToast();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('applicationId', applicationId);

        try {
            const response = await fetch('http://127.0.0.1:3000/api/upload-documents', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Upload failed');

            toast({
                title: 'Analysis Complete',
                description: 'Financial metrics extracted successfully.',
            });

            onAnalysisComplete(data.financials);
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to upload and analyze document.',
                variant: 'destructive',
            });
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <Card className="w-full">
            <CardContent className="p-6 space-y-4">
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors">
                    <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={handleFileChange}
                    />
                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                        <Upload className="h-10 w-10 text-gray-400 mb-2" />
                        <span className="text-sm font-medium text-gray-700">
                            {file ? file.name : 'Click to upload Bank Statement (PDF)'}
                        </span>
                        <span className="text-xs text-gray-500 mt-1">or drag and drop</span>
                    </label>
                </div>

                {file && (
                    <Button
                        onClick={handleUpload}
                        className="w-full"
                        disabled={uploading}
                    >
                        {uploading ? 'Analyzing with AI...' : 'Process Document'}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
};
