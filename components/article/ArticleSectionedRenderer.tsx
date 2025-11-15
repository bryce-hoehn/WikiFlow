import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { InteractionManager, View, useWindowDimensions } from 'react-native';
import { ActivityIndicator, List, Text, useTheme } from 'react-native-paper';
import RenderHtml from 'react-native-render-html';
import { extractInfobox, extractIntro, parseHtml, splitIntoSections } from '../../utils/articleParsing';
/**
 * Sectioned article renderer:
 * - Extracts infobox, intro (content before first <h2>) and remaining <h2> sections.
 * - Renders each part inside a List.Accordion. Introduction accordion is expanded by default.
 * - Closed accordions are preloaded in background (parse warming) after intro renders.
 * - Nested headings (h3/h4) are left inline within section content (not accordions).
 *
 * Notes:
 * - This file intentionally keeps logic self-contained and conservative: it extracts
 *   sections using regex heuristics (robust for typical Wikipedia HTML).
 * - Preloading performs a light parseDocument() warm-up (via InteractionManager) so that
 *   the heavier HTML renderer work is less likely to stall when a user opens a section.
 */

/* Section extraction utilities moved to utils/articleParsing.ts */

/* Component */

interface SectionState {
  id: string;
  heading: string;
  html: string;
  preloaded: boolean;
  loading: boolean;
  error: string | null;
}

interface Props {
  articleHtml: string;
  baseFontSize?: number;
}

