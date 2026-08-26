import { ALREADY_MOUNTED } from 'src/lib/dialog/registry.ts';
import type {
  DialogAction,
  DialogStore,
} from 'src/lib/dialog/types.ts';

const initialState: DialogStore = {};

/**
 * The dialog reducer. Pass it to Redux store, to integrate with Redux.
 * @example
 * ```ts
 * const store = createStore(
 *   combineReducers({
 *     dialog: Dialog.reducer,
 *     // other reducers...
 *   })
 * );
 * ```
 * @param state
 * @param action
 */
export const reducer = (
  state: DialogStore = initialState,
  action: DialogAction,
): DialogStore => {
  switch (action.type) {
    case 'nice-dialog/show': {
      const { dialogId, args } = action.payload;
      return {
        ...state,
        [dialogId]: {
          ...state[dialogId],
          id: dialogId,
          args,
          // If dialog is not mounted, mount it first then make it visible.
          // There is logic inside HOC wrapper to make it visible after its first mount.
          // This mechanism ensures the entering transition.
          visible: ALREADY_MOUNTED[dialogId],
          delayVisible: !ALREADY_MOUNTED[dialogId],
        },
      };
    }
    case 'nice-dialog/hide': {
      const { dialogId } = action.payload;
      if (!state[dialogId]) return state;
      return {
        ...state,
        [dialogId]: {
          ...state[dialogId],
          visible: false,
        },
      };
    }
    case 'nice-dialog/remove': {
      const { dialogId } = action.payload;
      const newState = { ...state };
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete newState[dialogId];
      return newState;
    }
    case 'nice-dialog/set-flags': {
      const { dialogId, flags } = action.payload;
      return {
        ...state,
        [dialogId]: {
          ...state[dialogId],
          ...flags,
        },
      } as DialogStore;
    }
    default:
      return state;
  }
};

