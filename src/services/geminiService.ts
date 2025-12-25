import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { GEMINI_TEXT_MODEL } from '../constants';
import type { WebsiteHomePageContent, WebsiteWhiteLabelSettings, WebsiteContactUsContent, WebsiteAboutUsContent, WebsiteSettings } from '@/types';

// Read API key from Vite env or Node env for flexibility
const API_KEY = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GOOGLE_GENAI_API_KEY) || process.env.GEMINI_API_KEY || process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY for Gemini is not set in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "MISSING_API_KEY" }); // Fallback to prevent crash

// A helper to extract a useful string from the error
const getErrorMessage = (error: any): string => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.error?.message) return error.error.message;
    try {
        return JSON.stringify(error);
    } catch {
        return String(error);
    }
};

export const generateMenuItemDescription = async (itemName: string, category: string): Promise<string> => {
  if (!API_KEY || API_KEY === "MISSING_API_KEY") {
    return "AI service is unavailable (API key missing). Please enter a description manually.";
  }
  try {
    const prompt = `Generate a captivating and concise menu item description (2-3 sentences) for a dish named "${itemName}" which is in the category "${category}". Highlight its best qualities.`;
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_TEXT_MODEL,
        contents: prompt,
    });
    const text = response.text ?? "";
    return text || "Description could not be generated. Please enter manually.";
  } catch (error: any) {
    console.error("Error generating menu item description:", error);
    
    const errorMessage = getErrorMessage(error);
    const upperCaseMessage = errorMessage.toUpperCase();

    if (upperCaseMessage.includes('429') || upperCaseMessage.includes('RESOURCE_EXHAUSTED') || upperCaseMessage.includes('QUOTA')) {
       return "AI service quota exceeded. Please check your plan. Description could not be generated.";
    }
    if (upperCaseMessage.includes('API_KEY_INVALID') || upperCaseMessage.includes('APIKEYNOTVALID')) {
        return "The provided API key is invalid. Please check your .env.local file.";
    }
    if (upperCaseMessage.includes('XHR ERROR') || upperCaseMessage.includes('FETCH_ERROR') || upperCaseMessage.includes('NETWORK')) {
        return "A network error occurred. This could be due to your internet connection, a firewall, or API key restrictions (e.g., HTTP referrer restrictions). Please check your network and API key settings.";
    }
    return "Could not generate description due to an API error. Please try again or enter manually.";
  }
};

export const suggestDailySpecial = async (): Promise<{ name: string; description: string } | null> => {
  if (!API_KEY || API_KEY === "MISSING_API_KEY") {
    return { name: "Daily Special Unavailable", description: "AI service is unavailable (API key missing)." };
  }
  try {
    const prompt = `Suggest a creative and appealing "Daily Special" dish for a restaurant. 
    Provide the dish name and a brief, enticing description (1-2 sentences).`;
    
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_TEXT_MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    name: {
                        type: Type.STRING,
                        description: "The name of the daily special dish."
                    },
                    description: {
                        type: Type.STRING,
                        description: "A brief, enticing description of the dish."
                    }
                },
                required: ["name", "description"]
            }
        }
    });

    let jsonStr = (response.text ?? "").trim();
    if (!jsonStr) {
      jsonStr = JSON.stringify({ name: "Daily Special", description: "AI suggestion unavailable. Please try again later." });
    }
    // The schema should guarantee valid JSON, but the fence removal is good practice just in case.
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }

    const parsedData = JSON.parse(jsonStr) as { name: string; description: string };
    return parsedData;

  } catch (error: any) {
    console.error("Error suggesting daily special:", error);

    const errorMessage = getErrorMessage(error);
    const upperCaseMessage = errorMessage.toUpperCase();
    let userFriendlyDescription = "Could not fetch AI suggestion due to an API error. Please try again later.";
    
    if (upperCaseMessage.includes('429') || upperCaseMessage.includes('RESOURCE_EXHAUSTED') || upperCaseMessage.includes('QUOTA')) {
       userFriendlyDescription = "You have exceeded your API quota. Please check your plan and billing details.";
       return { name: "Quota Exceeded", description: userFriendlyDescription };
    }
    if (upperCaseMessage.includes('API_KEY_INVALID') || upperCaseMessage.includes('APIKEYNOTVALID')) {
        userFriendlyDescription = "The provided API key is invalid. Please check your .env.local file.";
        return { name: "Invalid API Key", description: userFriendlyDescription };
    }
    if (upperCaseMessage.includes('XHR ERROR') || upperCaseMessage.includes('FETCH_ERROR') || upperCaseMessage.includes('NETWORK')) {
        userFriendlyDescription = "A network error occurred. This could be due to your internet connection, a firewall, or API key restrictions (e.g., HTTP referrer restrictions). Please check your network and API key settings.";
        return { name: "Network Error", description: userFriendlyDescription };
    }
    return { name: "Error Generating Special", description: userFriendlyDescription };
  }
};

