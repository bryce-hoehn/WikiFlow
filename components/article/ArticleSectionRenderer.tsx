import React, { useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Text } from 'react-native-paper';
import RenderHtml from 'react-native-render-html';
import { SPACING } from '../../constants/spacing';
import ExpansionPanel from '../common/ExpansionPanel';
import type { SectionState } from './hooks/useArticleSections';

interface ArticleSectionRendererProps {
  section: SectionState;
  isExpanded: boolean;
  onPress: () => void;
  renderers: any;
  renderersProps: any;
  customHTMLElementModels: any;
  domVisitors: any;
  tagsStyles: any;
  classesStyles: any;
  contentWidth: number;
  systemFonts: string[];
  ignoredDomTags: string[];
  defaultTextProps: any;
}

export default function ArticleSectionRenderer({
  section,
  isExpanded,
  onPress,
  renderers,
  renderersProps,
  customHTMLElementModels,
  domVisitors,
  tagsStyles,
  classesStyles,
  contentWidth,
  systemFonts,
  ignoredDomTags,
  defaultTextProps,
}: ArticleSectionRendererProps) {
  const RenderHtmlWrapper = useMemo(
    () =>
      React.memo(
        ({ html }: { html: string }) => {
          return (
            <RenderHtml
              source={{ html }}
              contentWidth={contentWidth}
              defaultTextProps={defaultTextProps}
              systemFonts={systemFonts}
              ignoredDomTags={ignoredDomTags}
              customHTMLElementModels={customHTMLElementModels}
              domVisitors={domVisitors}
              tagsStyles={tagsStyles as any}
              classesStyles={classesStyles as any}
              renderers={renderers}
              renderersProps={renderersProps}
            />
          );
        },
        (prevProps, nextProps) => prevProps.html === nextProps.html
      ),
    [
      contentWidth,
      defaultTextProps,
      systemFonts,
      ignoredDomTags,
      tagsStyles,
      classesStyles,
      customHTMLElementModels,
      domVisitors,
      renderers,
      renderersProps,
    ]
  );

  const renderSectionBody = (sec: SectionState) => {
    if (sec.error) {
      return <Text variant="bodyMedium">Content unavailable</Text>;
    }
    return <RenderHtmlWrapper html={sec.html || ''} />;
  };

  const isStillLoading =
    section.elementNodes && section.renderedElementCount !== undefined
      ? section.renderedElementCount < section.elementNodes.length
      : false;

  return (
    <ExpansionPanel
      key={section.id}
      title={section.heading}
      expanded={isExpanded}
      onPress={onPress}
      accessibilityLabel={`Section: ${section.heading}`}
      testID={`section-${section.id}`}
    >
      {section.html && !section.error && renderSectionBody(section)}
      {isStillLoading && (
        <View style={{ padding: SPACING.base, alignItems: 'center' }}>
          <ActivityIndicator size="small" />
        </View>
      )}
      {section.error && <Text variant="bodyMedium">Content unavailable</Text>}
      {!section.html && !section.error && !isStillLoading && (
        <Text variant="bodyMedium">No content available</Text>
      )}
    </ExpansionPanel>
  );
}

