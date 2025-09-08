// src/context/FullscreenContext.jsx
import { createContext, useContext, useState } from "react";

const FullscreenContext = createContext();

export const FullscreenProvider = ({ children }) => {
  const [hideSidebar, setHideSidebar] = useState(false);

  return (
    <FullscreenContext.Provider value={{ hideSidebar, setHideSidebar }}>
      {children}
    </FullscreenContext.Provider>
  );
};

export const useFullscreen = () => useContext(FullscreenContext);