/**
 * Generate structured website content (hero, services, explore menu, gallery, social, contact) and white-label settings
 * based on a user-provided prompt and optional hints.
 */
export const generateWebsiteContentFromPrompt = async (
  prompt: string,
  options?: { brandName?: string; primaryColor?: string; cuisine?: string; tone?: 'modern' | 'elegant' | 'casual' | 'luxury' }
): Promise<{ whiteLabel: WebsiteWhiteLabelSettings; homePageContent: WebsiteHomePageContent; contactUsContent?: WebsiteContactUsContent } | null> => {
  if (!API_KEY || API_KEY === "MISSING_API_KEY") {
    // Provide a minimal sensible fallback if API key is missing
    const fallbackWhiteLabel: WebsiteWhiteLabelSettings = {
      appName: options?.brandName || 'Your Restaurant',
      primaryColor: options?.primaryColor || '#0ea5e9'
    };
    const fallbackContent: WebsiteHomePageContent = {
      bannerSection: {
        title: `${fallbackWhiteLabel.appName}`,
        subtitle: options?.cuisine ? `Authentic ${options.cuisine} cuisine.` : 'Delicious food, great ambience.'
      },
      serviceSection: {
        services: [
          { id: 'svc-1', title: 'Dine-In', description: 'Comfortable seating with attentive service.', icon: 'FiCoffee' },
          { id: 'svc-2', title: 'Takeaway', description: 'Quick and convenient orders to-go.', icon: 'FiShoppingBag' },
          { id: 'svc-3', title: 'Delivery', description: 'Hot meals delivered to your door.', icon: 'FiTruck' }
        ]
      },
      exploreMenuSection: {
        title: 'Explore Menu',
        subtitle: 'Explore our popular items',
        buttonText: 'Explore Menu'
      },
      gallery: [],
      socialMedia: []
    };
    return { whiteLabel: fallbackWhiteLabel, homePageContent: fallbackContent };
  }

  try {
    const userPrompt = `
Generate restaurant website content with the following context:
- Brand Name: ${options?.brandName || 'Unknown Brand'}
- Primary Color (hex): ${options?.primaryColor || '#0ea5e9'}
- Cuisine: ${options?.cuisine || 'Restaurant'}
- Tone: ${options?.tone || 'modern'}

Core Prompt: ${prompt}

Return JSON with properties: whiteLabel, homePageContent, and optional contactUsContent.
`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: userPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            whiteLabel: {
              type: Type.OBJECT,
              properties: {
                appName: { type: Type.STRING },
                primaryColor: { type: Type.STRING },
                logoUrl: { type: Type.STRING, nullable: true },
                faviconUrl: { type: Type.STRING, nullable: true }
              },
              required: ['appName', 'primaryColor']
            },
            homePageContent: {
              type: Type.OBJECT,
              properties: {
                bannerSection: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    subtitle: { type: Type.STRING }
                  },
                  required: ['title']
                },
                serviceSection: {
                  type: Type.OBJECT,
                  properties: {
                    services: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          title: { type: Type.STRING },
                          description: { type: Type.STRING },
                          icon: { type: Type.STRING }
                        },
                        required: ['id', 'title']
                      }
                    }
                  },
                  required: ['services']
                },
                exploreMenuSection: {
                  type: Type.OBJECT,
                  properties: {
                    subtitle: { type: Type.STRING },
                    buttonText: { type: Type.STRING }
                  }
                },
                gallery: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      url: { type: Type.STRING },
                      caption: { type: Type.STRING }
                    },
                    required: ['id', 'url']
                  }
                },
                socialMedia: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      platform: { type: Type.STRING },
                      url: { type: Type.STRING }
                    },
                    required: ['platform', 'url']
                  }
                }
              },
              required: ['bannerSection', 'serviceSection']
            },
            contactUsContent: {
              type: Type.OBJECT,
              properties: {
                address: { type: Type.STRING },
                phone: { type: Type.STRING },
                email: { type: Type.STRING },
                mapUrl: { type: Type.STRING }
              }
            }
          },
          required: ['whiteLabel', 'homePageContent']
        }
      }
    });

    let raw = (response.text ?? "").trim();
    if (!raw) {
      return {
        whiteLabel: { appName: options?.brandName || 'Your Restaurant', primaryColor: options?.primaryColor || '#0ea5e9' },
        homePageContent: {
          bannerSection: { title: options?.brandName || 'Welcome', subtitle: options?.cuisine ? `Authentic ${options.cuisine} cuisine.` : 'Delicious food, great ambience.' },
          serviceSection: { services: [] },
          exploreMenuSection: { title: 'Explore Menu', subtitle: 'Browse our favorites', buttonText: 'Explore Menu' },
          gallery: [],
          socialMedia: []
        }
      };
    }
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = raw.match(fenceRegex);
    if (match && match[2]) raw = match[2].trim();

    const parsed = JSON.parse(raw) as {
      whiteLabel: WebsiteWhiteLabelSettings;
      homePageContent: WebsiteHomePageContent;
      contactUsContent?: WebsiteContactUsContent;
    };

    return parsed;
  } catch (error: any) {
    console.error('Error generating website content:', error);
    const errorMessage = getErrorMessage(error);
    const upperCaseMessage = errorMessage.toUpperCase();

    // Provide structured error fallbacks to keep UX smooth
    if (upperCaseMessage.includes('429') || upperCaseMessage.includes('RESOURCE_EXHAUSTED') || upperCaseMessage.includes('QUOTA')) {
      return {
        whiteLabel: { appName: options?.brandName || 'Quota Exceeded', primaryColor: options?.primaryColor || '#f59e0b' },
        homePageContent: {
          bannerSection: { title: 'API quota exceeded', subtitle: 'Please check your plan and billing.' },
          serviceSection: { services: [] },
          exploreMenuSection: { title: 'Explore Menu', subtitle: 'Try again later', buttonText: 'Explore Menu' },
          gallery: [],
          socialMedia: []
        }
      };
    }
    if (upperCaseMessage.includes('API_KEY_INVALID') || upperCaseMessage.includes('APIKEYNOTVALID')) {
      return {
        whiteLabel: { appName: options?.brandName || 'Invalid API Key', primaryColor: options?.primaryColor || '#ef4444' },
        homePageContent: {
          bannerSection: { title: 'Invalid API key', subtitle: 'Check .env.local configuration.' },
          serviceSection: { services: [] },
          exploreMenuSection: { title: 'Explore Menu', subtitle: 'Configure API key first', buttonText: 'Explore Menu' },
          gallery: [],
          socialMedia: []
        }
      };
    }
    if (upperCaseMessage.includes('XHR ERROR') || upperCaseMessage.includes('FETCH_ERROR') || upperCaseMessage.includes('NETWORK')) {
      return {
        whiteLabel: { appName: options?.brandName || 'Network Error', primaryColor: options?.primaryColor || '#f97316' },
        homePageContent: {
          bannerSection: { title: 'Network error', subtitle: 'Check internet/firewall/referrer restrictions.' },
          serviceSection: { services: [] },
          exploreMenuSection: { title: 'Explore Menu', subtitle: 'Verify connectivity', buttonText: 'Explore Menu' },
          gallery: [],
          socialMedia: []
        }
      };
    }
    return null;
  }
};

