import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface StockPickerProps {
  value?: string;
  onChange: (value: string, item: any) => void;
  items: any[];
  disabled?: boolean;
}

export function StockPicker({ value, onChange, items, disabled }: StockPickerProps) {
  return (
    <Select
      value={value || undefined}
      onValueChange={(partNumber) => {
        const item = items.find((stockItem) => stockItem.partNumber === partNumber);
        if (item) {
          onChange(partNumber, item);
        }
      }}
      disabled={disabled}
    >
      <SelectTrigger className="w-full font-normal">
        <SelectValue placeholder="Select part number..." />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.partNumber} value={item.partNumber}>
            <span className="font-mono text-xs">{item.partNumber}</span>
            <span className="ml-2">{item.itemName}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}