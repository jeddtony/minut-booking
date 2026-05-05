import { NextFunction, Request, Response } from 'express';
import { HttpStatus } from '@constants/http-status';
import { DashboardService } from '@services/dashboard.service';
import { HttpException } from '@exceptions/HttpException';

const isValidDate = (value: string): boolean => !isNaN(Date.parse(value));

export class DashboardController {
  private dashboardService = new DashboardService();

  public getWeeklyAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { start_date, end_date, property_id } = req.query as Record<string, string | undefined>;

      if (!start_date) {
        next(new HttpException(HttpStatus.BAD_REQUEST, 'start_date is required'));
        return;
      }
      if (!isValidDate(start_date)) {
        next(new HttpException(HttpStatus.BAD_REQUEST, 'start_date must be a valid ISO date string (e.g. 2024-10-12)'));
        return;
      }
      if (end_date && !isValidDate(end_date)) {
        next(new HttpException(HttpStatus.BAD_REQUEST, 'end_date must be a valid ISO date string (e.g. 2024-10-18)'));
        return;
      }
      if (end_date && new Date(start_date) >= new Date(end_date)) {
        next(new HttpException(HttpStatus.BAD_REQUEST, 'start_date must be before end_date'));
        return;
      }

      const data = await this.dashboardService.getWeeklyAvailability(start_date, end_date, property_id);
      res.status(HttpStatus.OK).json(data);
    } catch (error) {
      next(error);
    }
  };

  public getMonthlyAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { month, property_id } = req.query as Record<string, string | undefined>;

      if (!month) {
        next(new HttpException(HttpStatus.BAD_REQUEST, 'month is required (e.g. 2024-10)'));
        return;
      }
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
        next(new HttpException(HttpStatus.BAD_REQUEST, 'month must be in YYYY-MM format (e.g. 2024-10)'));
        return;
      }

      const data = await this.dashboardService.getMonthlyAvailability(month, property_id);
      res.status(HttpStatus.OK).json(data);
    } catch (error) {
      next(error);
    }
  };
}
