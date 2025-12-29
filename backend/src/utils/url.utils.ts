// src/utils/url.utils.ts

export const generatePublicUrl = (survey_id: string): string => {
  // В продакшене можно использовать короткий ID, но для MVP используем UUID
  return `${process.env.PROD_IP}/f/${survey_id}`;
};