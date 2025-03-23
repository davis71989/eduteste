
import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  duration?: number;
  threshold?: number;
  once?: boolean;
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  className,
  delay = 0,
  direction = "up",
  duration = 700,
  threshold = 0.2,
  once = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once && ref.current) {
            observer.unobserve(ref.current);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [once, threshold]);

  const getDirectionStyles = () => {
    const baseStyles = {
      opacity: 0,
      transform: "none",
      transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1), transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
      transitionDelay: `${delay}ms`,
    };

    if (!isVisible) {
      switch (direction) {
        case "up":
          return { ...baseStyles, transform: "translateY(20px)" };
        case "down":
          return { ...baseStyles, transform: "translateY(-20px)" };
        case "left":
          return { ...baseStyles, transform: "translateX(20px)" };
        case "right":
          return { ...baseStyles, transform: "translateX(-20px)" };
        default:
          return baseStyles;
      }
    }

    return {
      opacity: 1,
      transform: "none",
      transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1), transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
      transitionDelay: `${delay}ms`,
    };
  };

  return (
    <div ref={ref} className={cn(className)} style={getDirectionStyles()}>
      {children}
    </div>
  );
};

export default FadeIn;
