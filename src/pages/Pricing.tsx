import { Check, X, Sparkles, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
const plans = [{
  name: "Starter",
  description: "Perfect for beginners exploring content creation",
  price: "$20",
  period: "forever",
  icon: Sparkles,
  popular: false,
  features: [{
    name: "3 DNA extractions/month",
    included: true
  }, {
    name: "5 script generations/month",
    included: true
  }, {
    name: "2 personas",
    included: true
  }, {
    name: "Basic templates",
    included: true
  }, {
    name: "Community support",
    included: true
  }, {
    name: "Version history (7 days)",
    included: true
  }, {
    name: "Priority support",
    included: false
  }, {
    name: "Advanced analytics",
    included: false
  }, {
    name: "Team collaboration",
    included: false
  }]
}, {
  name: "Pro",
  description: "For serious content creators who want more power",
  price: "$59",
  period: "/month",
  icon: Zap,
  popular: true,
  features: [{
    name: "Unlimited DNA extractions",
    included: true
  }, {
    name: "Unlimited script generations",
    included: true
  }, {
    name: "Unlimited personas",
    included: true
  }, {
    name: "Premium templates",
    included: true
  }, {
    name: "Priority email support",
    included: true
  }, {
    name: "Version history (unlimited)",
    included: true
  }, {
    name: "Priority support",
    included: true
  }, {
    name: "Advanced analytics",
    included: true
  }, {
    name: "Team collaboration",
    included: false
  }]
}, {
  name: "Enterprise",
  description: "For teams and agencies scaling content production",
  price: "$419",
  period: "/month",
  icon: Crown,
  popular: false,
  features: [{
    name: "Everything in Pro",
    included: true
  }, {
    name: "Team workspaces",
    included: true
  }, {
    name: "Unlimited team members",
    included: true
  }, {
    name: "Custom templates",
    included: true
  }, {
    name: "Dedicated account manager",
    included: true
  }, {
    name: "Version history (unlimited)",
    included: true
  }, {
    name: "Priority support (24/7)",
    included: true
  }, {
    name: "Advanced analytics + reports",
    included: true
  }, {
    name: "Team collaboration",
    included: true
  }, {
    name: "API access",
    included: true
  }]
}];
const comparisonFeatures = [{
  name: "DNA Extractions",
  starter: "3/month",
  pro: "Unlimited",
  enterprise: "Unlimited"
}, {
  name: "Script Generations",
  starter: "5/month",
  pro: "Unlimited",
  enterprise: "Unlimited"
}, {
  name: "Personas",
  starter: "2",
  pro: "Unlimited",
  enterprise: "Unlimited"
}, {
  name: "Templates",
  starter: "Basic",
  pro: "Premium",
  enterprise: "Custom"
}, {
  name: "Version History",
  starter: "7 days",
  pro: "Unlimited",
  enterprise: "Unlimited"
}, {
  name: "Support",
  starter: "Community",
  pro: "Priority Email",
  enterprise: "24/7 Dedicated"
}, {
  name: "Analytics",
  starter: "Basic",
  pro: "Advanced",
  enterprise: "Advanced + Reports"
}, {
  name: "Team Members",
  starter: "1",
  pro: "1",
  enterprise: "Unlimited"
}, {
  name: "API Access",
  starter: "—",
  pro: "—",
  enterprise: "Full Access"
}];
export default function Pricing() {
  const navigate = useNavigate();
  return <div className="min-h-screen bg-background">
    {/* Header */}
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <button onClick={() => navigate("/")} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">​L</span>
          </div>
          <span className="text-lg font-semibold">LOG</span>
        </button>
        <Button variant="outline" onClick={() => navigate("/auth")}>
          Sign In
        </Button>
      </div>
    </header>

    {/* Hero */}
    <section className="py-16 text-center">
      <div className="container mx-auto px-4">
        <Badge variant="secondary" className="mb-4">
          Simple, transparent pricing
        </Badge>
        <h1 className="mb-4 text-4xl font-bold md:text-5xl">
          Choose your plan
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Start for free and upgrade as you grow. All plans include our core features
          to help you create viral content.
        </p>
      </div>
    </section>

    {/* Pricing Cards */}
    <section className="pb-16">
      <div className="container mx-auto px-4">
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map(plan => <Card key={plan.name} className={`relative flex flex-col ${plan.popular ? "border-primary shadow-lg shadow-primary/20" : "border-border/50"}`}>
            {plan.popular && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
              Most Popular
            </Badge>}
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <plan.icon className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="mb-6 text-center">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
              <ul className="space-y-3">
                {plan.features.map(feature => <li key={feature.name} className="flex items-center gap-3">
                  {feature.included ? <Check className="h-4 w-4 text-primary" /> : <X className="h-4 w-4 text-muted-foreground/50" />}
                  <span className={feature.included ? "" : "text-muted-foreground/50"}>
                    {feature.name}
                  </span>
                </li>)}
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant={plan.popular ? "default" : "outline"} onClick={() => navigate("/auth")}>
                {plan.price === "$0" ? "Get Started Free" : "Start Free Trial"}
              </Button>
            </CardFooter>
          </Card>)}
        </div>
      </div>
    </section>

    {/* Comparison Table */}
    <section className="border-t border-border/50 bg-card/30 py-16">
      <div className="container mx-auto px-4">
        <h2 className="mb-8 text-center text-3xl font-bold">Compare Plans</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="px-4 py-3 text-left font-medium">Feature</th>
                <th className="px-4 py-3 text-center font-medium">Starter</th>
                <th className="px-4 py-3 text-center font-medium text-primary">Pro</th>
                <th className="px-4 py-3 text-center font-medium">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {comparisonFeatures.map(feature => <tr key={feature.name} className="border-b border-border/30">
                <td className="px-4 py-3 font-medium">{feature.name}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{feature.starter}</td>
                <td className="px-4 py-3 text-center">{feature.pro}</td>
                <td className="px-4 py-3 text-center">{feature.enterprise}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </section>

    {/* FAQ */}
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="mb-8 text-center text-3xl font-bold">Frequently Asked Questions</h2>
        <div className="mx-auto grid max-w-3xl gap-4">
          {[{
            q: "Can I switch plans anytime?",
            a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately."
          }, {
            q: "Is there a free trial for paid plans?",
            a: "Yes, all paid plans come with a 14-day free trial. No credit card required to start."
          }, {
            q: "What happens to my data if I downgrade?",
            a: "Your data is always safe. If you downgrade, you'll keep access to your existing work but new creation limits will apply."
          }, {
            q: "Do you offer refunds?",
            a: "Yes, we offer a 30-day money-back guarantee if you're not satisfied with your purchase."
          }].map(faq => <Card key={faq.q} className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{faq.q}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{faq.a}</p>
            </CardContent>
          </Card>)}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="border-t border-border/50 bg-primary/5 py-16">
      <div className="container mx-auto px-4 text-center">
        <h2 className="mb-4 text-3xl font-bold">Ready to create viral content?</h2>
        <p className="mb-6 text-muted-foreground">
          Join thousands of creators already using ScriptLab
        </p>
        <Button size="lg" onClick={() => navigate("/auth")}>
          Start Free Today
        </Button>
      </div>
    </section>
  </div>;
}