export default function ArticleSectionedRenderer({ articleHtml, baseFontSize = 16 }: Props) {
  const theme = useTheme();
  const { width } = useWindowDimensions();

  // Extract infobox, intro, and sections every time articleHtml changes
  const { infoboxHtml, introHtml, sectionsHtml } = useMemo(() => {
    const { infoboxHtml: ibHtml, remaining: noInfobox } = extractInfobox(articleHtml);
    const { introHtml: intro, remaining } = extractIntro(noInfobox);
    const sections = splitIntoSections(remaining);
    return { infoboxHtml: ibHtml, introHtml: intro, sectionsHtml: sections };
  }, [articleHtml]);

  // Compose full parts array: infobox (if present) + intro + sections
  const initialSections = useMemo<SectionState[]>(() => {
    const out: SectionState[] = [];
    let idx = 0;
    if (infoboxHtml && infoboxHtml.trim()) {
      out.push({
        id: `infobox`,
        heading: 'Infobox',
        html: infoboxHtml,
        preloaded: false,
        loading: false,
        error: null
      });
      idx++;
    }
    // Intro accordion should be open by default per requirements
    out.push({
      id: `intro`,
      heading: 'Introduction',
      html: introHtml || '<p></p>',
      preloaded: false,
      loading: false,
      error: null
    });
    idx++;
    sectionsHtml.forEach((s) => {
      out.push({
        id: s.id,
        heading: s.heading,
        html: s.html,
        preloaded: false,
        loading: false,
        error: null
      });
      idx++;
    });
    return out;
  }, [infoboxHtml, introHtml, sectionsHtml]);

  const [sections, setSections] = useState<SectionState[]>(initialSections);
  const [expandedId, setExpandedId] = useState<string | null>(() => {
    // Introduction expanded by default
    return 'intro';
  });

  // If articleHtml changes, reset sections
  useEffect(() => {
    setSections(initialSections);
    setExpandedId('intro');
  }, [initialSections]);

  // Preload closed sections in background after intro renders
  useEffect(() => {
    // After a short delay (allow intro to render) start warming other sections
    let cancelled = false;
    const preload = async () => {
      // Skip the first section (intro) as it's open and already parsed by RenderHtml when rendered
      for (const sec of sections) {
        if (cancelled) break;
        if (sec.id === expandedId) {
          // already visible
          continue;
        }
        // Kick off preload only if not already preloaded
        if (sec.preloaded) continue;
        // Yield to interactions so we don't block
        /* InteractionManager.runAfterInteractions returns a promise-like object; awaiting it yields */
        // Use a short delay between preloads to spread work
        await new Promise<void>((resolve) => {
          InteractionManager.runAfterInteractions(() => resolve());
          setTimeout(resolve, 80);
        });

        if (cancelled) break;

        // Mark loading, perform a light parse (warm-up)
        setSections((prev) =>
          prev.map((p) => (p.id === sec.id ? { ...p, loading: true, error: null } : p))
        );

        try {
          // Light parse: use centralized parseHtml to warm internal structures.
          // This centralizes htmlparser2 usage and simplifies callers.
          parseHtml(sec.html);
          // mark preloaded
          setSections((prev) =>
            prev.map((p) => (p.id === sec.id ? { ...p, preloaded: true, loading: false } : p))
          );
        } catch (err: any) {
          // Don't spam logs in production; record error on section state for UI fallback.
          setSections((prev) =>
            prev.map((p) =>
              p.id === sec.id ? { ...p, preloaded: false, loading: false, error: String(err) } : p
            )
          );
        }
      }
    };

    // Start preloading only after intro is expanded/rendered
    if (expandedId === 'intro' && sections.length > 1) {
      const handle = InteractionManager.runAfterInteractions(() => {
        preload();
      });
      return () => {
        cancelled = true;
        if (typeof (handle as any)?.cancel === 'function') (handle as any).cancel();
      };
    }

    return () => {
      cancelled = true;
    };
  }, [sections, expandedId]);

  const onAccordionPress = useCallback(
    (id: string) => {
      setExpandedId((cur) => (cur === id ? null : id));
      // If the user opens a section that isn't preloaded, start a preload/parse for it immediately
      setSections((prev) =>
        prev.map((p) => (p.id === id ? { ...p, loading: true, error: null } : p))
      );
      (async () => {
        try {
          parseHtml(sections.find((s) => s.id === id)?.html || '');
          setSections((prev) => prev.map((p) => (p.id === id ? { ...p, preloaded: true, loading: false } : p)));
        } catch (err: any) {
          setSections((prev) => prev.map((p) => (p.id === id ? { ...p, loading: false, error: String(err) } : p)));
        }
      })();
    },
    [sections]
  );

  // Render a section body using RenderHtml (only when expanded or preloaded/render-time)
  const renderSectionBody = (sec: SectionState) => {
    // If there's a parse error, show fallback text
    if (sec.error) {
      return <Text variant="bodyMedium">Content unavailable</Text>;
    }

    // Show spinner if still loading parse/warmup
    if (sec.loading && !sec.preloaded && expandedId !== sec.id) {
      // For background preload we don't render body; just show spinner in accordion content if user opened immediately
      return <ActivityIndicator />;
    }

    // Use RenderHtml for actual rich rendering
    return (
      <RenderHtml
        source={{ html: sec.html || '' }}
        contentWidth={width - 32}
        defaultTextProps={{ selectable: true }}
        systemFonts={['Arial', 'Georgia', 'Courier New']}
        ignoredDomTags={['script', 'style', 'video', 'audio', 'map', 'link', 'meta']}
      />
    );
  };

  return (
    <View>
      <List.Section>
        {sections.map((sec) => (
          <List.Accordion
            key={sec.id}
            title={sec.heading}
            expanded={expandedId === sec.id}
            onPress={() => onAccordionPress(sec.id)}
            left={(props) => null}
            style={{ backgroundColor: 'transparent' }}
          >
            <View style={{ padding: 12 }}>
              {expandedId === sec.id ? (
                renderSectionBody(sec)
              ) : sec.preloaded ? (
                // If preloaded but not expanded yet, keep nothing to avoid unnecessary render cost.
                // We render nothing; content will show when expanded.
                null
              ) : (
                // Collapsed & not preloaded: show lightweight placeholder
                <Text variant="bodySmall" style={{ color: theme.colors.onSurface }}>
                  Loading...
                </Text>
              )}
            </View>
          </List.Accordion>
        ))}
      </List.Section>
    </View>
  );
}