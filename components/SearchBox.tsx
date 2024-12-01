// components/SearchBox.tsx
"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  return (
    <AnimatePresence>
      {!showFlow && (
        <motion.div
          initial={{ top: "50%", transform: "translate(-50%, -50%)", opacity: 1 }}
          animate={{ top: "50%", transform: "translate(-50%, -50%)", opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            position: "fixed",
            left: "50%",
            zIndex: 10,
            width: "400px",
          }}
        >
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", justifyContent: "center" }}
          >
            <Input
              type="text"
              placeholder="Enter your query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ flexGrow: 1 }}
            />
            <Button type="submit" style={{ marginLeft: "8px" }}>
              Search
            </Button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchBox;
