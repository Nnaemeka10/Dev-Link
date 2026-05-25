export type DateRange = {
  from: Date;
  to?: Date;
};

export type SearchCategory = "halls" | "services";

export type SearchState = {
  category: SearchCategory;
  location: string;
  dateRange: DateRange | undefined;
  capacity: number | undefined;
  role: string | undefined;
  isMobileSearchOpen: boolean;
};