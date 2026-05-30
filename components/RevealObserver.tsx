'use client';
import { useEffect } from 'react';

export default function RevealObserver() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -240px 0px' }
    );

    function observe(root: Document | Element) {
      root.querySelectorAll('.reveal:not(.in-view)').forEach(el => io.observe(el));
    }

    observe(document);

    // Pick up .reveal elements added after initial mount (streaming / lazy components)
    const mo = new MutationObserver(mutations => {
      for (const m of mutations) {
        m.addedNodes.forEach(node => {
          if (!(node instanceof Element)) return;
          if (node.classList.contains('reveal')) io.observe(node);
          observe(node);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => { io.disconnect(); mo.disconnect(); };
  }, []);
  return null;
}
