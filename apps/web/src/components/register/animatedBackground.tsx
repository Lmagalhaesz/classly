import { useEffect, useRef } from "react";

export default function AnimatedBackground() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      const cursor = cursorRef.current;
      if (cursor) {
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
      }
    };

    window.addEventListener("mousemove", moveCursor);
    return () => window.removeEventListener("mousemove", moveCursor);
  }, []);

  return (
    <>
      <div className="animated-bg">
        <div className="grid-overlay" />
        <div className="glow-layer" />
        <div ref={cursorRef} className="cursor-glow" />
      </div>

      <style jsx>{`

        .animated-bg {
          position: fixed;
          top: 0;
          left: 0;
          z-index: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(
            ellipse at center,
            #ffffff 0%,
            #f2f2f2 100%
          );
          overflow: hidden;
        }

        .grid-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 200%;
          height: 200%;
          background-image:
            linear-gradient(0deg, rgba(255, 165, 0, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 165, 0, 0.05) 1px, transparent 1px);
          background-size: 60px 60px;
          animation: moveGrid 60s linear infinite;
        }

        .glow-layer {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(
            circle,
            rgba(255, 106, 0, 0.12),
            transparent 70%
          );
          animation: rotateGlow 120s linear infinite;
          filter: blur(80px);
          mix-blend-mode: screen;
        }

        .cursor-glow {
          position: fixed;
          width: 360px;
          height: 360px;
          pointer-events: none;
          background: radial-gradient(
            circle,
            rgba(255, 94, 0, 0.6),
            rgba(255, 140, 0, 0.5),
            rgba(255, 200, 100, 0.3),
            transparent 80%
          );
          filter: blur(70px);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          z-index: 1;
          mix-blend-mode: screen;
          transition: transform 0.03s ease-out;
          animation: pulseGlow 2s infinite ease-in-out;
        }

        @keyframes pulseGlow {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.05);
            opacity: 0.9;
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
        }

        @keyframes moveGrid {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(-60px, -60px);
          }
        }

        @keyframes rotateGlow {
          0% {
            transform: rotate(0deg) scale(1);
          }
          100% {
            transform: rotate(360deg) scale(1);
          }
        }
      `}</style>
    </>
  );
}
