import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border  font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      size: {
        default: "px-2.5 py-0.5 text-xs", //tw
        small: "px-2 py-[1px] text-[10px]", //tw
      },
      variant: {
        success:
          "border-transparent bg-green-600 text-white hover:bg-green-600/80", //tw
        error:
          "border-transparent bg-red-600 text-white hover:bg-red-600/80", //tw
        warning:
          "border-transparent bg-orange-600 text-white hover:bg-orange-400/80", //tw
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "outline",
      size: "default"
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }