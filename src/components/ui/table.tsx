// src/components/ui/table.tsx

import * as React from "react"
import { cn } from "@/lib/utils"
import { motion, HTMLMotionProps } from "framer-motion"

// Exclude conflicting props from HTMLMotionProps for table and tr
type MotionTableProps = Omit<
  HTMLMotionProps<"table">,
  "onAnimationStart" | "onAnimationEnd" | "onAnimationIteration" | "onDrag" | "onDragStart" | "onDragEnd" | "onDragOver" | "style"
>
type MotionTableRowProps = Omit<
  HTMLMotionProps<"tr">,
  "onAnimationStart" | "onAnimationEnd" | "onAnimationIteration" | "onDrag" | "onDragStart" | "onDragEnd" | "onDragOver" | "style"
>

export const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, style, ...props }, ref) => (
  <motion.table
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
    ref={ref}
    className={cn(
      "w-full caption-bottom text-sm bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg shadow-md",
      className
    )}
    style={style as React.CSSProperties}
    {...props as MotionTableProps}
  />
))
Table.displayName = "Table"

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, style, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      "[&_tr]:border-b border-gray-200 dark:border-gray-700",
      className
    )}
    style={style as React.CSSProperties}
    {...props}
  />
))
TableHeader.displayName = "TableHeader"

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, style, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    style={style as React.CSSProperties}
    {...props}
  />
))
TableBody.displayName = "TableBody"

export const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, style, ...props }, ref) => (
  <motion.tr
    ref={ref}
    className={cn(
      "border-b border-gray-200 dark:border-gray-700 transition-colors hover:bg-gradient-to-r hover:from-green-500/10 hover:to-blue-500/10 data-[state=selected]:bg-muted",
      className
    )}
    whileHover={{ scale: 1.01 }}
    transition={{ duration: 0.2 }}
    style={style as React.CSSProperties}
    {...props as MotionTableRowProps}
  />
))
TableRow.displayName = "TableRow"

export const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, style, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-semibold text-foreground bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent [&:has([role=checkbox])]:pr-0",
      className
    )}
    style={style as React.CSSProperties}
    {...props}
  />
))
TableHead.displayName = "TableHead"

export const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, style, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-4 align-middle [&:has([role=checkbox])]:pr-0",
      className
    )}
    style={style as React.CSSProperties}
    {...props}
  />
))
TableCell.displayName = "TableCell"