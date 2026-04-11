/**
 * Integrations Service Layer
 * Wraps external APIs from the public-apis list for use within Fabb.booking.
 */

export interface PhoneValidationResult {
  valid: boolean;
  carrier?: string;
  location?: string;
  type?: string;
  error?: string;
}

export interface EmailValidationResult {
  valid: boolean;
  disposable: boolean;
  score: number;
  error?: string;
}

export interface WeatherData {
  temp: number;
  condition: string;
  description: string;
  icon: string;
  city: string;
}

export interface ExchangeRates {
  base: string;
  date: string;
  rates: Record<string, number>;
}

class IntegrationsService {
  /**
   * Phone Validation using Numverify API
   */
  async validatePhone(phone: string, apiKey: string): Promise<PhoneValidationResult> {
    if (!apiKey) return { valid: true }; // Fallback if no key
    try {
      const resp = await fetch(`http://apilayer.net/api/validate?access_key=${apiKey}&number=${phone}&country_code=IN&format=1`);
      const data = await resp.json();
      return {
        valid: data.valid,
        carrier: data.carrier,
        location: data.location,
        type: data.line_type,
      };
    } catch (error: any) {
      return { valid: true, error: error.message };
    }
  }

  /**
   * Email Validation using Cloudmersive or a similar provider
   */
  async validateEmail(email: string, apiKey: string): Promise<EmailValidationResult> {
    if (!apiKey) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return { valid: emailRegex.test(email), disposable: false, score: 100 };
    }
    try {
      // Example using a placeholder for Cloudmersive or similar
      const resp = await fetch('https://api.cloudmersive.com/validate/email/address/full', {
        method: 'POST',
        headers: { 'Apikey': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(email),
      });
      const data = await resp.json();
      return {
        valid: data.ValidAddress,
        disposable: data.IsDisposable,
        score: 100, // Cloudmersive doesn't return a "score" in this format, but we can adapt
      };
    } catch (error: any) {
      return { valid: true, disposable: false, score: 100, error: error.message };
    }
  }

  /**
   * Currency Exchange Rates using Exchangerate.host
   */
  async getExchangeRates(base: string = 'INR'): Promise<ExchangeRates | null> {
    try {
      const resp = await fetch(`https://api.exchangerate.host/latest?base=${base}`);
      const data = await resp.json();
      return {
        base: data.base,
        date: data.date,
        rates: data.rates,
      };
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
      return null;
    }
  }

  /**
   * Weather Forecast using OpenWeatherMap
   */
  async getWeather(city: string, apiKey: string): Promise<WeatherData | null> {
    if (!apiKey) return null;
    try {
      const resp = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city},IN&appid=${apiKey}&units=metric`);
      const data = await resp.json();
      if (data.cod !== 200) return null;
      return {
        temp: Math.round(data.main.temp),
        condition: data.weather[0].main,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        city: data.name,
      };
    } catch (error) {
      console.error('Failed to fetch weather:', error);
      return null;
    }
  }
}

export const integrations = new IntegrationsService();
