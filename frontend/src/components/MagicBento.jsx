import { useRef, useEffect, useCallback, useState } from 'react';
import React from 'react';
import { gsap } from 'gsap';
import './MagicBento.css';

const DEFAULT_PARTICLE_COUNT = 12;
const DEFAULT_SPOTLIGHT_RADIUS = 300;
const DEFAULT_GLOW_COLOR = '132, 0, 255';
const MOBILE_BREAKPOINT = 768;

const cardData = [
  { color: '#060010', title: 'Analytics', description: 'Track user behavior', label: 'Insights' },
  { color: '#060010', title: 'Dashboard', description: 'Centralized data view', label: 'Overview' },
  { color: '#060010', title: 'Collaboration', description: 'Work together seamlessly', label: 'Teamwork' },
  { color: '#060010', title: 'Automation', description: 'Streamline workflows', label: 'Efficiency' },
  { color: '#060010', title: 'Integration', description: 'Connect favorite tools', label: 'Connectivity' },
  { color: '#060010', title: 'Security', description: 'Enterprise-grade protection', label: 'Protection' },
];

const createParticleElement = (x, y, color = DEFAULT_GLOW_COLOR) => {
  const el = document.createElement('div');
  el.className = 'particle';
  el.style.cssText = `
    position: absolute; width: 4px; height: 4px; border-radius: 50%;
    background: rgba(${color}, 1); box-shadow: 0 0 6px rgba(${color}, 0.6);
    pointer-events: none; z-index: 100; left: ${x}px; top: ${y}px;
  `;
  return el;
};

const calculateSpotlightValues = radius => ({
  proximity: radius * 0.5,
  fadeDistance: radius * 0.75,
});

const updateCardGlowProperties = (card, mouseX, mouseY, glow, radius) => {
  const rect = card.getBoundingClientRect();
  const relativeX = ((mouseX - rect.left) / rect.width) * 100;
  const relativeY = ((mouseY - rect.top) / rect.height) * 100;
  card.style.setProperty('--glow-x', `${relativeX}%`);
  card.style.setProperty('--glow-y', `${relativeY}%`);
  card.style.setProperty('--glow-intensity', glow.toString());
  card.style.setProperty('--glow-radius', `${radius}px`);
};

// Applies click ripple + optional tilt/magnetism to a div via callback ref
const useCardEffects = ({ clickEffect, enableTilt, enableMagnetism, glowColor, disableAnimations }) => {
  return useCallback(
    (el) => {
      if (!el || disableAnimations) return;
      const handleMouseMove = (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        if (enableTilt) {
          gsap.to(el, { rotateX: ((y - cy) / cy) * -10, rotateY: ((x - cx) / cx) * 10, duration: 0.1, ease: 'power2.out', transformPerspective: 1000 });
        }
        if (enableMagnetism) {
          gsap.to(el, { x: (x - cx) * 0.05, y: (y - cy) * 0.05, duration: 0.3, ease: 'power2.out' });
        }
      };
      const handleMouseLeave = () => {
        if (enableTilt) gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.3, ease: 'power2.out' });
        if (enableMagnetism) gsap.to(el, { x: 0, y: 0, duration: 0.3, ease: 'power2.out' });
      };
      const handleClick = (e) => {
        if (!clickEffect) return;
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const maxD = Math.max(Math.hypot(x, y), Math.hypot(x - rect.width, y), Math.hypot(x, y - rect.height), Math.hypot(x - rect.width, y - rect.height));
        const ripple = document.createElement('div');
        ripple.style.cssText = `position:absolute;width:${maxD*2}px;height:${maxD*2}px;border-radius:50%;background:radial-gradient(circle,rgba(${glowColor},0.4) 0%,rgba(${glowColor},0.2) 30%,transparent 70%);left:${x-maxD}px;top:${y-maxD}px;pointer-events:none;z-index:1000;`;
        el.appendChild(ripple);
        gsap.fromTo(ripple, { scale: 0, opacity: 1 }, { scale: 1, opacity: 0, duration: 0.8, ease: 'power2.out', onComplete: () => ripple.remove() });
      };
      el.addEventListener('mousemove', handleMouseMove);
      el.addEventListener('mouseleave', handleMouseLeave);
      el.addEventListener('click', handleClick);
      return () => {
        el.removeEventListener('mousemove', handleMouseMove);
        el.removeEventListener('mouseleave', handleMouseLeave);
        el.removeEventListener('click', handleClick);
      };
    },
    [clickEffect, enableTilt, enableMagnetism, glowColor, disableAnimations]
  );
};

