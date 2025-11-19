import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAccordionBehavior } from '../../../hooks';
import {
  getChildren,
  parseArticleStructure,
  parseDocument,
  render as renderDom,
  type Element,
} from '../../../utils/articleParsing';

export interface SectionState {
  id: string;
  heading: string;
  html: string;
  preloaded: boolean;
  error: string | null;
  elementNodes?: Element[];
  renderedElementCount?: number;
}

interface ParsedContent {
  infoboxHtml: string;
  infoboxImage: { src: string; alt: string; width: number; height: number } | null;
  introElementNodes: Element[];
  sectionElements: Array<{ element: Element; heading: string; id: string }>;
}

interface UseArticleSectionsProps {
  articleHtml: string;
  initialExpandedSections?: string[];
  onSectionsExtracted?: (sections: { id: string; heading: string }[]) => void;
  onExpandedSectionsChange?: (expandedSections: string[]) => void;
  scrollToSection?: string | null;
  articleTitle?: string;
}

export function useArticleSections({
  articleHtml,
  initialExpandedSections,
  onSectionsExtracted,
  onExpandedSectionsChange,
  scrollToSection,
  articleTitle,
}: UseArticleSectionsProps) {
  const { accordionAutoClose } = useAccordionBehavior();

  const [parsedContent, setParsedContent] = useState<ParsedContent | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const [renderedElements, setRenderedElements] = useState<{
    intro: number;
    sections: Record<string, number>;
  }>({ intro: 0, sections: {} });

  useEffect(() => {
    if (!articleHtml) {
      setParsedContent(null);
      setRenderedElements({ intro: 0, sections: {} });
      return;
    }

    setIsParsing(true);
    setRenderedElements({ intro: 0, sections: {} });

    let rafId: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const parseArticleHtml = () => {
      try {
        const structure = parseArticleStructure(articleHtml);

        let infoboxHtml = '';
        if (structure.infoboxElement) {
          const infoboxDom = parseDocument('');
          infoboxDom.children = [structure.infoboxElement];
          infoboxHtml = renderDom(infoboxDom);
        }

        setParsedContent({
          infoboxHtml,
          infoboxImage: structure.infoboxImage,
          introElementNodes: structure.introElementNodes,
          sectionElements: structure.sectionElements,
        });
      } catch (error) {
        if (__DEV__) {
          console.error('Error parsing article HTML:', error);
        }
        setParsedContent({
          infoboxHtml: '',
          infoboxImage: null,
          introElementNodes: [],
          sectionElements: [],
        });
      } finally {
        setIsParsing(false);
      }
    };

    if (typeof requestAnimationFrame !== 'undefined') {
      rafId = requestAnimationFrame(() => {
        parseArticleHtml();
      });
    } else {
      timeoutId = setTimeout(parseArticleHtml, 0);
    }

    return () => {
      if (rafId !== null && typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(rafId);
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, [articleHtml]);

  // Incrementally render elements one at a time across all sections
  const isProcessingRef = useRef(false);
  const renderedElementsRef = useRef(renderedElements);

  // Keep ref in sync with state
  useEffect(() => {
    renderedElementsRef.current = renderedElements;
  }, [renderedElements]);

  useEffect(() => {
    if (!parsedContent || isParsing) {
      isProcessingRef.current = false;
      return;
    }

    if (isProcessingRef.current) return; // Already processing

    isProcessingRef.current = true;
    let rafId: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const checkHasMore = (): boolean => {
      const current = renderedElementsRef.current;

      // Check intro elements
      if (current.intro < parsedContent.introElementNodes.length) {
        return true;
      }

      // Check section elements
      for (const section of parsedContent.sectionElements) {
        const currentCount = current.sections[section.id] || 0;
        const sectionChildren = getChildren(section.element).filter(
          (node): node is Element => node.type === 'tag'
        );
        if (currentCount < sectionChildren.length) {
          return true;
        }
      }

      return false;
    };

    const processNextElement = () => {
      if (cancelled) return;

      setRenderedElements((prev) => {
        if (cancelled) return prev;

        // Update ref immediately
        renderedElementsRef.current = prev;

        // Process intro elements first
        if (prev.intro < parsedContent.introElementNodes.length) {
          const next = { ...prev, intro: prev.intro + 1 };
          renderedElementsRef.current = next;
          return next;
        }

        // Then process section elements in order
        for (const section of parsedContent.sectionElements) {
          const currentCount = prev.sections[section.id] || 0;
          const sectionChildren = getChildren(section.element).filter(
            (node): node is Element => node.type === 'tag'
          );
          if (currentCount < sectionChildren.length) {
            const next = {
              ...prev,
              sections: { ...prev.sections, [section.id]: currentCount + 1 },
            };
            renderedElementsRef.current = next;
            return next;
          }
        }

        // All elements processed
        isProcessingRef.current = false;
        return prev;
      });
    };

    const scheduleNext = () => {
      if (cancelled) {
        isProcessingRef.current = false;
        return;
      }

      if (!checkHasMore()) {
        isProcessingRef.current = false;
        return;
      }

      // Schedule next element processing
      const processAndContinue = () => {
        if (cancelled) {
          isProcessingRef.current = false;
          return;
        }

        processNextElement();
        // Use a small delay to allow state to update before checking again
        setTimeout(() => {
          if (!cancelled && checkHasMore()) {
            scheduleNext();
          } else {
            isProcessingRef.current = false;
          }
        }, 0);
      };

      if (typeof requestAnimationFrame !== 'undefined') {
        rafId = requestAnimationFrame(processAndContinue);
      } else {
        timeoutId = setTimeout(processAndContinue, 16); // ~60fps
      }
    };

    // Start processing
    scheduleNext();

    return () => {
      cancelled = true;
      isProcessingRef.current = false;
      if (rafId !== null && typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(rafId);
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, [parsedContent, isParsing]);

  // Build sections from parsed content with incremental element rendering
  const initialSections = useMemo<SectionState[]>(() => {
    if (!parsedContent) {
      return [
        {
          id: 'intro',
          heading: 'Introduction',
          html: '<p>Loading...</p>',
          preloaded: false,
          error: null,
          elementNodes: [],
          renderedElementCount: 0,
        },
      ];
    }

    const { infoboxHtml, introElementNodes, sectionElements } = parsedContent;
    const out: SectionState[] = [];
    let idx = 0;

    // Infobox section (if present)
    if (infoboxHtml && infoboxHtml.trim()) {
      out.push({
        id: 'infobox',
        heading: 'Infobox',
        html: infoboxHtml,
        preloaded: true,
        error: null,
        elementNodes: [],
        renderedElementCount: 0,
      });
      idx++;
    }

    // Intro section with element nodes for incremental rendering
    const introRenderedCount = renderedElements.intro;
    const introElementsToRender = introElementNodes.slice(0, introRenderedCount);
    const introDom = parseDocument('');
    introDom.children = introElementsToRender;
    const introHtml = introElementsToRender.length > 0 ? renderDom(introDom) : '';

    out.push({
      id: 'intro',
      heading: 'Introduction',
      html: introHtml || '<p>Loading...</p>',
      preloaded: introRenderedCount >= introElementNodes.length,
      error: null,
      elementNodes: introElementNodes,
      renderedElementCount: introRenderedCount,
    });
    idx++;

    // Section elements with incremental rendering
    sectionElements.forEach((sec) => {
      const sectionRenderedCount = renderedElements.sections[sec.id] || 0;
      const sectionChildren = getChildren(sec.element).filter(
        (node): node is Element => node.type === 'tag'
      ) as Element[];
      const elementsToRender = sectionChildren.slice(0, sectionRenderedCount);

      let sectionHtml = '';
      if (elementsToRender.length > 0) {
        const sectionDom = parseDocument('');
        sectionDom.children = elementsToRender;
        sectionHtml = renderDom(sectionDom);
      }

      out.push({
        id: sec.id,
        heading: sec.heading,
        html: sectionHtml || '<p>Loading...</p>',
        preloaded: sectionRenderedCount >= sectionChildren.length,
        error: null,
        elementNodes: sectionChildren,
        renderedElementCount: sectionRenderedCount,
      });
      idx++;
    });

    return out;
  }, [parsedContent, renderedElements]);

  // Use stable initial value for useState to avoid hooks order issues
  const [sections, setSections] = useState<SectionState[]>(() => [
    {
      id: 'intro',
      heading: 'Introduction',
      html: '<p>Loading...</p>',
      preloaded: false,
      error: null,
    },
  ]);

  const [expandedId, setExpandedId] = useState<string | null>(() => {
    const firstSection = initialExpandedSections?.[0];
    if (firstSection) {
      return firstSection;
    }
    return 'intro';
  });

  const [expandedSections, setExpandedSections] = useState<string[]>(() => {
    if (initialExpandedSections && initialExpandedSections.length > 0) {
      return initialExpandedSections;
    }
    return ['intro'];
  });

  // Notify parent of extracted sections for TOC
  const prevSectionsRef = useRef<string>('');
  const onSectionsExtractedRef = useRef(onSectionsExtracted);
  const onExpandedSectionsChangeRef = useRef(onExpandedSectionsChange);

  // Keep refs in sync with callbacks
  useEffect(() => {
    onSectionsExtractedRef.current = onSectionsExtracted;
  }, [onSectionsExtracted]);

  useEffect(() => {
    onExpandedSectionsChangeRef.current = onExpandedSectionsChange;
  }, [onExpandedSectionsChange]);

  useEffect(() => {
    if (onSectionsExtractedRef.current && sections.length > 0) {
      const sectionsKey = sections.map((s) => s.id).join(',');
      if (sectionsKey !== prevSectionsRef.current) {
        prevSectionsRef.current = sectionsKey;
        onSectionsExtractedRef.current(sections.map((s) => ({ id: s.id, heading: s.heading })));
      }
    }
  }, [sections]);

  // Handle scroll to section requests
  useEffect(() => {
    if (scrollToSection) {
      setExpandedId(scrollToSection);
      if (!expandedSections.includes(scrollToSection)) {
        if (accordionAutoClose) {
          setExpandedSections([scrollToSection]);
        } else {
          setExpandedSections([...expandedSections, scrollToSection]);
        }
      }
    }
  }, [scrollToSection, accordionAutoClose, expandedSections]);

  // Track if we've initialized expanded sections
  const hasInitializedExpanded = useRef(false);
  const previousArticleTitle = useRef(articleTitle);

  useEffect(() => {
    if (previousArticleTitle.current !== articleTitle) {
      hasInitializedExpanded.current = false;
      previousArticleTitle.current = articleTitle;
    }
  }, [articleTitle]);

  // Update sections when articleHtml or initialSections changes
  const prevInitialSectionsRef = useRef<SectionState[]>([]);
  const prevArticleHtmlRef = useRef<string>('');

  useEffect(() => {
    const articleChanged = prevArticleHtmlRef.current !== articleHtml;

    if (articleChanged) {
      prevArticleHtmlRef.current = articleHtml;
      prevInitialSectionsRef.current = initialSections;
      setSections(initialSections);

      hasInitializedExpanded.current = false;
      const firstSection = initialExpandedSections?.[0];
      if (firstSection) {
        setExpandedId(firstSection);
        setExpandedSections(initialExpandedSections);
      } else {
        setExpandedId('intro');
        setExpandedSections(['intro']);
      }
      hasInitializedExpanded.current = true;
    } else {
      const prevHtmls = prevInitialSectionsRef.current.map((s) => s.html).join('|');
      const currHtmls = initialSections.map((s) => s.html).join('|');

      if (prevHtmls !== currHtmls) {
        prevInitialSectionsRef.current = initialSections;
        setSections(initialSections);
      }

      if (!hasInitializedExpanded.current) {
        const firstSection = initialExpandedSections?.[0];
        if (firstSection) {
          setExpandedId(firstSection);
          setExpandedSections(initialExpandedSections);
        } else {
          setExpandedId('intro');
          setExpandedSections(['intro']);
        }
        hasInitializedExpanded.current = true;
      }
    }
  }, [articleHtml, initialSections, initialExpandedSections]);

  const onAccordionPress = useCallback(
    (id: string) => {
      const wasExpanded = expandedSections.includes(id);

      let newExpandedSections: string[];

      if (accordionAutoClose) {
        if (wasExpanded) {
          newExpandedSections = [];
          setExpandedId(null);
        } else {
          newExpandedSections = [id];
          setExpandedId(id);
        }
      } else {
        if (wasExpanded) {
          newExpandedSections = expandedSections.filter((s) => s !== id);
        } else {
          newExpandedSections = [...expandedSections, id];
        }
        setExpandedId(newExpandedSections.length > 0 ? newExpandedSections[0] : null);
      }

      setExpandedSections(newExpandedSections);

      if (onExpandedSectionsChangeRef.current) {
        setTimeout(() => {
          onExpandedSectionsChangeRef.current?.(newExpandedSections);
        }, 0);
      }
    },
    [expandedSections, accordionAutoClose]
  );

  return {
    parsedContent,
    isParsing,
    sections,
    expandedSections,
    expandedId,
    onAccordionPress,
  };
}

