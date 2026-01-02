import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { PaymentComponent } from './payment.component';
import { By } from '@angular/platform-browser';

describe('PaymentComponent', () => {
  let component: PaymentComponent;
  let fixture: ComponentFixture<PaymentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, PaymentComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with required validators', () => {
    expect(component.form.get('cardNumber')?.hasValidator(Validators.required)).toBeTrue();
    expect(component.form.get('expDate')?.hasValidator(Validators.required)).toBeTrue();
    expect(component.form.get('cvc')?.hasValidator(Validators.required)).toBeTrue();
    expect(component.form.get('postalCode')?.hasValidator(Validators.required)).toBeTrue();
  });

  it('should format card number with spaces and detect card type', fakeAsync(() => {
    const cardNumberControl = component.form.get('cardNumber')!;
    cardNumberControl.setValue('4111111111111111');
    tick(); // Flush valueChanges subscription
    fixture.detectChanges();

    expect(cardNumberControl.value).toBe('4111 1111 1111 1111');
    expect(component.cardType).toBe('Visa');

    const previewNumber = fixture.nativeElement.shadowRoot.querySelector('.card-number')?.textContent?.trim();
    expect(previewNumber).toBe('4111 1111 1111 1111');
    const previewType = fixture.nativeElement.shadowRoot.querySelector('.card-type')?.textContent?.trim();
    expect(previewType).toBe('Visa');
  }));

  it('should validate Luhn algorithm (valid card)', fakeAsync(() => {
    component.form.get('cardNumber')?.setValue('4242424242424242'); // Valid Visa
    tick();
    fixture.detectChanges();

    expect(component.form.get('cardNumber')?.hasError('luhn')).toBeFalse();
  }));

  it('should validate Luhn algorithm (invalid card)', fakeAsync(() => {
    component.form.get('cardNumber')?.setValue('4242424242424241'); // Invalid
    tick();
    fixture.detectChanges();

    expect(component.form.get('cardNumber')?.hasError('luhn')).toBeTrue();
  }));

  it('should update CVC validator to 4 digits for American Express', fakeAsync(() => {
    component.form.get('cardNumber')?.setValue('378282246310005'); // Amex
    tick();
    fixture.detectChanges();

    const cvcControl = component.form.get('cvc')!;
    expect(cvcControl.hasValidator(Validators.pattern(/^\d{4}$/))).toBeTrue();

    // Test valid 4-digit CVC
    cvcControl.setValue('1234');
    expect(cvcControl.valid).toBeTrue();

    // Test invalid 3-digit CVC
    cvcControl.setValue('123');
    expect(cvcControl.invalid).toBeTrue();
  }));

  it('should update CVC validator to 3 digits for non-Amex cards', fakeAsync(() => {
    component.form.get('cardNumber')?.setValue('4111111111111111'); // Visa
    tick();
    fixture.detectChanges();

    const cvcControl = component.form.get('cvc')!;
    expect(cvcControl.hasValidator(Validators.pattern(/^\d{3}$/))).toBeTrue();

    cvcControl.setValue('123');
    expect(cvcControl.valid).toBeTrue();

    cvcControl.setValue('1234');
    expect(cvcControl.invalid).toBeTrue();
  }));

  it('should format expiry date as MM/YY', fakeAsync(() => {
    component.form.get('expDate')?.setValue('1234');
    tick();
    fixture.detectChanges();

    expect(component.form.get('expDate')?.value).toBe('12/34');

    const previewExp = fixture.nativeElement.shadowRoot.querySelector('.card-exp')?.textContent?.trim();
    expect(previewExp).toBe('12/34');
  }));

  it('should flip card when focusing CVC field', () => {
    const cvcInput = fixture.debugElement.query(By.css('input[formControlName="cvc"]'));
    cvcInput.nativeElement.dispatchEvent(new Event('focus'));
    fixture.detectChanges();

    const card = fixture.nativeElement.shadowRoot.querySelector('.card');
    expect(card.classList.contains('flipped')).toBeTrue();

    // Focus another field to flip back
    const cardNumberInput = fixture.debugElement.query(By.css('input[formControlName="cardNumber"]'));
    cardNumberInput.nativeElement.dispatchEvent(new Event('focus'));
    fixture.detectChanges();

    expect(card.classList.contains('flipped')).toBeFalse();
  });

  it('should show error messages when fields are touched and invalid', () => {
    const cardNumberControl = component.form.get('cardNumber')!;
    cardNumberControl.markAsTouched();
    cardNumberControl.setValue('');
    fixture.detectChanges();

    const errorSpan = fixture.nativeElement.shadowRoot.querySelector('#cardNumberError');
    expect(errorSpan.textContent.trim()).toBe('This field is required');
  });

  it('should emit paymentSuccess on successful submission', fakeAsync(() => {
    spyOn(Math, 'random').and.returnValue(0.9); // Force success (> 0.15)
    spyOn(component.paymentSuccess, 'emit');

    // Fill valid data
    component.form.get('cardNumber')?.setValue('4242424242424242');
    component.form.get('expDate')?.setValue('12/30');
    component.form.get('cvc')?.setValue('123');
    component.form.get('postalCode')?.setValue('90210');
    tick();
    fixture.detectChanges();

    component.onSubmit();
    tick(2400); // Simulate delays
    fixture.detectChanges();

    expect(component.loading).toBeFalse();
    expect(component.success).toBeTrue();
    expect(component.paymentSuccess.emit).toHaveBeenCalledWith(jasmine.objectContaining({ status: 'succeeded' }));
  }));

  it('should emit paymentError on failed submission', fakeAsync(() => {
    spyOn(Math, 'random').and.returnValue(0.1); // Force failure (<= 0.15)
    spyOn(component.paymentError, 'emit');

    // Fill valid data
    component.form.patchValue({
      cardNumber: '4242424242424242',
      expDate: '12/30',
      cvc: '123',
      postalCode: '90210',
    });
    tick();
    fixture.detectChanges();

    component.onSubmit();
    tick(2400);
    fixture.detectChanges();

    expect(component.loading).toBeFalse();
    expect(component.errorMessage).toBe('Payment failed – please try another card.');
    expect(component.paymentError.emit).toHaveBeenCalledWith('Payment failed – please try another card.');
  }));

  it('should disable submit button when form invalid or loading', () => {
    const button = fixture.nativeElement.shadowRoot.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBeTrue(); // Initially invalid

    component.loading = true;
    fixture.detectChanges();
    expect(button.disabled).toBeTrue();
  });
});
