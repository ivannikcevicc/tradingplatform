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

  let lastError: Error | null = null;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        // Add cache control to prevent CloudFront caching
        cache: "no-store",
      });

      // Successfully got a response
      if (response.ok) return response;

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        await new Promise((resolve) =>
          setTimeout(
            resolve,
            retryAfter ? parseInt(retryAfter) * 1000 : retryDelay
          )
        );
        continue;
      }

      // Handle server errors
      if (response.status >= 500) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        continue;
      }

      // If we get here, it's a non-recoverable error
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");
      if (i === retries - 1) throw lastError;
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  throw lastError || new Error("Max retries reached");
}
