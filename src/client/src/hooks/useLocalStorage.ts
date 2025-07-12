import { useState, useEffect, useCallback } from 'react';

type SetValue<T> = T | ((prevValue: T) => T);

export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  options?: {
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
  }
): [T, (value: SetValue<T>) => void] {
  const serialize = options?.serialize || JSON.stringify;
  const deserialize = options?.deserialize || JSON.parse;

  // Get initial value from localStorage or use default
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }
      // Handle simple string values without JSON parsing
      if (typeof defaultValue === 'string') {
        return item as T;
      }
      return deserialize(item);
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  // Save to localStorage whenever value changes
  useEffect(() => {
    try {
      // Handle simple string values without JSON serialization
      if (typeof storedValue === 'string') {
        window.localStorage.setItem(key, storedValue as string);
      } else {
        window.localStorage.setItem(key, serialize(storedValue));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue, serialize]);

  // Wrapped setter function
  const setValue = useCallback((value: SetValue<T>) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}

// Specialized version for boolean values
export function useLocalStorageBoolean(
  key: string,
  defaultValue: boolean
): [boolean, (value: SetValue<boolean>) => void] {
  return useLocalStorage(key, defaultValue, {
    serialize: (value) => value.toString(),
    deserialize: (value) => value === 'true'
  });
}

// Specialized version for number values
export function useLocalStorageNumber(
  key: string,
  defaultValue: number
): [number, (value: SetValue<number>) => void] {
  return useLocalStorage(key, defaultValue, {
    serialize: (value) => value.toString(),
    deserialize: (value) => parseFloat(value)
  });
}