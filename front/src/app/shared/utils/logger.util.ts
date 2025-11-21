import { inject } from '@angular/core';
import { EnvironmentService } from '@core/services/environment.service';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export class Logger {
  private static environmentService: EnvironmentService | null = null;

  static initialize(environmentService: EnvironmentService): void {
    this.environmentService = environmentService;
  }

  private static isDevelopment(): boolean {
    return this.environmentService?.isDevelopment() ?? false;
  }

  private static log(level: LogLevel, context: string, message: string, data?: any): void {
    if (!this.isDevelopment() && level === LogLevel.DEBUG) {
      return;
    }

    const timestamp = new Date().toISOString();
    const env = this.environmentService?.getEnvironment() || 'unknown';
    const prefix = `[${timestamp}] [${env.toUpperCase()}] [${level}] [${context}]`;
    const style = this.getStyle(level);

    if (data !== undefined) {
      console.log(`%c${prefix}%c ${message}`, style, '', data);
    } else {
      console.log(`%c${prefix}%c ${message}`, style, '');
    }
  }

  private static getStyle(level: LogLevel): string {
    const styles = {
      [LogLevel.DEBUG]: 'color: #9CA3AF; font-weight: bold;',
      [LogLevel.INFO]: 'color: #3B82F6; font-weight: bold;',
      [LogLevel.WARN]: 'color: #F59E0B; font-weight: bold;',
      [LogLevel.ERROR]: 'color: #EF4444; font-weight: bold;'
    };
    return styles[level];
  }

  static debug(context: string, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, context, message, data);
  }

  static info(context: string, message: string, data?: any): void {
    this.log(LogLevel.INFO, context, message, data);
  }

  static warn(context: string, message: string, data?: any): void {
    this.log(LogLevel.WARN, context, message, data);
  }

  static error(context: string, message: string, data?: any): void {
    this.log(LogLevel.ERROR, context, message, data);
  }
}

