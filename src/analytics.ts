import ReactGA from 'react-ga4';

const MEASUREMENT_ID = 'G-JF58H0TKPL';

let isInitialized = false;

export const initGA = () => {
  if (!isInitialized) {
    ReactGA.initialize(MEASUREMENT_ID);
    isInitialized = true;
  }
};

export const trackPageView = (path: string) => {
  if (isInitialized) {
    ReactGA.send({ hitType: 'pageview', page: path });
  }
};

export const trackEvent = (category: string, action: string, label?: string, value?: number) => {
  if (isInitialized) {
    ReactGA.event({
      category,
      action,
      label,
      value
    });
  }
};
