"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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
  // If the user clicks on one of the sample topics, this sets the query and triggers the search.
  const handleTopicClick = (topic: string) => {
    setQuery(topic);

    // Create a synthetic form event to call handleSubmit in the same way as pressing 'Search'.
    const syntheticEvent = {
      preventDefault: () => {},
      stopPropagation: () => {},
    } as unknown as React.FormEvent<HTMLFormElement>;
    handleSubmit(syntheticEvent);
  };

  // Example columns and topics
  const columns = [
    {
      title: "Business",
      topics: [
        "Entrepreneurship",
        "Marketing",
        "Startups",
        "E-commerce",
        "Finance",
      ],
    },
    {
      title: "Technology",
      topics: [
        "Artificial Intelligence",
        "Blockchain",
        "Web Development",
        "Data Science",
        "Cybersecurity",
      ],
    },
    {
      title: "Lifestyle",
      topics: ["Health", "Travel", "Cooking", "Fitness", "Fashion"],
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <h2 className="text-lg font-semibold text-center">
        Gather content on any topic
      </h2>

      {/* Search box (input + button) */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center justify-center space-x-2"
      >
        <Input
          type="text"
          placeholder="Type your topic here..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="submit">Search</Button>
      </form>

      {/* Horizontal separator */}
      <Separator className="my-4" />

      {/* Three columns with topics */}
      <div className="flex justify-around">
        {columns.map((col, colIndex) => (
          <React.Fragment key={colIndex}>
            <div className="flex flex-col space-y-2 items-start w-1/3 max-w-[200px]">
              <h3 className="text-sm font-medium leading-none mb-2">
                {col.title}
              </h3>
              {col.topics.map((topic) => (
                <Button
                  key={topic}
                  variant="link"
                  className="p-0 text-blue-600 hover:underline"
                  onClick={() => handleTopicClick(topic)}
                >
                  {topic}
                </Button>
              ))}
            </div>
            {/* Vertical separator between columns */}
            {colIndex < columns.length - 1 && (
              <Separator orientation="vertical" className="mx-4" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default SearchBox;
