import { APP_INITIALIZER, Injector } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { PaymentComponent } from './app/payment/payment.component';

bootstrapApplication(AppComponent, {
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: (injector: Injector) => () => {
        const paymentElement = createCustomElement(PaymentComponent, { injector });
        customElements.define('secure-payment-card', paymentElement);
      },
      multi: true,
      deps: [Injector],
    },
  ],
});
