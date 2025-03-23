
import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedTextProps {
  text: string;
  className?: string;
  delay?: number;
  once?: boolean;
  threshold?: number;
  as?: React.ElementType;
  staggerDelay?: number;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  className,
  delay = 0,
  once = true,
  threshold = 0.2,
  as: Component = "div",
  staggerDelay = 30,
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

  // Split text into words and characters
  const words = text.split(" ");

  return (
    <Component className={cn("inline-block", className)}>
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="inline-block">
          <span className="animated-text">
            {word.split("").map((char, charIndex) => (
              <span
                key={charIndex}
                style={{
                  animationDelay: isVisible
                    ? `${delay + (wordIndex * 2 + charIndex) * staggerDelay}ms`
                    : "0ms",
                  animationName: isVisible ? "text-reveal" : "none",
                }}
              >
                {char}
              </span>
            ))}
          </span>
          {wordIndex !== words.length - 1 && " "}
        </span>
      ))}
    </Component>
  );
};

export default AnimatedText;
