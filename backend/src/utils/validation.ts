export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  // At least 8 characters, one uppercase, one lowercase, one number, one special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const validatePhone = (phone: string): boolean => {
  // Basic international phone number validation
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,15}$/;
  return phoneRegex.test(phone);
};

export const validatePassportNumber = (passportNumber: string): boolean => {
  // Basic passport number validation (6-9 alphanumeric characters)
  const passportRegex = /^[A-Z0-9]{6,9}$/;
  return passportRegex.test(passportNumber.toUpperCase());
};

export const validateCountryCode = (countryCode: string): boolean => {
  // ISO 3166-1 alpha-2 country code
  const countryCodeRegex = /^[A-Z]{2}$/;
  return countryCodeRegex.test(countryCode.toUpperCase());
};

export const validateDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

export const validateDateOfBirth = (dateOfBirth: string): boolean => {
  if (!validateDate(dateOfBirth)) {
    return false;
  }

  const dob = new Date(dateOfBirth);
  const now = new Date();
  const age = now.getFullYear() - dob.getFullYear();
  
  // Must be at least 18 years old and not more than 120 years old
  return age >= 18 && age <= 120;
};

export const validateFutureDate = (dateString: string): boolean => {
  if (!validateDate(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  const now = new Date();
  
  return date > now;
};

export const validateCurrency = (currency: string): boolean => {
  // ISO 4217 currency codes
  const validCurrencies = ['USD', 'EUR', 'GBP', 'GHS', 'NGN', 'XOF', 'XAF'];
  return validCurrencies.includes(currency.toUpperCase());
};

export const validateAmount = (amount: number): boolean => {
  return typeof amount === 'number' && amount > 0 && amount <= 10000;
};

export const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input.trim().replace(/[<>]/g, '');
};

export const validateName = (name: string): boolean => {
  // Allow letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z\s\-']{1,50}$/;
  return nameRegex.test(name);
};

export const validateAddress = (address: string): boolean => {
  // Basic address validation
  return address.length >= 10 && address.length <= 200;
};

export const validatePostalCode = (postalCode: string): boolean => {
  // Basic postal code validation (flexible for different countries)
  const postalCodeRegex = /^[A-Z0-9\s\-]{3,10}$/;
  return postalCodeRegex.test(postalCode.toUpperCase());
};

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export const validateApplicantData = (data: any): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!data.first_name || !validateName(data.first_name)) {
    errors.push({
      field: 'first_name',
      message: 'Valid first name is required (1-50 characters, letters only)',
      code: 'INVALID_FIRST_NAME',
    });
  }

  if (!data.last_name || !validateName(data.last_name)) {
    errors.push({
      field: 'last_name',
      message: 'Valid last name is required (1-50 characters, letters only)',
      code: 'INVALID_LAST_NAME',
    });
  }

  if (data.middle_name && !validateName(data.middle_name)) {
    errors.push({
      field: 'middle_name',
      message: 'Valid middle name required if provided (1-50 characters, letters only)',
      code: 'INVALID_MIDDLE_NAME',
    });
  }

  if (!data.date_of_birth || !validateDateOfBirth(data.date_of_birth)) {
    errors.push({
      field: 'date_of_birth',
      message: 'Valid date of birth is required (must be 18+ years old)',
      code: 'INVALID_DATE_OF_BIRTH',
    });
  }

  if (!data.nationality || !validateCountryCode(data.nationality)) {
    errors.push({
      field: 'nationality',
      message: 'Valid nationality country code is required',
      code: 'INVALID_NATIONALITY',
    });
  }

  if (!data.passport_number || !validatePassportNumber(data.passport_number)) {
    errors.push({
      field: 'passport_number',
      message: 'Valid passport number is required (6-9 alphanumeric characters)',
      code: 'INVALID_PASSPORT_NUMBER',
    });
  }

  if (!data.passport_country || !validateCountryCode(data.passport_country)) {
    errors.push({
      field: 'passport_country',
      message: 'Valid passport issuing country code is required',
      code: 'INVALID_PASSPORT_COUNTRY',
    });
  }

  if (!data.current_address || !validateAddress(data.current_address)) {
    errors.push({
      field: 'current_address',
      message: 'Valid current address is required (10-200 characters)',
      code: 'INVALID_CURRENT_ADDRESS',
    });
  }

  if (!data.current_city || !validateName(data.current_city)) {
    errors.push({
      field: 'current_city',
      message: 'Valid current city is required',
      code: 'INVALID_CURRENT_CITY',
    });
  }

  if (!data.current_country || !validateCountryCode(data.current_country)) {
    errors.push({
      field: 'current_country',
      message: 'Valid current country code is required',
      code: 'INVALID_CURRENT_COUNTRY',
    });
  }

  if (data.current_postal_code && !validatePostalCode(data.current_postal_code)) {
    errors.push({
      field: 'current_postal_code',
      message: 'Valid postal code required if provided',
      code: 'INVALID_POSTAL_CODE',
    });
  }

  if (!Array.isArray(data.address_history) || data.address_history.length === 0) {
    errors.push({
      field: 'address_history',
      message: 'Address history is required (minimum 5 years)',
      code: 'INVALID_ADDRESS_HISTORY',
    });
  }

  return errors;
};

export const validateApplicationData = (data: any): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!data.destination_country || !validateCountryCode(data.destination_country)) {
    errors.push({
      field: 'destination_country',
      message: 'Valid destination country code is required',
      code: 'INVALID_DESTINATION_COUNTRY',
    });
  }

  if (!data.intended_arrival_date || !validateFutureDate(data.intended_arrival_date)) {
    errors.push({
      field: 'intended_arrival_date',
      message: 'Valid future arrival date is required',
      code: 'INVALID_ARRIVAL_DATE',
    });
  }

  if (data.intended_departure_date && !validateFutureDate(data.intended_departure_date)) {
    errors.push({
      field: 'intended_departure_date',
      message: 'Valid future departure date required if provided',
      code: 'INVALID_DEPARTURE_DATE',
    });
  }

  if (!data.intended_address || !validateAddress(data.intended_address)) {
    errors.push({
      field: 'intended_address',
      message: 'Valid intended address is required (10-200 characters)',
      code: 'INVALID_INTENDED_ADDRESS',
    });
  }

  if (!data.intended_city || !validateName(data.intended_city)) {
    errors.push({
      field: 'intended_city',
      message: 'Valid intended city is required',
      code: 'INVALID_INTENDED_CITY',
    });
  }

  if (!data.purpose_of_visit || data.purpose_of_visit.trim().length < 5) {
    errors.push({
      field: 'purpose_of_visit',
      message: 'Purpose of visit is required (minimum 5 characters)',
      code: 'INVALID_PURPOSE_OF_VISIT',
    });
  }

  return errors;
};