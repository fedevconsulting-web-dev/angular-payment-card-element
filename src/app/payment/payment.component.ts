import { Component, CUSTOM_ELEMENTS_SCHEMA, EventEmitter, Output, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidatorFn, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  encapsulation: ViewEncapsulation.ShadowDom
})
export class PaymentComponent {
  @Output() paymentSuccess = new EventEmitter<any>();
  @Output() paymentError = new EventEmitter<string>();

  form: FormGroup;
  cardType = '';
  isFlipped = false;
  loading = false;
  success = false;
  errorMessage = '';

  private cardNumberControl!: AbstractControl;
  private expDateControl!: AbstractControl;
  private cvcControl!: AbstractControl;
  private postalCodeControl!: AbstractControl;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      cardNumber: ['', [Validators.required]],
      expDate:  ['', [Validators.required, this.expValidator()]],
      cvc:  ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
      postalCode:  ['', [Validators.required]]
    });

    // Cache controls after form creation
    this.cardNumberControl = this.form.get('cardNumber')!;
    this.expDateControl = this.form.get('expDate')!;
    this.cvcControl = this.form.get('cvc')!;
    this.postalCodeControl = this.form.get('postalCode')!;

    this.cardNumberControl.valueChanges.subscribe(val => this.onCardNumberChange(val || ''));
    this.expDateControl.valueChanges.subscribe(val => this.onExpDateChange(val || ''));
  }

  private detectAndSetCardType(cardNum: string) {
    let type = '';

    // detect CC Type
    if (cardNum.startsWith('4')) type = 'Visa';
    else if (/^5[1-5]/.test(cardNum)) type = 'Mastercard';
    else if (/^3[47]/.test(cardNum)) type = 'American Express';
    else if (/^6/.test(cardNum)) type = 'Discover';

    this.cardType = type;
    this.validateCvc(type);
  }

  /**
   * validate Expiration Date
   */
  expValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      const value = control.value || '';

      if (!/^\d{2}\/\d{2}$/.test(value)) return { invalidFormat: true };

      const [mm, yy] = value.split('/').map(Number);

      if (mm < 1 || mm > 12) return { invalidMonth: true };

      const currentYear = new Date().getFullYear() % 100,
            currentMonth = new Date().getMonth() + 1;

      // prior expiration Date check
      if (yy < currentYear || (yy === currentYear && mm < currentMonth)) {
        return { expired: true };
      }

      return null;
    };
  }

  handleFocus(event: FocusEvent) {
    const target = event.target as HTMLInputElement;
    const controlName = target.getAttribute('formControlName');
    this.isFlipped = controlName === 'cvc';
  }

  /**
   * Card Number formatting / validating on field change
   *
   * @param value
   */
  private onCardNumberChange(value: string) {
    const cleaned = value.replace(/\D/g, ''),
          formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ').trim();

    // Update value if formatting changed
    if (formatted !== value) {
      this.cardNumberControl.setValue(formatted, { emitEvent: false });
    }

    this.detectAndSetCardType(cleaned);
    this.validateLuhn(cleaned);
  }

  /**
   * Expiration Date formatting
   *
   * @param exDateVal
   */
  private onExpDateChange(exDateVal: string) {
    let cleaned = exDateVal.replace(/\D/g, '').slice(0, 4),
        formatted = cleaned;

    if (cleaned.length > 2) {
      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    }

    if (formatted !== exDateVal) {
      this.expDateControl.setValue(formatted, { emitEvent: false });
    }
  }

  /**
   * check CVC field validity, based on Card Type
   * @param cardType
   */
  private validateCvc(cardType: string) {
    const cvcControl = this.cvcControl;

    if (!cvcControl) return;

    // CVC is different format for AMEX
    if (this.cardType === 'American Express') {
      this.cvcControl.setValidators([Validators.required, Validators.pattern(/^\d{4}$/)]);
    } else {
      this.cvcControl.setValidators([Validators.required, Validators.pattern(/^\d{3}$/)]);
    }

    this.cvcControl.updateValueAndValidity({ emitEvent: false });
  }

  /**
   * validate CC Number
   *
   * @param cardNum
   */
  private validateLuhn(cardNum: string) {
    if (!cardNum) return;

    let sum = 0,
        alternate = false;

    for (let i = cardNum.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNum[i], 10);

      if (alternate) {
        digit *= 2;

        if (digit > 9) digit -= 9;
      }

      sum += digit;
      alternate = !alternate;
    }

    if (sum % 10 !== 0) {
      this.cardNumberControl.setErrors({ ...this.cardNumberControl.errors, luhn: true });
    } else if (this.cardNumberControl.hasError('luhn')) {
      const { luhn, ...errors } = this.cardNumberControl.errors || {};
      this.cardNumberControl.setErrors(Object.keys(errors).length ? errors : null);
    }
  }

  async onSubmit() {
    if (this.form.invalid) {
      Object.keys(this.form.controls).forEach(key => this.form.get(key)?.markAsTouched());

      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.success = false;

    try {
      // Simulate tokenization (in real app → call provider like Stripe)
      await new Promise(resolve => setTimeout(resolve, 1200));
      const token = `tok_${Math.random().toString(36).substr(2, 12)}`;

      // Simulate payment - should account for possible failure
      await new Promise(resolve => setTimeout(resolve, 1200));
      const shouldSucceed = Math.random() > 0.15; // ~85% success rate

      if (shouldSucceed) {
        this.success = true;
        this.paymentSuccess.emit({ token, status: 'succeeded', transactionId: `txn_${Date.now()}` });
      } else {
        throw new Error('Payment declined');
      }
    } catch (e) {
      this.errorMessage = 'Payment failed – please try another card.';
      this.paymentError.emit(this.errorMessage);
    } finally {
      this.loading = false;
    }
  }

  /**
   * generic INPUT validation
   *
   * @param field
   * @returns error message for a particular field
   */
  getError(field: string): string {
    const control = this.form.get(field);

    // empty error fields
    if (!control?.touched || !control?.errors) return '';

    if (control.errors['required']) return 'This field is required';

    if (field === 'cardNumber' && control.errors['luhn']) return 'Invalid card number';

    if (field === 'expDate') {
      if (control.errors['invalidFormat']) return 'Format: MM/YY';

      if (control.errors['invalidMonth']) return 'Invalid month';

      if (control.errors['expired']) return 'Card expired';
    }

    return 'Invalid value';
  }
}
