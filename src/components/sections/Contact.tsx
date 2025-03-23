
import React from "react";
import FadeIn from "../ui-custom/FadeIn";
import AnimatedText from "../ui-custom/AnimatedText";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Mail, MessageSquare, Phone } from "lucide-react";

const Contact = () => {
  return (
    <section id="contact" className="section-spacing w-full overflow-hidden bg-secondary/50">
      <div className="page-container">
        <div className="mx-auto max-w-3xl text-center">
          <FadeIn>
            <span className="mb-4 inline-block rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-primary">
              Contact
            </span>
          </FadeIn>
          
          <h2 className="mb-6 text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            <AnimatedText text="Get in touch with us" />
          </h2>
          
          <FadeIn delay={400}>
            <p className="mb-16 text-balance text-muted-foreground">
              Have questions or ready to start? Reach out and we'll respond promptly.
            </p>
          </FadeIn>
        </div>

        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-2">
          <FadeIn delay={200} className="space-y-8">
            <div className="glass-card rounded-xl p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5">
                <Mail className="h-5 w-5" />
              </div>
              <h3 className="mb-1 text-lg font-medium">Email Us</h3>
              <p className="mb-2 text-muted-foreground">
                Our friendly team is here to help.
              </p>
              <a
                href="mailto:hello@example.com"
                className="text-sm font-medium text-primary hover:underline"
              >
                hello@example.com
              </a>
            </div>

            <div className="glass-card rounded-xl p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5">
                <Phone className="h-5 w-5" />
              </div>
              <h3 className="mb-1 text-lg font-medium">Call Us</h3>
              <p className="mb-2 text-muted-foreground">
                Mon-Fri from 8am to 5pm.
              </p>
              <a
                href="tel:+1234567890"
                className="text-sm font-medium text-primary hover:underline"
              >
                +1 (234) 567-890
              </a>
            </div>

            <div className="glass-card rounded-xl p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h3 className="mb-1 text-lg font-medium">Live Chat</h3>
              <p className="mb-2 text-muted-foreground">
                Our team is just a click away.
              </p>
              <button className="text-sm font-medium text-primary hover:underline">
                Start a conversation
              </button>
            </div>
          </FadeIn>

          <FadeIn delay={400} className="glass-card rounded-xl p-8">
            <form className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Full Name
                </label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  className="rounded-lg border-border/50 bg-white/50"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="rounded-lg border-border/50 bg-white/50"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">
                  Message
                </label>
                <Textarea
                  id="message"
                  placeholder="How can we help you?"
                  className="min-h-32 rounded-lg border-border/50 bg-white/50"
                />
              </div>

              <Button type="submit" className="w-full rounded-lg">
                Send Message
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};

export default Contact;
