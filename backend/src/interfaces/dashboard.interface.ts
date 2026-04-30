export interface DashboardSummary {
  total_units: number;
  active_reservations: number;
  occupancy_rate: number;
  checkins_today: number;
  checkouts_today: number;
}

export interface MonthlyDashboardSummary extends DashboardSummary {
  checkins_this_month: number;
  checkouts_this_month: number;
}

export interface BookingEntry {
  id: string;
  guest_name: string;
  start_date: string;
  end_date: string;
}

export interface PropertyEntry {
  id: string;
  name: string;
  bookings: BookingEntry[];
}

export interface DayCell {
  date: string;
  reservation: { id: string; guest_name: string } | null;
}

export interface GridEntry {
  property_id: string;
  days: DayCell[];
}

export interface WeeklyAvailabilityResult {
  summary: DashboardSummary;
  week_range: { start_date: string; end_date: string };
  properties: PropertyEntry[];
  grid: GridEntry[];
}

export interface MonthRange {
  year: number;
  month: number;
  start_date: string;
  end_date: string;
  total_days: number;
}

export interface MonthlyAvailabilityResult {
  summary: MonthlyDashboardSummary;
  month_range: MonthRange;
  properties: PropertyEntry[];
  grid: GridEntry[];
}
