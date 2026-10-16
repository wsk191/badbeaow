import { createContext, useContext } from 'react';

// App-wide state and handlers, provided by BadmintonApp and read by screens, tabs and modals.
export const AppContext = createContext(null);

export const useApp = () => useContext(AppContext);
