export type ToastType = 'success' | 'mission' | 'badge' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
}

export function triggerToast(message: string, type: ToastType = 'success', title?: string) {
  const event = new CustomEvent('addim-toast', {
    detail: { message, type, title }
  });
  window.dispatchEvent(event);
}
