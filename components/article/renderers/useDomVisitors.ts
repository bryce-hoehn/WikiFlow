import { DEFAULT_SELECTORS_TO_REMOVE, removeElement, selectAll } from '@/utils/articleParsing';
import type { Element } from 'domhandler';
import { useEffect, useState } from 'react';

let activeBatchProcessing = false;
let activeRafId: number | null = null;

const processDom = (element: Element | null | undefined) => {
  if (!element || !element.children || element.children.length === 0) {
    return;
  }

  if (activeBatchProcessing) {
    return;
  }

  try {
    const elementsToRemove: Element[] = [];

    for (const selector of DEFAULT_SELECTORS_TO_REMOVE) {
      const elements = selectAll(selector, element);
      elementsToRemove.push(...elements);
    }

    const BATCH_SIZE = 50;
    const MAX_SYNC_ELEMENTS = 100;

    if (elementsToRemove.length > MAX_SYNC_ELEMENTS) {
      const firstBatch = elementsToRemove.slice(0, MAX_SYNC_ELEMENTS);
      const remaining = elementsToRemove.slice(MAX_SYNC_ELEMENTS);

      for (const el of firstBatch) {
        try {
          if (el.parentNode) {
            removeElement(el);
          }
        } catch {
          // Continue with next element
        }
      }

      activeBatchProcessing = true;
      let batchIndex = 0;

      const processBatch = () => {
        const batch = remaining.slice(batchIndex, batchIndex + BATCH_SIZE);
        for (const el of batch) {
          try {
            if (el.parentNode) {
              removeElement(el);
            }
          } catch {
            // Continue with next element
          }
        }
        batchIndex += BATCH_SIZE;
        if (batchIndex < remaining.length) {
          if (typeof requestAnimationFrame !== 'undefined') {
            activeRafId = requestAnimationFrame(processBatch);
          } else {
            setTimeout(processBatch, 0);
          }
        } else {
          activeRafId = null;
          activeBatchProcessing = false;
        }
      };

      if (remaining.length > 0) {
        if (typeof requestAnimationFrame !== 'undefined') {
          activeRafId = requestAnimationFrame(processBatch);
        } else {
          setTimeout(processBatch, 0);
        }
      } else {
        activeBatchProcessing = false;
      }
    } else {
      for (const el of elementsToRemove) {
        try {
          if (el.parentNode) {
            removeElement(el);
          }
        } catch {}
      }
    }
  } catch {}
};

export const useDomVisitors = () => {
  const [visitors, setVisitors] = useState<{ onElement: (element: Element) => void } | null>(null);

  useEffect(() => {
    const cleanCss = (element: Element) => {
      processDom(element);
    };

    setVisitors({
      onElement: cleanCss,
    });
  }, []);

  return visitors;
};

