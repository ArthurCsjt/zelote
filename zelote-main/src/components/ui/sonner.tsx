
import React from "react"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:dark:bg-zinc-900 group-[.toaster]:text-foreground group-[.toaster]:border-4 group-[.toaster]:border-black group-[.toaster]:dark:border-white group-[.toaster]:shadow-[6px_6px_0px_0px_#000] group-[.toaster]:dark:shadow-[6px_6px_0px_0px_#fff] group-[.toaster]:rounded-none group-[.toaster]:font-bold group-[.toaster]:p-4",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:font-medium group-[.toast]:text-sm",
          actionButton:
            "group-[.toast]:bg-black group-[.toast]:dark:bg-white group-[.toast]:text-white group-[.toast]:dark:text-black group-[.toast]:border-2 group-[.toast]:border-black group-[.toast]:dark:border-white group-[.toast]:font-black group-[.toast]:uppercase group-[.toast]:tracking-wide group-[.toast]:px-3 group-[.toast]:py-1 group-[.toast]:shadow-[2px_2px_0px_0px_#000] group-[.toast]:dark:shadow-[2px_2px_0px_0px_#fff] group-[.toast]:hover:shadow-[3px_3px_0px_0px_#000] group-[.toast]:hover:translate-x-[-1px] group-[.toast]:hover:translate-y-[-1px] group-[.toast]:active:shadow-none group-[.toast]:active:translate-x-[2px] group-[.toast]:active:translate-y-[2px]",
          cancelButton:
            "group-[.toast]:bg-zinc-200 group-[.toast]:dark:bg-zinc-800 group-[.toast]:text-foreground group-[.toast]:border-2 group-[.toast]:border-black group-[.toast]:dark:border-white group-[.toast]:font-black group-[.toast]:uppercase group-[.toast]:tracking-wide group-[.toast]:px-3 group-[.toast]:py-1 group-[.toast]:shadow-[2px_2px_0px_0px_#000] group-[.toast]:dark:shadow-[2px_2px_0px_0px_#fff]",
          success: "group-[.toast]:border-green-600 group-[.toast]:bg-green-50 group-[.toast]:dark:bg-green-950 group-[.toast]:text-green-900 group-[.toast]:dark:text-green-100",
          error: "group-[.toast]:border-red-600 group-[.toast]:bg-red-50 group-[.toast]:dark:bg-red-950 group-[.toast]:text-red-900 group-[.toast]:dark:text-red-100",
          warning: "group-[.toast]:border-amber-600 group-[.toast]:bg-amber-50 group-[.toast]:dark:bg-amber-950 group-[.toast]:text-amber-900 group-[.toast]:dark:text-amber-100",
          info: "group-[.toast]:border-blue-600 group-[.toast]:bg-blue-50 group-[.toast]:dark:bg-blue-950 group-[.toast]:text-blue-900 group-[.toast]:dark:text-blue-100",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
