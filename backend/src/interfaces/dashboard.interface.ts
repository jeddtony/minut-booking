export interface DashboardSummary {
  total_units: number;
  active_reservations: number;
  occupancy_rate: number;
  checkins_today: number;
  checkouts_today: number;
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
