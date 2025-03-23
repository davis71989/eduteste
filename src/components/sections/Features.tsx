
import React from "react";
import FadeIn from "../ui-custom/FadeIn";
import AnimatedText from "../ui-custom/AnimatedText";
import { Check, LayoutGrid, DollarSign, ArrowUpRight, Zap, Shield } from "lucide-react";

const features = [
  {
    icon: <LayoutGrid className="h-6 w-6" />,
    title: "Intuitive Design",
    description: "Clean interfaces that prioritize user experience and ease of use.",
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "High Performance",
    description: "Optimized for speed and efficiency across all devices and platforms.",
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Secure Platform",
    description: "Built with privacy and security as fundamental principles.",
  },
  {
    icon: <DollarSign className="h-6 w-6" />,
    title: "Cost Effective",
    description: "Maximum value without compromising on quality or capabilities.",
  },
];

const Features = () => {
  return (
    <section id="features" className="section-spacing w-full overflow-hidden bg-secondary/50">
      <div className="page-container">
        <div className="mx-auto max-w-3xl text-center">
          <FadeIn>
            <span className="mb-4 inline-block rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-primary">
              Features
            </span>
          </FadeIn>
          
          <h2 className="mb-6 text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            <AnimatedText text="Designed with purpose, built with precision" />
          </h2>
          
          <FadeIn delay={400}>
            <p className="mb-16 text-balance text-muted-foreground">
              Our minimalist approach focuses on what matters most, delivering powerful functionality without unnecessary complexity.
            </p>
          </FadeIn>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <FadeIn 
              key={index} 
              delay={300 + index * 100} 
              className="hover-lift glass-card rounded-xl border border-border/50 p-6"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/5">
                {feature.icon}
              </div>
              <h3 className="mb-2 text-xl font-medium">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={800} className="mt-16 rounded-2xl bg-primary/5 p-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div>
              <h3 className="mb-2 text-xl font-medium">Ready to experience the difference?</h3>
              <p className="text-muted-foreground">Join thousands of satisfied customers today.</p>
            </div>
            <a
              href="#contact"
              className="group inline-flex items-center gap-1 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Get Started
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default Features;
