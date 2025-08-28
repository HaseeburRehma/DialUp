// src/components/ui/switch.tsx


import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, style, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-0 transition-colors',
      'bg-gray-200 dark:bg-gray-700 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-500 data-[state=checked]:to-blue-500',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    style={style as React.CSSProperties}
    {...props}
    ref={ref}
  >
    <motion.div
      className="pointer-events-none block h-5 w-5 rounded-full bg-white dark:bg-gray-900 shadow-lg ring-0"
      transition={{ duration: 0.2 }}
      animate={{
        translateX: props.checked ? 20 : 0,
      }}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }