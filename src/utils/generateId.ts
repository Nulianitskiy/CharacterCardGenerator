export const generateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
