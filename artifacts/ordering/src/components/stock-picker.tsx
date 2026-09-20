import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface StockPickerProps {
  value?: string;
  onChange: (value: string, item: any) => void;
  items: any[];
  disabled?: boolean;
}

export function StockPicker({ value, onChange, items, disabled }: StockPickerProps) {
  const [open, setOpen] = React.useState(false)

  const selectedItem = React.useMemo(() => 
    items.find((item) => item.partNumber === value),
  [value, items])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal hover:bg-background"
        >
          {selectedItem ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{selectedItem.partNumber}</span>
              <span className="truncate">{selectedItem.itemName}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">Select part number...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search part number or name..." />
          <CommandList>
            <CommandEmpty>No stock items found.</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.partNumber}
                  value={`${item.partNumber} ${item.itemName}`}
                  onSelect={() => {
                    onChange(item.partNumber, item)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === item.partNumber ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-sm">{item.itemName}</span>
                    <span className="font-mono text-xs text-muted-foreground">{item.partNumber}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}