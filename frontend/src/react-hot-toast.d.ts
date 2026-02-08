declare module 'react-hot-toast' {
  import type { FC } from 'react'
  export interface ToasterProps {
    position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
    toastOptions?: { style?: React.CSSProperties }
  }
  export const Toaster: FC<ToasterProps>
  function toast(message: string | React.ReactNode, options?: { duration?: number; icon?: React.ReactNode }): string
  namespace toast {
    function success(message: string | React.ReactNode, options?: object): string
    function error(message: string | React.ReactNode, options?: object): string
  }
  export default toast
}
