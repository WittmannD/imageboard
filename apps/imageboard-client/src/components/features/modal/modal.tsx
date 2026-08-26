import { useSearchParams } from 'react-router';
import { type FCWithID } from 'src/lib/dialog/helpers.ts';
import { useDialog } from 'src/lib/dialog/hooks/useDialog.ts';
import { useEffect } from 'react';


export const useUrlDrivenModal = (
  dialog: FCWithID<never>,
  key: string,
  condition: (searchParams: URLSearchParams) => boolean,
) => {
  const { show, hide, visible } = useDialog(dialog);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (condition(searchParams) && !visible) {
      void show();
    }
  }, [searchParams, condition, visible, show, hide]);

  useEffect(() => {
    if (!visible) {
      setSearchParams(
        (state) => {
          state.delete(key);
          return state;
        },
        { replace: true },
      );
    }
  }, [visible, condition, key, setSearchParams]);
};
