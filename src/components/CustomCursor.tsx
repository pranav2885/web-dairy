import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';

export type CursorStyle = 'default' | 'smooth' | 'elastic' | 'bouncy';
export type CursorSize = 'small' | 'medium' | 'large';
export type CursorTheme = 'light' | 'dark' | 'primary' | 'gradient' | 'auto';

interface CustomCursorProps {
  cursorStyle?: CursorStyle;
  cursorSize?: CursorSize;
  cursorTheme?: CursorTheme;
  speedSensitivity?: number; // 1-10, higher = more sensitive to speed
  enabled?: boolean;
}

interface CursorState {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  isHovering: boolean;
}

export function CustomCursor({
  cursorStyle = 'elastic',
  cursorSize = 'medium',
  cursorTheme = 'auto',
  speedSensitivity = 5,
  enabled = true,
}: CustomCursorProps) {
  const { resolvedTheme } = useTheme();
  const [cursor, setCursor] = useState<CursorState>({
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    isHovering: false,
  });

  const lastPos = useRef({ x: 0, y: 0, time: Date.now() });
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!enabled) {
      // Restore default cursor
      document.body.style.cursor = 'auto';
      const elements = document.querySelectorAll('*');
      elements.forEach(el => {
        (el as HTMLElement).style.cursor = '';
      });
      return;
    }

    // Hide default cursor globally
    document.body.style.cursor = 'none';
    const style = document.createElement('style');
    style.id = 'custom-cursor-styles';
    style.innerHTML = `
      * {
        cursor: none !important;
      }
    `;
    document.head.appendChild(style);

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      const deltaTime = now - lastPos.current.time;
      const deltaX = e.clientX - lastPos.current.x;
      const deltaY = e.clientY - lastPos.current.y;
      
      // Calculate speed
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const speed = deltaTime > 0 ? distance / deltaTime : 0;
      
      // Calculate angle
      const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
      
      // Check if hovering over clickable element
      const target = e.target as HTMLElement;
      let isHovering = false;
      
      if (target) {
        const tagName = target.tagName.toLowerCase();
        const computedStyle = window.getComputedStyle(target);
        
        if (
          tagName === 'button' ||
          tagName === 'a' ||
          target.hasAttribute('onclick') ||
          computedStyle.cursor === 'pointer' ||
          target.role === 'button'
        ) {
          isHovering = true;
        }
      }
      
      // Update cursor with elastic/fluid behavior
      const speedFactor = Math.min(speed * speedSensitivity, 10);
      const scaleChange = cursorStyle === 'elastic' ? 1 + speedFactor * 0.15 : 1;
      const rotation = cursorStyle === 'elastic' || cursorStyle === 'bouncy' ? angle : 0;
      
      // Expand slightly when hovering
      const hoverScale = isHovering ? 1.5 : 1;
      
      setCursor({
        x: e.clientX,
        y: e.clientY,
        scale: scaleChange * hoverScale,
        rotation,
        isHovering,
      });
      
      lastPos.current = { x: e.clientX, y: e.clientY, time: now };
    };

    const handleMouseDown = () => {
      setCursor(prev => ({
        ...prev,
        scale: prev.scale * 0.85,
      }));
    };

    const handleMouseUp = () => {
      setCursor(prev => ({
        ...prev,
        scale: prev.isHovering ? 1.5 : 1,
      }));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.body.style.cursor = 'auto';
      const styleEl = document.getElementById('custom-cursor-styles');
      if (styleEl) styleEl.remove();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [enabled, cursorStyle, speedSensitivity]);

  if (!enabled) return null;

  // Size configurations
  const sizeMap = {
    small: { main: 12, dot: 4 },
    medium: { main: 20, dot: 6 },
    large: { main: 28, dot: 8 },
  };

  const size = sizeMap[cursorSize];

  // Determine effective theme based on cursorTheme and resolvedTheme
  const effectiveTheme = cursorTheme === 'auto' 
    ? (resolvedTheme === 'dark' ? 'dark' : 'light')
    : cursorTheme;

  // Theme configurations - adapts to light/dark mode
  const themeColors = {
    light: 'rgba(26, 26, 26, 0.6)',
    dark: 'rgba(242, 242, 242, 0.7)',
    primary: 'rgba(99, 102, 241, 0.5)', // Indigo - visible in both modes
    gradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.5), rgba(139, 92, 246, 0.5))',
    auto: 'rgba(99, 102, 241, 0.6)', // Bright indigo for visibility in both modes
  };

  const themeBorderColors = {
    light: 'rgba(26, 26, 26, 0.8)',
    dark: 'rgba(242, 242, 242, 0.9)',
    primary: 'rgba(99, 102, 241, 0.9)', // Indigo border
    gradient: 'rgba(99, 102, 241, 0.9)',
    auto: 'rgba(99, 102, 241, 0.95)', // Strong indigo border for both modes
  };

  const themeDotColors = {
    light: 'rgba(26, 26, 26, 0.9)',
    dark: 'rgba(242, 242, 242, 1)',
    primary: 'rgba(99, 102, 241, 1)', // Solid indigo
    gradient: 'rgba(139, 92, 246, 1)',
    auto: 'rgba(99, 102, 241, 1)', // Bright indigo dot for both modes
  };

  // Animation class based on style - faster for instant response
  const animationClass = {
    default: 'transition-transform duration-0',
    smooth: 'transition-transform duration-75 ease-out',
    elastic: 'transition-transform duration-100 ease-out',
    bouncy: 'transition-transform duration-50 ease-out',
  }[cursorStyle];

  return (
    <>
      {/* Main cursor circle - expands on hover */}
      <div
        className={cn('fixed pointer-events-none rounded-full border-2 transition-all duration-150', animationClass)}
        style={{
          left: cursor.x,
          top: cursor.y,
          width: size.main,
          height: size.main,
          transform: `translate(-50%, -50%) scale(${cursor.scale}) rotate(${cursor.rotation}deg)`,
          borderColor: themeBorderColors[effectiveTheme],
          background: cursor.isHovering ? themeColors[effectiveTheme] : 'transparent',
          zIndex: 9999,
        }}
      />

      {/* Center dot - follows instantly */}
      <div
        className="fixed pointer-events-none rounded-full"
        style={{
          left: cursor.x,
          top: cursor.y,
          width: size.dot,
          height: size.dot,
          transform: `translate(-50%, -50%)`,
          background: themeDotColors[effectiveTheme],
          zIndex: 10000,
          transition: 'none',
        }}
      />
    </>
  );
}

// Hook for easy cursor configuration
export function useCursorConfig() {
  const [config, setConfig] = useState<CustomCursorProps>({
    cursorStyle: 'elastic',
    cursorSize: 'medium',
    cursorTheme: 'primary',
    speedSensitivity: 5,
    enabled: true,
  });

  return { config, setConfig };
}
