"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBoxProps {
  query: string;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  handleSubmit: (event: React.FormEvent) => void;
  showFlow: boolean;
}

const SearchBox: React.FC<SearchBoxProps> = ({
  query,
  setQuery,
  handleSubmit,
  showFlow,
}) => {
  // Removed AnimatePresence and motion from here since we handle that in the parent now.
  // Just render the form. The parent will wrap this in a card and animate it.
  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", justifyContent: "center", gap: "8px" }}
    >
      <Input
        type="text"
        placeholder="Enter your query"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ flexGrow: 1 }}
      />
      <Button type="submit">
        Search
      </Button>
    </form>
  );
};

export default SearchBox;
