import * as React from "react"
import { cn } from "@/lib/utils"

const Timeline = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative", className)}
    {...props}
  />
))
Timeline.displayName = "Timeline"

const TimelineItem = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex gap-4", className)}
    {...props}
  />
))
TimelineItem.displayName = "TimelineItem"

const TimelineSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col items-center", className)}
    {...props}
  />
))
TimelineSeparator.displayName = "TimelineSeparator"

const TimelineDot = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("h-3 w-3 rounded-full", className)}
    {...props}
  />
))
TimelineDot.displayName = "TimelineDot"

const TimelineConnector = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("w-0.5 h-full bg-border", className)}
    {...props}
  />
))
TimelineConnector.displayName = "TimelineConnector"

const TimelineContent = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-1", className)}
    {...props}
  />
))
TimelineContent.displayName = "TimelineContent"

export {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
} 