const ParticleCard = ({ children, className = '', disableAnimations = false, style, particleCount = DEFAULT_PARTICLE_COUNT, glowColor = DEFAULT_GLOW_COLOR, enableTilt = true, clickEffect = false, enableMagnetism = false }) => {
  const cardRef = useRef(null);
  const particlesRef = useRef([]);
  const timeoutsRef = useRef([]);
  const isHoveredRef = useRef(false);
  const memoizedParticles = useRef([]);
  const particlesInitialized = useRef(false);
  const magnetismAnimationRef = useRef(null);

  const initializeParticles = useCallback(() => {
    if (particlesInitialized.current || !cardRef.current) return;
    const { width, height } = cardRef.current.getBoundingClientRect();
    memoizedParticles.current = Array.from({ length: particleCount }, () =>
      createParticleElement(Math.random() * width, Math.random() * height, glowColor)
    );
    particlesInitialized.current = true;
  }, [particleCount, glowColor]);

  const clearAllParticles = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    magnetismAnimationRef.current?.kill();
    particlesRef.current.forEach(particle => {
      gsap.to(particle, { scale: 0, opacity: 0, duration: 0.3, ease: 'back.in(1.7)', onComplete: () => particle.parentNode?.removeChild(particle) });
    });
    particlesRef.current = [];
  }, []);

  const animateParticles = useCallback(() => {
    if (!cardRef.current || !isHoveredRef.current) return;
    if (!particlesInitialized.current) initializeParticles();
    memoizedParticles.current.forEach((particle, index) => {
      const id = setTimeout(() => {
        if (!isHoveredRef.current || !cardRef.current) return;
        const clone = particle.cloneNode(true);
        cardRef.current.appendChild(clone);
        particlesRef.current.push(clone);
        gsap.fromTo(clone, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' });
        gsap.to(clone, { x: (Math.random()-0.5)*100, y: (Math.random()-0.5)*100, rotation: Math.random()*360, duration: 2+Math.random()*2, ease: 'none', repeat: -1, yoyo: true });
        gsap.to(clone, { opacity: 0.3, duration: 1.5, ease: 'power2.inOut', repeat: -1, yoyo: true });
      }, index * 100);
      timeoutsRef.current.push(id);
    });
  }, [initializeParticles]);

  useEffect(() => {
    if (disableAnimations || !cardRef.current) return;
    const el = cardRef.current;
    const onEnter = () => { isHoveredRef.current = true; animateParticles(); if (enableTilt) gsap.to(el, { rotateX: 5, rotateY: 5, duration: 0.3, ease: 'power2.out', transformPerspective: 1000 }); };
    const onLeave = () => {
      isHoveredRef.current = false; clearAllParticles();
      if (enableTilt) gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.3, ease: 'power2.out' });
      if (enableMagnetism) gsap.to(el, { x: 0, y: 0, duration: 0.3, ease: 'power2.out' });
    };
    const onMove = (e) => {
      if (!enableTilt && !enableMagnetism) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left; const y = e.clientY - rect.top;
      const cx = rect.width/2; const cy = rect.height/2;
      if (enableTilt) gsap.to(el, { rotateX: ((y-cy)/cy)*-10, rotateY: ((x-cx)/cx)*10, duration: 0.1, ease: 'power2.out', transformPerspective: 1000 });
      if (enableMagnetism) { magnetismAnimationRef.current = gsap.to(el, { x: (x-cx)*0.05, y: (y-cy)*0.05, duration: 0.3, ease: 'power2.out' }); }
    };
    const onClick = (e) => {
      if (!clickEffect) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX-rect.left; const y = e.clientY-rect.top;
      const maxD = Math.max(Math.hypot(x,y), Math.hypot(x-rect.width,y), Math.hypot(x,y-rect.height), Math.hypot(x-rect.width,y-rect.height));
      const ripple = document.createElement('div');
      ripple.style.cssText = `position:absolute;width:${maxD*2}px;height:${maxD*2}px;border-radius:50%;background:radial-gradient(circle,rgba(${glowColor},0.4) 0%,rgba(${glowColor},0.2) 30%,transparent 70%);left:${x-maxD}px;top:${y-maxD}px;pointer-events:none;z-index:1000;`;
      el.appendChild(ripple);
      gsap.fromTo(ripple, { scale:0, opacity:1 }, { scale:1, opacity:0, duration:0.8, ease:'power2.out', onComplete:()=>ripple.remove() });
    };
    el.addEventListener('mouseenter', onEnter); el.addEventListener('mouseleave', onLeave);
    el.addEventListener('mousemove', onMove); el.addEventListener('click', onClick);
    return () => { isHoveredRef.current = false; el.removeEventListener('mouseenter', onEnter); el.removeEventListener('mouseleave', onLeave); el.removeEventListener('mousemove', onMove); el.removeEventListener('click', onClick); clearAllParticles(); };
  }, [animateParticles, clearAllParticles, disableAnimations, enableTilt, enableMagnetism, clickEffect, glowColor]);

  return <div ref={cardRef} className={`${className} particle-container`} style={{ ...style, position: 'relative', overflow: 'hidden' }}>{children}</div>;
};

