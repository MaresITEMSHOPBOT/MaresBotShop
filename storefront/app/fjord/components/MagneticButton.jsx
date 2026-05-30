import { useRef } from 'react';
import gsap from 'gsap';

// Tlačítko s „magnetickým“ efektem — jemně se naklání k pohybu kurzoru.
export function MagneticButton({ as: Tag = 'button', strength = 0.4, className = '', children, ...props }) {
  const ref = useRef();

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    gsap.to(el, { x: x * strength, y: y * strength, duration: 0.4, ease: 'power3.out' });
  };

  const onLeave = () => {
    if (ref.current) gsap.to(ref.current, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
  };

  return (
    <Tag ref={ref} className={className} onMouseMove={onMove} onMouseLeave={onLeave} {...props}>
      {children}
    </Tag>
  );
}
