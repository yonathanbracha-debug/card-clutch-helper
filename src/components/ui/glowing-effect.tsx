import { memo, useCallback, useEffect, useRef } from "react";
import { animate } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlowingEffectProps {
  blur?: number;
  inactiveZone?: number;
  proximity?: number;
  spread?: number;
  variant?: "default" | "white";
  glow?: boolean;
  className?: string;
  disabled?: boolean;
  movementDuration?: number;
  borderWidth?: number;
}

const GlowingEffect = memo(
  ({
    blur = 0,
    inactiveZone = 0.7,
    proximity = 0,
    spread = 20,
    variant = "default",
    glow = false,
    className,
    movementDuration = 2,
    borderWidth = 1,
    disabled = false,
  }: GlowingEffectProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const lastPosition = useRef({ x: 0, y: 0 });
    const animationFrameRef = useRef<number>(0);

    const handleMove = useCallback(
      (e?: MouseEvent | { x: number; y: number }) => {
        if (!containerRef.current) return;

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        animationFrameRef.current = requestAnimationFrame(() => {
          const element = containerRef.current;
          if (!element) return;

          const { left, top, width, height } = element.getBoundingClientRect();
          const mouseX = e?.x ?? lastPosition.current.x;
          const mouseY = e?.y ?? lastPosition.current.y;

          if (e) {
            lastPosition.current = { x: mouseX, y: mouseY };
          }

          const center = [left + width * 0.5, top + height * 0.5];
          const distanceFromCenter = Math.hypot(
            mouseX - center[0],
            mouseY - center[1]
          );
          const inactiveRadius =
            0.5 * Math.min(width, height) * inactiveZone;

          if (distanceFromCenter < inactiveRadius) {
            element.style.setProperty("--active", "0");
            return;
          }

          const isActive =
            mouseX > left - proximity &&
            mouseX < left + width + proximity &&
            mouseY > top - proximity &&
            mouseY < top + height + proximity;

          element.style.setProperty("--active", isActive ? "1" : "0");

          if (!isActive) return;

          const currentAngle =
            parseFloat(element.style.getPropertyValue("--start")) || 0;
          let targetAngle =
            (180 * Math.atan2(mouseY - center[1], mouseX - center[0])) /
              Math.PI +
            90;

          const angleDiff = ((targetAngle - currentAngle + 180) % 360) - 180;
          const newAngle = currentAngle + angleDiff;

          animate(currentAngle, newAngle, {
            duration: movementDuration,
            ease: [0.16, 1, 0.3, 1],
            onUpdate: (value) => {
              element.style.setProperty("--start", String(value));
            },
          });
        });
      },
      [inactiveZone, proximity, movementDuration]
    );

    useEffect(() => {
      if (disabled) return;

      const handleScroll = () => handleMove();
      const handlePointerMove = (e: PointerEvent) =>
        handleMove({ x: e.clientX, y: e.clientY });

      window.addEventListener("scroll", handleScroll, { passive: true });
      document.body.addEventListener("pointermove", handlePointerMove, {
        passive: true,
      });

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        window.removeEventListener("scroll", handleScroll);
        document.body.removeEventListener("pointermove", handlePointerMove);
      };
    }, [handleMove, disabled]);

    return (
      <>
        <div
          className={cn(
            "pointer-events-none absolute -inset-px hidden rounded-[inherit] border opacity-0 transition-opacity duration-300 [--active:0] [--start:0] [border-image:linear-gradient(from_calc(var(--start)*1deg),hsl(var(--primary)/calc(var(--active)*0.8)),transparent_10%,transparent_50%,hsl(var(--primary)/calc(var(--active)*0.8)))_1] md:block",
            glow &&
              "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:[background:radial-gradient(250px_circle_at_var(--x)_var(--y),hsl(var(--primary)/0.15),transparent_65%)]",
            variant === "white" &&
              "[border-image:linear-gradient(from_calc(var(--start)*1deg),white,transparent_10%,transparent_50%,white)_1]",
            className
          )}
          ref={containerRef}
          style={
            {
              "--blur": `${blur}px`,
              "--spread": spread,
              "--start": "0",
              "--active": "0",
              "--glow-border-width": `${borderWidth}px`,
              opacity: "var(--active)",
            } as React.CSSProperties
          }
        />
        <div
          className={cn(
            "pointer-events-none absolute -inset-px hidden rounded-[inherit] opacity-0 blur-[var(--blur)] transition-opacity duration-300 [--active:0] [--start:0] [background:conic-gradient(from_calc(var(--start)*1deg),hsl(var(--primary)/calc(var(--active)*0.5)),transparent_10%,transparent_50%,hsl(var(--primary)/calc(var(--active)*0.5)))] md:block",
            variant === "white" &&
              "[background:conic-gradient(from_calc(var(--start)*1deg),white,transparent_10%,transparent_50%,white)]",
            className
          )}
          style={
            {
              "--blur": `${blur}px`,
              "--spread": spread,
              "--start": "0",
              "--active": "0",
              opacity: "var(--active)",
            } as React.CSSProperties
          }
        />
      </>
    );
  }
);

GlowingEffect.displayName = "GlowingEffect";

export { GlowingEffect };
