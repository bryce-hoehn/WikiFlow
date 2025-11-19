import React, { Suspense, useCallback, useMemo } from 'react';
import { ActivityIndicator, Linking, Platform, Text, View } from 'react-native';
import { HTMLContentModel, HTMLElementModel, TNode } from 'react-native-render-html';
import { DEFAULT_SELECTORS_TO_REMOVE } from '../../utils/articleParsing';
import { CaptionRenderer, ImageRenderer } from './ArticleRenderers';

// Lazy load MediaPlayer - only needed when article has video/audio content
const MediaPlayerLazy = React.lazy(() => import('./MediaPlayer'));

type RendererProps = {
  tnode: TNode;
  TDefaultRenderer: React.ComponentType<any>;
  [key: string]: unknown;
};

interface ArticleRenderersConfigProps {
  articleTitle?: string;
  onImagePress?: (image: { uri: string; alt?: string }) => void;
  handleLinkPress: (href?: string) => void;
  handleLinkHover: (href: string) => void;
  primaryColor: string;
}

export function useArticleRenderersConfig({
  articleTitle,
  onImagePress,
  handleLinkPress,
  handleLinkHover,
  primaryColor,
}: ArticleRenderersConfigProps) {
  const defaultImagePressHandler = useCallback((img: { uri: string; alt?: string }) => {
    if (img?.uri) {
      Linking.openURL(img.uri).catch(() => {});
    }
  }, []);

  const imageRendererFn = useCallback(
    (props: RendererProps) => {
      try {
        const tnode = props?.tnode;
        return (
          <ImageRenderer
            tnode={tnode}
            style={{}}
            articleTitle={articleTitle}
            onImagePress={onImagePress || defaultImagePressHandler}
          />
        );
      } catch (err) {
        return (
          <ImageRenderer
            tnode={undefined as any}
            style={{}}
            articleTitle={articleTitle}
            onImagePress={onImagePress || defaultImagePressHandler}
          />
        );
      }
    },
    [articleTitle, onImagePress, defaultImagePressHandler]
  );

  const anchorRendererFn = useCallback(
    (props: RendererProps) => {
      const { tnode, TDefaultRenderer, ...rest } = props;
      const href = tnode?.attributes?.href;

      const hasImageChild = tnode?.children?.some((child: TNode) => {
        const childWithName = child as TNode & { name?: string };
        return childWithName?.name === 'img';
      });

      const isFileLink = href && (href.includes('/File:') || href.includes('File:'));

      if (Platform.OS === 'web' && href) {
        // Wikipedia wraps images in <a> tags - prevent navigation
        if (hasImageChild || isFileLink) {
          return (
            <View
              style={rest.style as any}
              {...(Platform.OS === 'web'
                ? {
                    onClick: (e: any) => {
                      e?.preventDefault?.();
                      e?.stopPropagation?.();
                    },
                  }
                : {})}
            >
              <TDefaultRenderer {...props} />
            </View>
          );
        }

        return (
          <Text
            style={[rest.style as any, { color: primaryColor }]}
            onPress={() => {
              handleLinkPress(href);
            }}
            {...(Platform.OS === 'web' && {
              onMouseEnter: () => handleLinkHover(href),
            })}
          >
            <TDefaultRenderer {...props} />
          </Text>
        );
      }

      return <TDefaultRenderer {...props} />;
    },
    [handleLinkPress, handleLinkHover, primaryColor]
  );

  const videoRendererFn = useCallback((props: RendererProps) => {
    try {
      const tnode = props?.tnode;
      if (!tnode) {
        return null;
      }
      return (
        <Suspense fallback={<ActivityIndicator size="small" />}>
          <MediaPlayerLazy tnode={tnode} type="video" />
        </Suspense>
      );
    } catch (err) {
      return null;
    }
  }, []);

  const audioRendererFn = useCallback((props: RendererProps) => {
    try {
      const tnode = props?.tnode;
      if (!tnode) {
        return null;
      }
      return (
        <Suspense fallback={<ActivityIndicator size="small" />}>
          <MediaPlayerLazy tnode={tnode} type="audio" />
        </Suspense>
      );
    } catch (err) {
      return null;
    }
  }, []);

  const captionRendererFn = useCallback((props: RendererProps) => {
    try {
      const tnode = props?.tnode;
      if (!tnode) {
        return null;
      }
      return <CaptionRenderer tnode={tnode} />;
    } catch (err) {
      return null;
    }
  }, []);

  const renderers = useMemo(
    () => ({
      img: imageRendererFn as any,
      a: anchorRendererFn as any,
      video: videoRendererFn as any,
      audio: audioRendererFn as any,
      caption: captionRendererFn as any,
    }),
    [imageRendererFn, anchorRendererFn, videoRendererFn, audioRendererFn, captionRendererFn]
  );

  const stableRenderersProps = useMemo(
    () => ({
      a: {
        onPress: (evt: unknown, href: string | undefined) => {
          if (typeof href === 'string') handleLinkPress(href);
        },
      },
    }),
    [handleLinkPress]
  );

  const customHTMLElementModels = useMemo(
    () => ({
      audio: HTMLElementModel.fromCustomModel({
        tagName: 'audio',
        contentModel: HTMLContentModel.mixed,
      }),
      video: HTMLElementModel.fromCustomModel({
        tagName: 'video',
        contentModel: HTMLContentModel.mixed,
      }),
      caption: HTMLElementModel.fromCustomModel({
        tagName: 'caption',
        contentModel: HTMLContentModel.mixed,
      }),
    }),
    []
  );

  const domVisitors = useMemo(
    () => ({
      onElement: (element: any) => {
        if (!element.parent || !element.parent.children) {
          return;
        }

        if (element.name === 'h2') {
          const parentChildren = element.parent.children;
          const index = parentChildren.indexOf(element);
          if (index > -1) {
            parentChildren.splice(index, 1);
          }
          return;
        }

        const classAttr = element.attribs?.class;
        if (!classAttr || typeof classAttr !== 'string') {
          return;
        }

        const classes = new Set(classAttr.split(' ').filter(Boolean));
        let shouldRemove = false;

        for (const selector of DEFAULT_SELECTORS_TO_REMOVE) {
          if (selector.startsWith('.')) {
            const className = selector.slice(1);
            if (classes.has(className)) {
              shouldRemove = true;
              break;
            }
          }
        }

        if (shouldRemove) {
          const parentChildren = element.parent.children;
          const index = parentChildren.indexOf(element);
          if (index > -1) {
            parentChildren.splice(index, 1);
          }
        }
      },
    }),
    []
  );

  return {
    renderers,
    stableRenderersProps,
    customHTMLElementModels,
    domVisitors,
  };
}

