"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Flex } from "./flex";

interface CoachCardProps {
  className?: string;
}

const BELTS = [
  { label: "White", color: "#e5e7eb", border: false },
  { label: "Blue", color: "#1d4ed8", border: false },
  { label: "Purple", color: "#7c3aed", border: false },
  { label: "Brown", color: "#78350f", border: false },
  { label: "Black", color: "#111111", border: true },
];

const CoachInfo = ({ title, name, subtitle, description }: {
  title: string
  name: string
  subtitle: string
  description: string
}) => (
  <Flex direction="col" gap="md">
    <div className="flex items-center gap-3 mb-2">
      <span className="h-px w-10 bg-primary" />
      <span className="text-xs font-bold uppercase tracking-widest text-primary">
        {title}
      </span>
    </div>
    <h2 className="text-3xl sm:text-4xl font-black leading-tight text-foreground">
      {name}
    </h2>
    <p className="text-xs font-semibold uppercase tracking-wider text-primary/80">
      {subtitle}
    </p>
    <p className="text-sm text-muted-foreground">
      {description}
    </p>
    <Flex gap="xs" className="w-full">
      {BELTS.map((belt) => (
        <div
          key={belt.label}
          title={`${belt.label} Belt`}
          className="h-2 flex-1 rounded-sm"
          style={{
            background: belt.color,
            border: belt.border ? "1px solid oklch(58% 0.21 28)" : undefined,
          }}
        />
      ))}
    </Flex>
  </Flex>
);

const CoachPhoto = ({ src, alt }: { src: string; alt: string }) => (
  <motion.div
    initial={{ opacity: 0, x: -16 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5 }}
    className="relative z-10 w-[360px] h-[460px] flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl"
  >
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover object-top"
      sizes="360px"
      priority
    />
  </motion.div>
);

const CoachCard = ({ className }: CoachCardProps) => (
  <div className={cn("w-full", className)}>
    {/* Desktop: photo LEFT overlapping card RIGHT */}
    <div className="hidden md:flex items-center">
      <CoachPhoto src="/images/coach-portrait.jpg" alt="Shamsudin Baisarov — Head Coach AXIS Jiu-Jitsu Vienna" />
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex-1 bg-background rounded-2xl shadow-xl border border-border/40 p-8 pl-24 ml-[-80px]"
      >
        <CoachInfo
          title="Head Coach · Black Belt"
          name="SHAMSUDIN BAISAROV"
          subtitle="Erster tschetschenischer BJJ-Schwarzgurt Österreichs"
          description="Mit jahrelanger Erfahrung auf internationalem Niveau leitet Shamsudin das Training bei AXIS Jiu-Jitsu. Seine Philosophie: Technik, Disziplin und Respekt — auf und abseits der Matte."
        />
      </motion.div>
    </div>

    {/* Mobile: stacked */}
    <div className="md:hidden">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-xl mb-6"
      >
        <Image
          src="/images/coach-portrait.jpg"
          alt="Shamsudin Baisarov — Head Coach AXIS Jiu-Jitsu Vienna"
          width={400}
          height={533}
          className="w-full h-full object-cover object-top"
          priority
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="bg-background rounded-2xl shadow-xl border border-border/40 p-6"
      >
        <CoachInfo
          title="Head Coach · Black Belt"
          name="SHAMSUDIN BAISAROV"
          subtitle="Erster tschetschenischer BJJ-Schwarzgurt Österreichs"
          description="Mit jahrelanger Erfahrung auf internationalem Niveau leitet Shamsudin das Training bei AXIS Jiu-Jitsu. Technik, Disziplin und Respekt — auf und abseits der Matte."
        />
      </motion.div>
    </div>
  </div>
);

export { CoachCard }
