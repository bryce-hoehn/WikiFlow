import useAsyncStorage from './useAsyncStorage';

const ACCORDION_BEHAVIOR_KEY = 'accordion_auto_close';

/**
 * Hook for managing accordion auto-close behavior preference
 * Defaults to false (sections stay open unless manually closed)
 * When enabled, opening a new section automatically closes others (accordion behavior)
 */
export default function useAccordionBehavior() {
  const {
    value: autoClose,
    isLoading: loading,
    updateValue,
  } = useAsyncStorage<boolean>(ACCORDION_BEHAVIOR_KEY, {
    defaultValue: false, // Default: sections stay open unless closed
  });

  return {
    accordionAutoClose: autoClose,
    setAccordionAutoClose: updateValue,
    loading,
  };
}

