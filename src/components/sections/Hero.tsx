
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import AnimatedText from "../ui-custom/AnimatedText";
import FadeIn from "../ui-custom/FadeIn";

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] w-full overflow-hidden pt-24">
      <div className="page-container flex min-h-[90vh] flex-col items-center justify-center py-12 md:py-16">
        <div className="relative mx-auto max-w-4xl text-center">
          <FadeIn className="mb-5" delay={300}>
            <span className="mb-4 inline-block rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-primary">
              Premium Design Experience
            </span>
          </FadeIn>

          <h1 className="mb-6 text-balance text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
            <AnimatedText
              text="Crafted with precision, designed for excellence"
              delay={500}
            />
          </h1>

          <FadeIn className="mb-12" delay={800}>
            <p className="mx-auto max-w-2xl text-balance text-lg text-muted-foreground md:text-xl">
              A minimalist approach to design that focuses on simplicity and
              functionality while maintaining elegance and sophistication.
            </p>
          </FadeIn>

          <FadeIn className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center" delay={1000}>
            <Button size="lg" className="rounded-full px-8">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full border-border/60 px-8"
            >
              Learn More
            </Button>
          </FadeIn>
        </div>

        <FadeIn
          className="mt-20 w-full max-w-5xl rounded-2xl overflow-hidden"
          delay={1200}
        >
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-black/5">
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
              Product Preview
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Background elements */}
      <div className="pointer-events-none absolute left-0 top-0 -z-10 h-full w-full overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>
    </section>
  );
};

export default Hero;
