import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 justify-center w-full",
        month: "space-y-6 w-full",
        caption: "flex justify-center pt-2 relative items-center mb-6",
        caption_label: "text-lg font-black uppercase tracking-widest text-zinc-950 dark:text-zinc-50",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-9 w-9 bg-white dark:bg-zinc-800 border-2 border-black dark:border-zinc-700 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-700 shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_rgba(255,255,255,0.05)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all flex items-center justify-center text-black dark:text-white"
        ),
        nav_button_previous: "absolute left-2",
        nav_button_next: "absolute right-2",
        table: "w-full border-collapse",
        head_row: "flex w-full justify-between mb-4 px-1",
        head_cell:
          "text-zinc-500 dark:text-zinc-400 flex-1 font-black uppercase text-[0.75rem] tracking-widest text-center",
        row: "flex w-full justify-between mt-2 px-1",
        cell: "h-14 flex-1 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-12 w-12 p-0 font-black hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-none transition-all border-2 border-transparent text-black dark:text-white aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-[#1e3a8a] text-white hover:bg-[#1e40af] hover:text-white focus:bg-[#1e3a8a] focus:text-white rounded-none border-2 border-black dark:border-zinc-700 shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_rgba(255,255,255,0.1)]",
        day_today: "bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white border-2 border-black dark:border-zinc-600 font-black",
        day_outside:
          "day-outside text-muted-foreground opacity-20 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