/**
 * Advanced generator: produce a broader WebsiteSettings partial including
 * whiteLabel, homePageContent, aboutUsContent, and contactUsContent.
 */
export const generateAdvancedWebsiteSettingsFromPrompt = async (
  prompt: string,
  options?: {
    brandName?: string;
    primaryColor?: string;
    cuisine?: string;
    tone?: 'modern' | 'elegant' | 'casual' | 'luxury';
    includeAboutUs?: boolean;
    includeContact?: boolean;
    includeGallery?: boolean;
    includeSocial?: boolean;
  }
): Promise<Partial<WebsiteSettings> | null> => {
  if (!API_KEY || API_KEY === 'MISSING_API_KEY') {
    const whiteLabel: WebsiteWhiteLabelSettings = {
      appName: options?.brandName || 'Your Restaurant',
      primaryColor: options?.primaryColor || '#0ea5e9',
    };
    const homePageContent: WebsiteHomePageContent = {
      bannerSection: {
        title: whiteLabel.appName,
        subtitle: options?.cuisine ? `Authentic ${options.cuisine} cuisine.` : 'Delicious food, great ambience.'
      },
      serviceSection: { services: [] },
      exploreMenuSection: { title: 'Explore Menu', subtitle: 'Browse our favorites', buttonText: 'Explore Menu' },
      gallery: [],
      socialMedia: []
    };
    const aboutUsContent: WebsiteAboutUsContent | undefined = options?.includeAboutUs
      ? { title: 'About Us', content: 'We serve great food with warm hospitality.', imageUrl: '' }
      : undefined;
    const contactUsContent: WebsiteContactUsContent | undefined = options?.includeContact
      ? { address: 'Your Address', phone: '000-000000', email: 'info@example.com', mapUrl: '' }
      : undefined;
    return { whiteLabel, homePageContent, aboutUsContent, contactUsContent };
  }

  try {
    const userPrompt = `
Generate advanced restaurant website settings with the following context:
- Brand Name: ${options?.brandName || 'Unknown Brand'}
- Primary Color (hex): ${options?.primaryColor || '#0ea5e9'}
- Cuisine: ${options?.cuisine || 'Restaurant'}
- Tone: ${options?.tone || 'modern'}
- Include About Us: ${options?.includeAboutUs ? 'yes' : 'no'}
- Include Contact: ${options?.includeContact ? 'yes' : 'no'}
- Include Gallery: ${options?.includeGallery ? 'yes' : 'no'}
- Include Social: ${options?.includeSocial ? 'yes' : 'no'}

Core Prompt: ${prompt}

Return strict JSON matching this shape (omit sections if not included):
{
  "whiteLabel": { "appName": string, "primaryColor": string, "logoUrl"?: string, "faviconUrl"?: string },
  "homePageContent": {
    "bannerSection": { "title": string, "subtitle": string },
    "serviceSection": { "services": Array<{ "id": string, "title": string, "description": string, "icon": string }> },
    "exploreMenuSection": { "title": string, "subtitle": string, "buttonText": string },
    "gallery": Array<{ "id": string, "url": string, "caption"?: string }>,
    "socialMedia": Array<{ "platform": string, "url": string }>
  },
  "aboutUsContent"?: { "title": string, "content": string, "imageUrl"?: string },
  "contactUsContent"?: { "address": string, "phone": string, "email": string, "mapUrl"?: string }
}`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: userPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            whiteLabel: {
              type: Type.OBJECT,
              properties: {
                appName: { type: Type.STRING },
                primaryColor: { type: Type.STRING },
                logoUrl: { type: Type.STRING, nullable: true },
                faviconUrl: { type: Type.STRING, nullable: true }
              },
              required: ['appName', 'primaryColor']
            },
            homePageContent: {
              type: Type.OBJECT,
              properties: {
                bannerSection: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    subtitle: { type: Type.STRING }
                  },
                  required: ['title']
                },
                serviceSection: {
                  type: Type.OBJECT,
                  properties: {
                    services: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          title: { type: Type.STRING },
                          description: { type: Type.STRING },
                          icon: { type: Type.STRING }
                        },
                        required: ['id', 'title']
                      }
                    }
                  },
                  required: ['services']
                },
                exploreMenuSection: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    subtitle: { type: Type.STRING },
                    buttonText: { type: Type.STRING }
                  },
                  required: ['title']
                },
                gallery: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      url: { type: Type.STRING },
                      caption: { type: Type.STRING }
                    },
                    required: ['id', 'url']
                  }
                },
                socialMedia: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      platform: { type: Type.STRING },
                      url: { type: Type.STRING }
                    },
                    required: ['platform', 'url']
                  }
                }
              },
              required: ['bannerSection', 'serviceSection', 'exploreMenuSection']
            },
            aboutUsContent: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING },
                imageUrl: { type: Type.STRING }
              },
              nullable: true
            },
            contactUsContent: {
              type: Type.OBJECT,
              properties: {
                address: { type: Type.STRING },
                phone: { type: Type.STRING },
                email: { type: Type.STRING },
                mapUrl: { type: Type.STRING }
              },
              nullable: true
            }
          },
          required: ['whiteLabel', 'homePageContent']
        }
      }
    });

    let raw = (response.text ?? '').trim();
    if (!raw) {
      return {
        whiteLabel: { appName: options?.brandName || 'Your Restaurant', primaryColor: options?.primaryColor || '#0ea5e9' },
        homePageContent: {
          bannerSection: { title: options?.brandName || 'Welcome', subtitle: options?.cuisine ? `Authentic ${options.cuisine} cuisine.` : 'Delicious food, great ambience.' },
          serviceSection: { services: [] },
          exploreMenuSection: { title: 'Explore Menu', subtitle: 'Browse our favorites', buttonText: 'Explore Menu' },
          gallery: [],
          socialMedia: []
        }
      };
    }
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = raw.match(fenceRegex);
    if (match && match[2]) raw = match[2].trim();

    const parsed = JSON.parse(raw) as Partial<WebsiteSettings>;
    return parsed;
  } catch (error: any) {
    console.error('Error generating advanced website settings:', error);
    const errorMessage = getErrorMessage(error);
    const upperCaseMessage = errorMessage.toUpperCase();

    if (upperCaseMessage.includes('429') || upperCaseMessage.includes('RESOURCE_EXHAUSTED') || upperCaseMessage.includes('QUOTA')) {
      return {
        whiteLabel: { appName: options?.brandName || 'Quota Exceeded', primaryColor: options?.primaryColor || '#f59e0b' },
        homePageContent: {
          bannerSection: { title: 'API quota exceeded', subtitle: 'Please check your plan and billing.' },
          serviceSection: { services: [] },
          exploreMenuSection: { title: 'Explore Menu', subtitle: 'Try again later', buttonText: 'Explore Menu' },
          gallery: [],
          socialMedia: []
        }
      };
    }
    if (upperCaseMessage.includes('API_KEY_INVALID') || upperCaseMessage.includes('APIKEYNOTVALID')) {
      return {
        whiteLabel: { appName: options?.brandName || 'Invalid API Key', primaryColor: options?.primaryColor || '#ef4444' },
        homePageContent: {
          bannerSection: { title: 'Invalid API key', subtitle: 'Check .env.local configuration.' },
          serviceSection: { services: [] },
          exploreMenuSection: { title: 'Explore Menu', subtitle: 'Configure API key first', buttonText: 'Explore Menu' },
          gallery: [],
          socialMedia: []
        }
      };
    }
    if (upperCaseMessage.includes('XHR ERROR') || upperCaseMessage.includes('FETCH_ERROR') || upperCaseMessage.includes('NETWORK')) {
      return {
        whiteLabel: { appName: options?.brandName || 'Network Error', primaryColor: options?.primaryColor || '#f97316' },
        homePageContent: {
          bannerSection: { title: 'Network error', subtitle: 'Check internet/firewall/referrer restrictions.' },
          serviceSection: { services: [] },
          exploreMenuSection: { title: 'Explore Menu', subtitle: 'Verify connectivity', buttonText: 'Explore Menu' },
          gallery: [],
          socialMedia: []
        }
      };
    }
    return null;
  }
};
