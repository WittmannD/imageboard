import { useMemo } from 'react';

function useNumberFormatter(options: Intl.NumberFormatOptions, locale = 'en') {
  return useMemo(
    () => new Intl.NumberFormat(locale, options),
    [options, locale],
  );
}

export default useNumberFormatter;
