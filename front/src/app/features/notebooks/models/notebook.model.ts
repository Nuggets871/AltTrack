export enum DayType {
  SCHOOL = 'SCHOOL',
  COMPANY = 'COMPANY',
  OFF = 'OFF'
}

export enum SpecialRuleType {
  FULL_SCHOOL = 'FULL_SCHOOL',
  FULL_COMPANY = 'FULL_COMPANY'
}

export interface SpecialRule {
  id: string;
  type: SpecialRuleType;
  startDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotebookOverride {
  id: string;
  date: Date;
  dayType: DayType;
  createdAt: Date;
  updatedAt: Date;
}

export interface SpecialPeriod {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  type: DayType;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notebook {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date | null;
  durationInWeeks: number | null;
  locationZone: string;
  weekPatternJson: DayType[];
  userId: string;
  specialRules: SpecialRule[];
  overrides: NotebookOverride[];
  specialPeriods: SpecialPeriod[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNotebookInput {
  name: string;
  startDate: string;
  endDate?: string;
  durationInWeeks?: number;
  locationZone: string;
  weekPatternJson: DayType[];
  specialRules?: Array<{
    type: SpecialRuleType;
    startDate: string;
  }>;
  overrides?: Array<{
    date: string;
    dayType: DayType;
  }>;
  specialPeriods?: Array<{
    name: string;
    startDate: string;
    endDate: string;
    type: DayType;
  }>;
}

export interface UpdateNotebookInput {
  name?: string;
  startDate?: string;
  endDate?: string;
  durationInWeeks?: number;
  locationZone?: string;
  weekPatternJson?: DayType[];
  specialRules?: Array<{
    type: SpecialRuleType;
    startDate: string;
  }>;
  overrides?: Array<{
    date: string;
    dayType: DayType;
  }>;
  specialPeriods?: Array<{
    name: string;
    startDate: string;
    endDate: string;
    type: DayType;
  }>;
}

