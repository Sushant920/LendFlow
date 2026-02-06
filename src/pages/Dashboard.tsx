import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";

interface Application {
  id: string;
  loan_type: "working_capital" | "term_loan";
  status: "draft" | "submitted" | "under_review" | "approved" | "rejected" | "requires_info";
  requested_amount: number | null;
  business_name: string | null;
  created_at: string;
  risk_score: number | null;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, [user]);
  const fetchApplications = async () => {
    if (!user) return;

    try {
      const response = await fetch(`http://127.0.0.1:3000/api/applications?user_id=${user.id}`);
      if (!response.ok) throw new Error("Failed to fetch applications");

      const data = await response.json();
      setApplications(data);
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: applications.length,
    pending: applications.filter((a) =>
      ["submitted", "under_review", "requires_info"].includes(a.status)
    ).length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  const formatLoanType = (type: string) => {
    return type === "working_capital" ? "Working Capital" : "Term Loan";
  };

  const formatAmount = (amount: number | null) => {
    if (!amount) return "—";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold lg:text-3xl">Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your loan applications and track their status.
            </p>
          </div>
          <Button onClick={() => navigate("/apply")} className="gap-2">
            <Plus className="h-4 w-4" />
            New Application
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-card">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-primary/10 p-3">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-warning/10 p-3">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-success/10 p-3">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-destructive/10 p-3">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">{stats.rejected}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applications List */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
            <CardDescription>
              Your loan applications and their current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : applications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 rounded-full bg-muted p-4">
                  <TrendingUp className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">No applications yet</h3>
                <p className="mb-4 max-w-sm text-muted-foreground">
                  Start your first loan application to get access to fast, flexible financing.
                </p>
                <Button onClick={() => navigate("/apply")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Start Application
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.slice(0, 5).map((app) => (
                  <Link
                    key={app.id}
                    to={app.status === "draft" ? `/apply?id=${app.id}` : `/applications/${app.id}`}
                    className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="hidden rounded-lg bg-primary/10 p-2 sm:block">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {formatLoanType(app.loan_type)}
                          {app.business_name && ` • ${app.business_name}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatAmount(app.requested_amount)} •{" "}
                          {format(new Date(app.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={app.status} />
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
                {applications.length > 5 && (
                  <Button variant="ghost" className="w-full" asChild>
                    <Link to="/applications">View all applications</Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}