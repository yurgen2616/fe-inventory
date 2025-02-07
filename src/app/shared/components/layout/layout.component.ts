import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { FooterComponent } from '../footer/footer.component';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { SidebarService } from '../../services/sidebar.service';

@Component({
  selector: 'app-layout',
  imports: [HeaderComponent, SidebarComponent, FooterComponent, RouterOutlet, CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  standalone: true,
  templateUrl: './layout.component.html',
})
export default class LayoutComponent {
  sidebarCollapsed = false;

  constructor(private sidebarService: SidebarService) {
    this.sidebarService.isCollapsed$.subscribe(
      collapsed => this.sidebarCollapsed = collapsed
    );
  }
}
