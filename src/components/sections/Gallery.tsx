
import React, { useState } from "react";
import FadeIn from "../ui-custom/FadeIn";
import AnimatedText from "../ui-custom/AnimatedText";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

const galleryItems = [
  {
    title: "Premium Experience",
    description: "Elegant interfaces designed with precision and care.",
    image: "product-1",
  },
  {
    title: "Intuitive Interaction",
    description: "Seamless user experiences that feel natural and effortless.",
    image: "product-2",
  },
  {
    title: "Crafted Details",
    description: "Every pixel meticulously placed for maximum impact.",
    image: "product-3",
  },
];

const Gallery = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const goToPrevious = () => {
    setActiveIndex((current) =>
      current === 0 ? galleryItems.length - 1 : current - 1
    );
  };

  const goToNext = () => {
    setActiveIndex((current) =>
      current === galleryItems.length - 1 ? 0 : current + 1
    );
  };

  return (
    <section id="gallery" className="section-spacing w-full overflow-hidden">
      <div className="page-container">
        <div className="mx-auto max-w-3xl text-center">
          <FadeIn>
            <span className="mb-4 inline-block rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-primary">
              Gallery
            </span>
          </FadeIn>
          
          <h2 className="mb-6 text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            <AnimatedText text="Showcase of premium design" />
          </h2>
          
          <FadeIn delay={400}>
            <p className="mb-16 text-balance text-muted-foreground">
              Browse through our collection of carefully crafted interfaces and experiences.
            </p>
          </FadeIn>
        </div>

        <div className="mx-auto max-w-5xl">
          <FadeIn className="relative overflow-hidden rounded-2xl bg-secondary/50">
            <div className="relative aspect-[16/9] w-full overflow-hidden">
              {galleryItems.map((item, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${
                    index === activeIndex ? "opacity-100" : "opacity-0 pointer-events-none"
                  }`}
                  aria-hidden={index !== activeIndex}
                >
                  <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground/30">
                    {item.image}
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent p-8 text-white">
                    <h3 className="mb-2 text-2xl font-medium">{item.title}</h3>
                    <p className="mb-4 max-w-lg text-white/80">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="absolute bottom-8 right-8 flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                onClick={goToPrevious}
                aria-label="Previous image"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                onClick={goToNext}
                aria-label="Next image"
              >
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </FadeIn>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {galleryItems.map((item, index) => (
            <FadeIn
              key={index}
              delay={200 + index * 100}
              className={`hover-lift cursor-pointer rounded-xl border p-6 transition-all ${
                index === activeIndex
                  ? "border-primary/20 bg-primary/5"
                  : "border-border/50 bg-background"
              }`}
              onClick={() => setActiveIndex(index)}
            >
              <h3 className="mb-2 text-lg font-medium">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Gallery;
