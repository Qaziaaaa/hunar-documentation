"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface CustomerSearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const CustomerSearchContext = createContext<CustomerSearchContextType>({
  searchQuery: "",
  setSearchQuery: () => {},
});

export function CustomerSearchProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("");
  return (
    <CustomerSearchContext.Provider value={{ searchQuery, setSearchQuery }}>
      {children}
    </CustomerSearchContext.Provider>
  );
}

export function useCustomerSearch() {
  return useContext(CustomerSearchContext);
}
