import * as React from "react"

// Definir os tipos internamente para evitar importação circular
type ToastProps = {
  variant?: "default" | "destructive"
  className?: string
}

type ToastActionElement = React.ReactElement

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 5000 // 5 segundos para remover automaticamente

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

type ToastContextType = {
  toasts: ToasterToast[]
  toast: (props: Omit<ToasterToast, "id">) => string
  dismiss: (toastId?: string) => void
}

const ToastContext = React.createContext<ToastContextType>({
  toasts: [],
  toast: () => "",
  dismiss: () => {},
})

export function ToastProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [toasts, setToasts] = React.useState<ToasterToast[]>([])

  const dismiss = React.useCallback(
    (toastId?: string) => {
      if (toastId) {
        setToasts((prevToasts) =>
          prevToasts.filter((toast) => toast.id !== toastId)
        )
      } else {
        setToasts([])
      }
    },
    [setToasts]
  )

  const toast = React.useCallback(
    (props: Omit<ToasterToast, "id">) => {
      const id = genId()

      setToasts((prevToasts) => {
        const newToast = { id, ...props }
        
        if (prevToasts.length >= TOAST_LIMIT) {
          const [, ...rest] = prevToasts
          return [...rest, newToast]
        }
        
        return [...prevToasts, newToast]
      })

      // Automaticamente remover o toast após o delay
      setTimeout(() => {
        dismiss(id)
      }, TOAST_REMOVE_DELAY)

      return id
    },
    [setToasts, dismiss]
  )

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  return React.useContext(ToastContext)
}

export type { ToasterToast, ToastProps, ToastActionElement } 