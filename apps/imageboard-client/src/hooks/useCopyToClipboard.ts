import writeText from 'copy-to-clipboard';
import { useCallback } from 'react';

const useCopyToClipboard = (): [
  (value: string) => Promise<boolean>,
] => {
  const copyToClipboard = useCallback(async (value: string) => {
    return await writeText(value);
  }, []);

  return [copyToClipboard];
};

export default useCopyToClipboard;
