// components/ui/label.tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const labelVariants = cva("block text-sm font-medium leading-none", {
  variants: {
    variant: {
      default: "text-foreground",
      subtle: "text-muted-foreground",
    },
    size: {
      default: "mb-1",
      sm: "mb-0.5 text-xs",
      lg: "mb-2 text-base",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> {}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, variant, size, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(labelVariants({ variant, size, className }))}
      {...props}
    />
  )
);

Label.displayName = "Label";
