import React, { type JSX } from 'react';


export interface DialogState {
  id: string;
  args?: Record<string, unknown>  ;
  visible?: boolean;
  delayVisible?: boolean;
  keepMounted?: boolean;
}

export type DialogStore = Record<string, DialogState | undefined>;

export interface DialogAction {
  type: string;
  payload: {
    dialogId: string;
    args?: Record<string, unknown>  ;
    flags?: Record<string, unknown>;
  };
}

/**
 * The handler to manage a dialog returned by {@link useDialog | useDialog} hook.
 */
export interface DialogHandler<
  Props = Record<string, unknown>,
> extends DialogState {
  /**
   * Whether a dialog is visible, it's controlled by {@link DialogHandler.show | show}/{@link DialogHandler.hide | hide} method.
   */
  visible: boolean;
  /**
   * If you don't want to remove the dialog from the tree after hide when using helpers, set it to true.
   */
  keepMounted: boolean;
  /**
   * Show the dialog, it will change {@link DialogHandler.visible | visible} state to true.
   * @param args - an object passed to dialog component as props.
   */
  show: (args?: Props) => Promise<unknown>;
  /**
   * Hide the dialog, it will change {@link DialogHandler.visible | visible} state to false.
   */
  hide: () => Promise<unknown>;
  /**
   * Resolve the promise returned by {@link DialogHandler.show | show} method.
   */
  resolve: (args?: unknown) => void;
  /**
   * Reject the promise returned by {@link DialogHandler.show | show} method.
   */
  reject: (args?: unknown) => void;
  /**
   * Remove the dialog component from React component tree. It improves performance compared to just making a dialog invisible.
   */
  remove: () => void;

  /**
   * Resolve the promise returned by {@link DialogHandler.hide | hide} method.
   */
  resolveHide: (args?: unknown) => void;
}

export type DialogArgs<T> = T extends
  | keyof JSX.IntrinsicElements
  | React.JSXElementConstructor<Record<string, unknown>>
  ? React.ComponentProps<T>
  : Record<string, unknown>;
