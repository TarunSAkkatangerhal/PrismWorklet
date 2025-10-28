import { useEffect } from 'react';

export const useDocumentTitle = (title) => {
  useEffect(() => {
    const baseTitle = 'PrismWorklet';
    
    if (title) {
      document.title = title;
    } else {
      document.title = baseTitle;
    }
    
    // Cleanup function to restore base title when component unmounts
    return () => {
      document.title = baseTitle;
    };
  }, [title]);
};