const GlobalSpotlight = ({ gridRef, disableAnimations = false, enabled = true, spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS, glowColor = DEFAULT_GLOW_COLOR }) => {
  const spotlightRef = useRef(null);
  useEffect(() => {
    if (disableAnimations || !gridRef?.current || !enabled) return;
    const spotlight = document.createElement('div');
    spotlight.className = 'global-spotlight';
    spotlight.style.cssText = `position:fixed;width:800px;height:800px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,rgba(${glowColor},0.15) 0%,rgba(${glowColor},0.08) 15%,rgba(${glowColor},0.04) 25%,rgba(${glowColor},0.02) 40%,rgba(${glowColor},0.01) 65%,transparent 70%);z-index:200;opacity:0;transform:translate(-50%,-50%);mix-blend-mode:screen;`;
    document.body.appendChild(spotlight);
    spotlightRef.current = spotlight;
    const handleMouseMove = (e) => {
      if (!spotlightRef.current || !gridRef.current) return;
      const section = gridRef.current.closest('.bento-section') || gridRef.current;
      const rect = section?.getBoundingClientRect();
      const inside = rect && e.clientX>=rect.left && e.clientX<=rect.right && e.clientY>=rect.top && e.clientY<=rect.bottom;
      const cards = gridRef.current.querySelectorAll('.magic-bento-card');
      if (!inside) { gsap.to(spotlightRef.current,{opacity:0,duration:0.3,ease:'power2.out'}); cards.forEach(c=>c.style.setProperty('--glow-intensity','0')); return; }
      const { proximity, fadeDistance } = calculateSpotlightValues(spotlightRadius);
      let minDist = Infinity;
      cards.forEach(card => {
        const cr = card.getBoundingClientRect();
        const cx = cr.left+cr.width/2; const cy = cr.top+cr.height/2;
        const dist = Math.max(0, Math.hypot(e.clientX-cx, e.clientY-cy) - Math.max(cr.width,cr.height)/2);
        minDist = Math.min(minDist, dist);
        const gi = dist<=proximity ? 1 : dist<=fadeDistance ? (fadeDistance-dist)/(fadeDistance-proximity) : 0;
        updateCardGlowProperties(card, e.clientX, e.clientY, gi, spotlightRadius);
      });
      gsap.to(spotlightRef.current,{left:e.clientX,top:e.clientY,duration:0.1,ease:'power2.out'});
      const targetOpacity = minDist<=proximity ? 0.8 : minDist<=fadeDistance ? ((fadeDistance-minDist)/(fadeDistance-proximity))*0.8 : 0;
      gsap.to(spotlightRef.current,{opacity:targetOpacity,duration:targetOpacity>0?0.2:0.5,ease:'power2.out'});
    };
    const handleMouseLeave = () => {
      gridRef.current?.querySelectorAll('.magic-bento-card').forEach(c=>c.style.setProperty('--glow-intensity','0'));
      if (spotlightRef.current) gsap.to(spotlightRef.current,{opacity:0,duration:0.3,ease:'power2.out'});
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => { document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseleave', handleMouseLeave); spotlightRef.current?.parentNode?.removeChild(spotlightRef.current); };
  }, [gridRef, disableAnimations, enabled, spotlightRadius, glowColor]);
  return null;
};

const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    check(); window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
};

// Named export: wrap any content with bento card effects
export function MagicBentoCard({ children, className = '', style, glowColor = DEFAULT_GLOW_COLOR, enableBorderGlow = true, clickEffect = true, enableStars = false, particleCount = DEFAULT_PARTICLE_COUNT, enableTilt = false, enableMagnetism = false, disableAnimations = false }) {
  const cls = ['magic-bento-card', enableBorderGlow ? 'magic-bento-card--border-glow' : '', className].filter(Boolean).join(' ');
  const stl = { '--glow-color': glowColor, ...style };
  if (enableStars) {
    return <ParticleCard className={cls} style={stl} disableAnimations={disableAnimations} particleCount={particleCount} glowColor={glowColor} enableTilt={enableTilt} clickEffect={clickEffect} enableMagnetism={enableMagnetism}>{children}</ParticleCard>;
  }
  const cardRef = useRef(null);
  useEffect(() => {
    const el = cardRef.current; if (!el || disableAnimations) return;
    const onClick = (e) => {
      if (!clickEffect) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX-rect.left; const y = e.clientY-rect.top;
      const maxD = Math.max(Math.hypot(x,y), Math.hypot(x-rect.width,y), Math.hypot(x,y-rect.height), Math.hypot(x-rect.width,y-rect.height));
      const ripple = document.createElement('div');
      ripple.style.cssText = `position:absolute;width:${maxD*2}px;height:${maxD*2}px;border-radius:50%;background:radial-gradient(circle,rgba(${glowColor},0.4) 0%,rgba(${glowColor},0.2) 30%,transparent 70%);left:${x-maxD}px;top:${y-maxD}px;pointer-events:none;z-index:1000;`;
      el.appendChild(ripple);
      gsap.fromTo(ripple, { scale:0, opacity:1 }, { scale:1, opacity:0, duration:0.8, ease:'power2.out', onComplete:()=>ripple.remove() });
    };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, [clickEffect, glowColor, disableAnimations]);
  return <div ref={cardRef} className={cls} style={stl}>{children}</div>;
}

const MagicBento = ({
  children,
  gridClassName,
  textAutoHide = true,
  enableStars = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  disableAnimations = false,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  particleCount = DEFAULT_PARTICLE_COUNT,
  enableTilt = false,
  glowColor = DEFAULT_GLOW_COLOR,
  clickEffect = true,
  enableMagnetism = true,
}) => {
  const gridRef = useRef(null);
  const isMobile = useMobileDetection();
  const shouldDisable = disableAnimations || isMobile;
  const gc = glowColor || DEFAULT_GLOW_COLOR;

  const renderCard = (content, key, extraClassName = '') => {
    const cls = ['magic-bento-card', textAutoHide ? 'magic-bento-card--text-autohide' : '', enableBorderGlow ? 'magic-bento-card--border-glow' : '', extraClassName].filter(Boolean).join(' ');
    if (enableStars) {
      return <ParticleCard key={key} className={cls} style={{ '--glow-color': gc }} disableAnimations={shouldDisable} particleCount={particleCount} glowColor={gc} enableTilt={enableTilt} clickEffect={clickEffect} enableMagnetism={enableMagnetism}>{content}</ParticleCard>;
    }
    return (
      <div key={key} className={cls} style={{ '--glow-color': gc }}
        ref={el => {
          if (!el || shouldDisable) return;
          const onClick = (e) => {
            if (!clickEffect) return;
            const rect = el.getBoundingClientRect();
            const x = e.clientX-rect.left; const y = e.clientY-rect.top;
            const maxD = Math.max(Math.hypot(x,y), Math.hypot(x-rect.width,y), Math.hypot(x,y-rect.height), Math.hypot(x-rect.width,y-rect.height));
            const ripple = document.createElement('div');
            ripple.style.cssText = `position:absolute;width:${maxD*2}px;height:${maxD*2}px;border-radius:50%;background:radial-gradient(circle,rgba(${gc},0.4) 0%,rgba(${gc},0.2) 30%,transparent 70%);left:${x-maxD}px;top:${y-maxD}px;pointer-events:none;z-index:1000;`;
            el.appendChild(ripple);
            gsap.fromTo(ripple,{scale:0,opacity:1},{scale:1,opacity:0,duration:0.8,ease:'power2.out',onComplete:()=>ripple.remove()});
          };
          el.addEventListener('click', onClick);
        }}
      >{content}</div>
    );
  };

  const cards = children
    ? React.Children.map(children, (child, i) => {
        if (!React.isValidElement(child)) return child;
        return renderCard(React.cloneElement(child, { className: undefined }), i, child.props.className || '');
      })
    : cardData.map((card, i) => renderCard(
        <>
          <div className="magic-bento-card__header"><div className="magic-bento-card__label">{card.label}</div></div>
          <div className="magic-bento-card__content"><h2 className="magic-bento-card__title">{card.title}</h2><p className="magic-bento-card__description">{card.description}</p></div>
        </>,
        i
      ));

  return (
    <>
      {enableSpotlight && <GlobalSpotlight gridRef={gridRef} disableAnimations={shouldDisable} enabled={enableSpotlight} spotlightRadius={spotlightRadius} glowColor={gc} />}
      <div className={`bento-section ${gridClassName || 'card-grid'}`} ref={gridRef}>{cards}</div>
    </>
  );
};

export default MagicBento;
