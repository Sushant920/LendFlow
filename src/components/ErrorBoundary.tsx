import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
                    <Card className="w-full max-w-2xl border-destructive shadow-lg">
                        <CardHeader className="bg-destructive/10">
                            <CardTitle className="text-destructive flex items-center gap-2">
                                Something went wrong
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="rounded-md bg-slate-950 p-4 overflow-auto max-h-[400px]">
                                <code className="text-sm text-red-400 block mb-2">
                                    {this.state.error?.toString()}
                                </code>
                                {this.state.errorInfo && (
                                    <pre className="text-xs text-slate-400 font-mono">
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                )}
                            </div>
                            <Button
                                onClick={() => window.location.href = '/'}
                                className="w-full"
                            >
                                <RefreshCcw className="mr-2 h-4 w-4" />
                                Reload Application
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}
