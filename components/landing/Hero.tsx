"use client";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { CpuIcon, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "../ui/button";

export default function Hero() {
  return (
    <section className="relative min-h-[calc(100vh-68px)]">
      <Carousel
        className="w-full h-[calc(100vh-68px)]"
        opts={{
          loop: true,
          align: "start",
        }}
        plugins={[
          Autoplay({
            delay: 5000,
            stopOnInteraction: true,
          }),
        ]}
      >
        <CarouselContent className="h-full">
          {["/hero-banner.webp", "/hero-banner2.webp", "/hero-banner3.webp"].map(
            (image, index) => (
              <CarouselItem key={index} className="h-[calc(100vh-68px)]">
                <div className="relative w-full h-full">
                  <div className="absolute inset-0">
                    <img
                      src={image}
                      alt={`Tech Products ${index + 1}`}
                      className="absolute inset-0 w-full h-full object-cover brightness-[0.4] transition-transform duration-5000 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/30 to-black/50" />
                  </div>
                </div>
              </CarouselItem>
            ),
          )}
        </CarouselContent>
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4">
          <CarouselPrevious className="static translate-y-0 left-0 bg-white/20  border-none transition-all duration-300" />
          <CarouselNext className="static translate-y-0 right-0 bg-white/20  border-none transition-all duration-300" />
        </div>
      </Carousel>

      {/* Fixed text content overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center w-full text-white"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="inline-flex items-center justify-center size-16 rounded-full bg-white/10 mb-6"
            >
              <CpuIcon className="size-8 text-white" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6 leading-tight"
            >
              Premium Electronics for{" "}
              <span className="text-white relative">
                Home & Office
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1, delay: 1.2 }}
                  className="absolute -bottom-2 left-0 h-1 bg-white/30"
                />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="text-lg md:text-xl lg:text-2xl mb-8 md:mb-10 max-w-3xl mx-auto text-white/90"
            >
              High-end electronics.
              <br /> Computers, laptops, gaming equipment and more
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center pointer-events-auto"
            >
              <Link href="/catalogue">
                <Button
                  size="lg"
                  variant={"outline"}
                  className="w-48 bg-transparent backdrop-blur-xs py-6 text-lg hover:scale-105"
                >
                  Explore
                  <Sparkles className="ml-2 size-5" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
