import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ApiError } from '../../../types/error';

@Component({
  selector: 'app-server-error',
  imports: [],
  templateUrl: './server-error.html',
  styleUrl: './server-error.css'
})
export class ServerError {
  protected error: ApiError;
  protected showDetails = false;
  private router = inject(Router);

  constructor() { 
    const navigation = this.router.currentNavigation();
    this.error = navigation?.extras?.state?.['error'];

  }

  detailToggle() {
    this.showDetails = !this.showDetails;
  }

}
