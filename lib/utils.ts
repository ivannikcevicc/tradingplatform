import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FetchOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
}

export async function fetchWithRetry(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { retries = 3, retryDelay = 1000, ...fetchOptions } = options;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, fetchOptions);
      if (response.ok) return response;

      if (response.status === 429) {
        // Rate limit
        const retryAfter = response.headers.get("Retry-After");
        await new Promise((resolve) =>
          setTimeout(
            resolve,
            retryAfter ? parseInt(retryAfter) * 1000 : retryDelay
          )
        );
        continue;
      }

      if (response.status >= 500) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        continue;
      }

      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  throw new Error("Max retries reached");
}
