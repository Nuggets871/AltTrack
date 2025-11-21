import { Component, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { NotebookService } from '../../services/notebook.service';
import { DayType, SpecialRuleType, CreateNotebookInput } from '../../models/notebook.model';

@Component({
  selector: 'app-notebook-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './notebook-form.component.html',
  styleUrl: './notebook-form.component.css'
})
export class NotebookFormComponent {
  @Output() closeForm = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly notebookService = inject(NotebookService);

  notebookForm: FormGroup;
  weekPattern = signal<DayType[]>([
    DayType.SCHOOL,
    DayType.SCHOOL,
    DayType.COMPANY,
    DayType.COMPANY,
    DayType.COMPANY,
    DayType.OFF,
    DayType.OFF
  ]);

  dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  dayTypes = Object.values(DayType);
  specialRuleTypes = Object.values(SpecialRuleType);
  zones = ['A', 'B', 'C'];

  loading = this.notebookService.loading;
  error = this.notebookService.error;

  constructor() {
    this.notebookForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      startDate: ['', Validators.required],
      endDate: [''],
      durationInWeeks: [null],
      locationZone: ['A', Validators.required],
      specialRules: this.fb.array([]),
      overrides: this.fb.array([]),
      specialPeriods: this.fb.array([])
    });
  }

  get specialRulesArray(): FormArray {
    return this.notebookForm.get('specialRules') as FormArray;
  }

  get overridesArray(): FormArray {
    return this.notebookForm.get('overrides') as FormArray;
  }

  get specialPeriodsArray(): FormArray {
    return this.notebookForm.get('specialPeriods') as FormArray;
  }

  toggleDayType(dayIndex: number): void {
    const currentPattern = this.weekPattern();
    const currentType = currentPattern[dayIndex];
    const types = Object.values(DayType);
    const currentIndex = types.indexOf(currentType);
    const nextIndex = (currentIndex + 1) % types.length;

    const newPattern = [...currentPattern];
    newPattern[dayIndex] = types[nextIndex];
    this.weekPattern.set(newPattern);
  }

  getDayTypeLabel(type: DayType): string {
    switch(type) {
      case DayType.SCHOOL: return '📚 École';
      case DayType.COMPANY: return '💼 Entreprise';
      case DayType.OFF: return '🏖️ Repos';
    }
  }

  getDayTypeColor(type: DayType): string {
    switch(type) {
      case DayType.SCHOOL: return 'btn-info';
      case DayType.COMPANY: return 'btn-success';
      case DayType.OFF: return 'btn-neutral';
    }
  }

  addSpecialRule(): void {
    const ruleGroup = this.fb.group({
      type: [SpecialRuleType.FULL_SCHOOL, Validators.required],
      startDate: ['', Validators.required]
    });
    this.specialRulesArray.push(ruleGroup);
  }

  removeSpecialRule(index: number): void {
    this.specialRulesArray.removeAt(index);
  }

  addOverride(): void {
    const overrideGroup = this.fb.group({
      date: ['', Validators.required],
      dayType: [DayType.OFF, Validators.required]
    });
    this.overridesArray.push(overrideGroup);
  }

  removeOverride(index: number): void {
    this.overridesArray.removeAt(index);
  }

  addSpecialPeriod(): void {
    const periodGroup = this.fb.group({
      name: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      type: [DayType.OFF, Validators.required]
    });
    this.specialPeriodsArray.push(periodGroup);
  }

  removeSpecialPeriod(index: number): void {
    this.specialPeriodsArray.removeAt(index);
  }

  onSubmit(): void {
    if (this.notebookForm.invalid) {
      this.notebookForm.markAllAsTouched();
      return;
    }

    const formValue = this.notebookForm.value;
    const input: CreateNotebookInput = {
      name: formValue.name,
      startDate: formValue.startDate,
      endDate: formValue.endDate || undefined,
      durationInWeeks: formValue.durationInWeeks || undefined,
      locationZone: formValue.locationZone,
      weekPatternJson: this.weekPattern(),
      specialRules: formValue.specialRules.length > 0 ? formValue.specialRules : undefined,
      overrides: formValue.overrides.length > 0 ? formValue.overrides : undefined,
      specialPeriods: formValue.specialPeriods.length > 0 ? formValue.specialPeriods : undefined
    };

    this.notebookService.createNotebook(input).subscribe({
      next: () => {
        this.closeForm.emit();
      }
    });
  }

  onCancel(): void {
    this.closeForm.emit();
  }
}

