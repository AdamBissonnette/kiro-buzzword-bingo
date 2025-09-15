import type { CardData } from '../types';
import { AppErrorHandler } from './errorHandler';

/**
 * Encodes card data into a URL-safe base64 string
 * Uses JSON.stringify and btoa for encoding
 */
export function encodeCardData(cardData: CardData): string {
  if (!cardData || typeof cardData !== 'object') {
    throw AppErrorHandler.createError(
      'URL_PARSING_ERROR',
      'Invalid card data provided for encoding',
      'The card data must be a valid object with title and terms.',
      false
    );
  }

  if (!cardData.title || !Array.isArray(cardData.terms) || cardData.terms.length === 0) {
    throw AppErrorHandler.createError(
      'URL_PARSING_ERROR',
      'Incomplete card data for sharing',
      'Card must have a title and at least one term to be shared.',
      false
    );
  }

  try {
    const jsonString = JSON.stringify(cardData);
    
    // Check if the data is too large for URL
    if (jsonString.length > 8000) { // Conservative limit for URL length
      throw new Error('Card data too large for URL sharing');
    }
    
    // Use btoa for base64 encoding and make it URL-safe
    const base64 = btoa(jsonString);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  } catch (error) {
    throw AppErrorHandler.handleURLError(error);
  }
}

/**
 * Decodes a URL-safe base64 string back into card data
 */
export function decodeCardData(encodedData: string): CardData {
  if (!encodedData || typeof encodedData !== 'string') {
    throw AppErrorHandler.createError(
      'URL_PARSING_ERROR',
      'No card data found in URL',
      'The shared link does not contain valid card data.',
      false
    );
  }

  try {
    // Restore base64 padding and characters
    let base64 = encodedData.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding if needed
    while (base64.length % 4) {
      base64 += '=';
    }
    
    const jsonString = atob(base64);
    if (!jsonString) {
      throw new Error('Failed to decode base64 data');
    }

    const cardData = JSON.parse(jsonString) as CardData;
    
    // Validate the decoded data has required fields
    if (!cardData || typeof cardData !== 'object') {
      throw new Error('Invalid card data structure - not an object');
    }

    if (!cardData.title || typeof cardData.title !== 'string') {
      throw new Error('Invalid card data structure - missing or invalid title');
    }

    if (!Array.isArray(cardData.terms) || cardData.terms.length === 0) {
      throw new Error('Invalid card data structure - missing or invalid terms');
    }

    // Validate terms are strings
    if (!cardData.terms.every(term => typeof term === 'string')) {
      throw new Error('Invalid card data structure - terms must be strings');
    }
    
    return cardData;
  } catch (error) {
    throw AppErrorHandler.handleURLError(error);
  }
}

/**
 * Generates a shareable URL for the given card data
 */
export function generateShareableUrl(cardData: CardData): string {
  try {
    const encodedData = encodeCardData(cardData);
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?play=true&data=${encodedData}`;
    
    // Validate URL length
    if (shareUrl.length > 2000) { // Most browsers support at least 2000 chars
      throw new Error('Generated URL is too long for reliable sharing');
    }
    
    return shareUrl;
  } catch (error) {
    if (error instanceof Error && error.message.includes('too large')) {
      throw AppErrorHandler.createError(
        'URL_PARSING_ERROR',
        'Card data too large for URL sharing',
        'This card has too many terms or too much text to share via URL. Consider reducing the number of terms.',
        false
      );
    }
    throw error; // Re-throw other errors as-is
  }
}

/**
 * Extracts card data from the current URL parameters
 */
export function getCardDataFromUrl(): CardData | null {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const encodedData = urlParams.get('data');
    
    if (!encodedData) {
      return null; // No data parameter
    }
    
    return decodeCardData(encodedData);
  } catch (error) {
    // Don't throw here, just return null and let the calling component handle the error
    console.error('Failed to extract card data from URL:', error);
    return null;
  }
}