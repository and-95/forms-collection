// src/utils/url.utils.ts

export const generatePublicUrl = (surveyId: string): string => {
  // В продакшене можно использовать короткий ID, но для MVP используем UUID
  return `/f/${surveyId}`;
};