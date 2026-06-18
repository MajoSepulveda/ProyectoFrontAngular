import { Component } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';

@Component({
  selector: 'app-branding',
  imports: [],
  template: `
    <a href="/">
      <img
        src="./assets/images/logos/logo-uc2.png"
        class="align-middle m-2"
        alt="logo"
        style="max-height:50px;width:auto"
      />
    </a>
  `,
})
export class BrandingComponent {
  options = this.settings.getOptions();
  constructor(private settings: CoreService) {}
}
