import { Component, inject } from '@angular/core';
import { Nav } from "../layout/nav/nav";
import { Router, RouterOutlet } from '@angular/router';
import { ImageModal } from '../shared/image-modal/image-modal';

@Component({
  selector: 'app-root',
  imports: [Nav, RouterOutlet, ImageModal],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected router = inject(Router);
}
