import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { EnvironmentService } from '@core/services/environment.service';
import { Logger } from '@shared/utils/logger.util';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  private readonly environmentService = inject(EnvironmentService);
  title = 'front';

  ngOnInit(): void {
    Logger.initialize(this.environmentService);
    Logger.info('AppComponent', 'Application initialisée', {
      environment: this.environmentService.getEnvironment()
    });
  }
}
