export type DateRange = {
  from: Date;
  to?: Date;
};

export type SearchCategory = "halls" | "services";

export type SearchState = {
  category: SearchCategory;
  location: string;
  coverageArea: string;
  dateRange: DateRange | undefined;
  capacity: number | undefined;
  role: string | undefined;
  flexible: number;
  isMobileSearchOpen: boolean;
};