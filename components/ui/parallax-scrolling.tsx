'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';

export function ParallaxComponent() {
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const triggerElement = parallaxRef.current?.querySelector('[data-parallax-layers]');

    if (triggerElement) {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: triggerElement,
          start: '0% 0%',
          end: '100% 0%',
          scrub: 0,
        },
      });

      const layers = [
        { layer: '1', yPercent: 70 },
        { layer: '2', yPercent: 55 },
        { layer: '3', yPercent: 40 },
        { layer: '4', yPercent: 10 },
      ];

      layers.forEach((layerObj, idx) => {
        tl.to(
          triggerElement.querySelectorAll(`[data-parallax-layer="${layerObj.layer}"]`),
          { yPercent: layerObj.yPercent, ease: 'none' },
          idx === 0 ? undefined : '<',
        );
      });
    }

    const lenis = new Lenis();
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);

    return () => {
      ScrollTrigger.getAll().forEach(st => st.kill());
      if (triggerElement) gsap.killTweensOf(triggerElement);
      lenis.destroy();
    };
  }, []);

  return (
    <div ref={parallaxRef} className="parallax">
      <section className="parallax__header">
        <div className="parallax__visuals">
          <div className="parallax__black-line-overflow" />
          <div data-parallax-layers className="parallax__layers">
            {/* Background layer */}
            <img
              src="/images/hero-action.jpg"
              loading="eager"
              width={800}
              data-parallax-layer="1"
              alt="BJJ Training"
              className="parallax__layer-img"
            />
            {/* Mid layer */}
            <img
              src="/images/nogi-training.jpg"
              loading="eager"
              width={800}
              data-parallax-layer="2"
              alt="No-Gi Training"
              className="parallax__layer-img"
            />
            {/* Title layer */}
            <div data-parallax-layer="3" className="parallax__layer-title">
              <h2 className="parallax__title">AXIS<br />Jiu&#8209;Jitsu</h2>
            </div>
            {/* Foreground layer */}
            <img
              src="/images/coach-portrait.jpg"
              loading="eager"
              width={800}
              data-parallax-layer="4"
              alt="Head Coach"
              className="parallax__layer-img"
            />
          </div>
          <div className="parallax__fade" />
        </div>
      </section>
    </div>
  );
}
