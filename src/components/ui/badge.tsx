import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Updated badge variants for better status indication
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: // Primary (e.g., for 'Won')
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: // Secondary (e.g., for 'New')
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: // Destructive (e.g., for 'Lost')
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: // Outline (default for neutral statuses)
          "text-foreground border-border", // Ensure border color is applied
        info: // Example: Blue for 'Contacted', 'Proposal Sent'
           "border-transparent bg-blue-500 text-white hover:bg-blue-500/80 dark:bg-blue-700 dark:hover:bg-blue-700/80",
        success: // Example: Green for 'Qualified' (can use 'default' too)
            "border-transparent bg-green-600 text-white hover:bg-green-600/80 dark:bg-green-700 dark:hover:bg-green-700/80",
        warning: // Example: Yellow/Orange for 'Negotiation'
            "border-transparent bg-amber-500 text-black hover:bg-amber-500/80 dark:bg-amber-600 dark:text-white dark:hover:bg-amber-600/80",

      },
    },
    defaultVariants: {
      variant: "outline", // Changed default to outline
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
