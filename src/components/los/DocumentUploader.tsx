
import React, { useState } from 'react';
import { UploadCloud, CheckCircle, FileText, X } from "lucide-react";
import { API_BASE_URL } from "@/config";
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
            const response = await fetch(`${API_BASE_URL}/api/upload-documents`, {
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
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                            <UploadCloud className="h-6 w-6 text-primary" />
                        </div><span className="text-sm font-medium text-gray-700">
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
