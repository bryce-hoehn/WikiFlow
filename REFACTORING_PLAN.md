# Component Refactoring Plan

## Overview

This document identifies excessively large components that should be broken up into smaller, more maintainable pieces.

## Components Requiring Refactoring

### 1. ArticleSectionedRenderer.tsx (1,060 lines) ⚠️ **HIGH PRIORITY**

**Current Issues:**

- Handles HTML parsing, section management, rendering, and configuration all in one file
- Complex state management for sections and incremental rendering
- Multiple renderer configurations mixed with component logic

**Recommended Split:**

```
components/article/
├── ArticleSectionedRenderer.tsx (main component, ~300 lines)
├── ArticleSectionRenderer.tsx (individual section rendering, ~200 lines)
├── ArticleRenderersConfig.tsx (renderer configuration, ~250 lines)
└── hooks/
    └── useArticleSections.ts (section state management, ~200 lines)
```

**Benefits:**

- Clear separation of concerns
- Easier to test individual pieces
- Better code reusability
- Improved maintainability

---

### 2. MediaPlayer.tsx (734 lines) ⚠️ **HIGH PRIORITY**

**Current Issues:**

- Contains both VideoPlayer and AudioPlayer components
- URL resolution logic mixed with component code
- Helper functions not separated

**Recommended Split:**

```
components/article/media/
├── MediaPlayer.tsx (main wrapper, ~150 lines)
├── VideoPlayer.tsx (video player component, ~200 lines)
├── AudioPlayer.tsx (audio player component, ~180 lines)
└── utils/
    ├── mediaUtils.ts (URL resolution, ~150 lines)
    └── timeFormatters.ts (formatTime helpers, ~50 lines)
```

**Benefits:**

- Clear separation between video and audio players
- Reusable URL resolution utilities
- Easier to maintain and test each player independently

---

### 3. ArticleRenderers.tsx (650 lines) ⚠️ **MEDIUM PRIORITY**

**Current Issues:**

- Multiple renderers in one file
- Hook mixed with renderers

**Recommended Split:**

```
components/article/renderers/
├── CaptionRenderer.tsx (~70 lines)
├── ImageRenderer.tsx (~550 lines)
└── hooks/
    └── useDomVisitors.ts (~30 lines)
```

**Benefits:**

- Each renderer is independently maintainable
- Hook can be reused elsewhere
- Clearer file organization

---

### 4. SearchOverlay.tsx (561 lines) ⚠️ **LOW PRIORITY**

**Current Issues:**

- Animation logic mixed with search logic
- Could benefit from extracting animation hooks

**Recommended Split:**

```
components/search/
├── SearchOverlay.tsx (main component, ~400 lines)
└── hooks/
    └── useSearchOverlayAnimations.ts (animation logic, ~160 lines)
```

**Benefits:**

- Animation logic is reusable
- Main component focuses on search functionality

---

### 5. BookmarkCard.tsx (490 lines) ⚠️ **LOW PRIORITY**

**Current Status:**

- Well-structured component
- Could extract tag rendering into separate component if it grows

**Potential Future Split:**

```
components/bookmarks/
├── BookmarkCard.tsx (main component)
└── BookmarkCardTags.tsx (tag rendering component)
```

---

### 6. RecommendationCard.tsx (468 lines) ⚠️ **LOW PRIORITY**

**Current Status:**

- Well-structured component
- No immediate need for splitting

---

## Implementation Priority

1. **MediaPlayer.tsx** - Easiest to split, clear boundaries
2. **ArticleRenderers.tsx** - Simple file separation
3. **ArticleSectionedRenderer.tsx** - Most complex, requires careful planning
4. **SearchOverlay.tsx** - Low priority, can be done later

## Notes

- All components are functional and working
- Refactoring should be done incrementally
- Ensure all tests pass after each split
- Update imports across the codebase after splitting
