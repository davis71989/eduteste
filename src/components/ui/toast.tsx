import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { type ToastProps } from "./use-toast"

const Toast = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "destructive"
    onClose?: () => void
  }
>(({ className, variant = "default", onClose, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full",
        variant === "default" &&
          "border-slate-200 bg-white text-slate-950 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50",
        variant === "destructive" &&
          "destructive group border-red-500 bg-red-500 text-slate-50 dark:border-red-900 dark:bg-red-900 dark:text-slate-50",
        className
      )}
      {...props}
    />
  )
})
Toast.displayName = "Toast"

const ToastClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-slate-950/50 opacity-0 transition-opacity hover:text-slate-950 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 dark:text-slate-50/50 dark:hover:text-slate-50",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </button>
))
ToastClose.displayName = "ToastClose"

const ToastTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
))
ToastTitle.displayName = "ToastTitle"

const ToastDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = "ToastDescription"

const ToastAction = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-transparent px-3 text-sm font-medium ring-offset-white transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:border-slate-800 dark:ring-offset-slate-950 dark:hover:bg-slate-800 dark:focus:ring-slate-300 group-[.destructive]:border-slate-100/40 group-[.destructive]:hover:border-red-500/30 group-[.destructive]:hover:bg-red-500 group-[.destructive]:hover:text-slate-50 group-[.destructive]:focus:ring-red-500",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = "ToastAction"

type ToastViewport = React.ComponentPropsWithoutRef<"div"> & {
  onPointerDown?: React.PointerEventHandler<HTMLDivElement>
  onPointerMove?: React.PointerEventHandler<HTMLDivElement>
  onPointerUp?: React.PointerEventHandler<HTMLDivElement>
}

const ToastViewport = React.forwardRef<
  HTMLDivElement,
  ToastViewport
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = "ToastViewport"

// Toast Provider
type ToastProviderProps = {
  children: React.ReactNode
}

// Interface estendida para incluir nosso sistema de toast personalizado
interface CustomToast extends Omit<ToastProps, 'id'> {
  id?: string;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  // Função para adicionar um toast
  const addToast = React.useCallback((toast: CustomToast) => {
    const id = toast.id || Date.now().toString();
    setToasts((prev) => [...prev, { ...toast, id }]);
    
    // Auto-dismiss toast after duration
    if (toast.duration !== Infinity) {
      const duration = toast.duration || 5000;
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  // Contexto do componente toast
  const toastContext = React.useMemo(() => ({ addToast }), [addToast]);

  React.useEffect(() => {
    // Exportar a função para o objeto window
    // @ts-ignore
    window.__toast = {
      show: (title: string, description?: string, variant?: "default" | "destructive") => {
        addToast({ title, description, variant });
      }
    };
  }, [addToast]);

  return (
    <>
      {children}
      {toasts.length > 0 && (
        <ToastViewport>
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              variant={toast.variant}
              className="mb-2"
              onClose={() => setToasts(toasts.filter(t => t.id !== toast.id))}
            >
              {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
              {toast.description && (
                <ToastDescription>{toast.description}</ToastDescription>
              )}
              <ToastClose onClick={() => setToasts(toasts.filter(t => t.id !== toast.id))} />
            </Toast>
          ))}
        </ToastViewport>
      )}
    </>
  )
}

export { Toast, ToastAction, ToastClose, ToastDescription, ToastTitle, ToastViewport } 