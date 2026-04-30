import { useState, useEffect } from 'react';
import { storage } from '../services/storage';

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    return storage.get(key, initialValue);
  });

  useEffect(() => {
    storage.set(key, value);
  }, [key, value]);

  return [value, setValue];
}