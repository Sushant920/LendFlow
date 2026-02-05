import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Building2,
  ArrowRight,
  Shield,
  Zap,
  BarChart3,
  CheckCircle2,
  FileText,
  Users,
} from "lucide-react";

const Index = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate(role === "admin" ? "/admin" : "/dashboard");
    }
  }, [user, role, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold">LendFlow</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="gradient-hero py-20 lg:py-32">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold text-primary-foreground lg:text-6xl">
              Smarter Lending, Faster Growth
            </h1>
            <p className="mb-8 text-lg text-primary-foreground/80 lg:text-xl">
              Streamline your loan origination with AI-powered risk assessment, 
              automated document analysis, and instant eligibility decisions.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="gap-2 bg-accent hover:bg-accent/90" asChild>
                <Link to="/signup">
                  Start Free Application
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                asChild
              >
                <Link to="/login">Sign in to Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Why Choose LendFlow?</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Built for modern businesses seeking fast, transparent financing solutions.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Zap,
                title: "Instant Decisions",
                description:
                  "Get eligibility results in minutes with our AI-powered assessment engine.",
              },
              {
                icon: Shield,
                title: "Secure & Compliant",
                description:
                  "Bank-grade security with end-to-end encryption for all your data.",
              },
              {
                icon: BarChart3,
                title: "Transparent Scoring",
                description:
                  "Clear risk scores with actionable insights to improve your eligibility.",
              },
              {
                icon: FileText,
                title: "Smart Documents",
                description:
                  "AI-powered document analysis extracts data automatically from uploads.",
              },
              {
                icon: Users,
                title: "Dedicated Support",
                description:
                  "Expert team available to guide you through every step of the process.",
              },
              {
                icon: CheckCircle2,
                title: "Competitive Rates",
                description:
                  "Fair pricing based on your business profile with no hidden fees.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border bg-card p-6 shadow-card transition-shadow hover:shadow-elevated"
              >
                <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/50 py-20">
        <div className="container text-center">
          <h2 className="mb-4 text-3xl font-bold">Ready to Get Started?</h2>
          <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
            Join thousands of businesses that trust LendFlow for their financing needs.
          </p>
          <Button size="lg" className="gap-2" asChild>
            <Link to="/signup">
              Create Your Account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <span className="font-semibold">LendFlow</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 LendFlow. All rights reserved.
          </p>
        </div>
      </footer>
      </div>
  );
};

export default Index;
