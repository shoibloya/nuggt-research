"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, Trash, Edit } from "lucide-react";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface AreaSelectionProps {
  areasData: any[];
  onProcessSelection: (selectedAreasData: any[]) => void;
}

const AreaSelection: React.FC<AreaSelectionProps> = ({ areasData, onProcessSelection }) => {
  const [areas, setAreas] = useState(
    areasData.map((area) => ({
      ...area,
      google_search_ideas: area.google_search_ideas.map((idea) => ({
        text: idea,
      })),
      newIdeaText: "", 
    }))
  );

  const [newAreaName, setNewAreaName] = useState("");

  const handleAddArea = () => {
    if (newAreaName.trim() === "") return;
    setAreas([
      ...areas,
      {
        name: newAreaName,
        purpose: "",
        google_search_ideas: [],
        newIdeaText: "",
      },
    ]);
    setNewAreaName("");
  };

  const handleAddIdea = (areaIndex, ideaText) => {
    if (ideaText.trim() === "") return;
    const newAreas = [...areas];
    newAreas[areaIndex].google_search_ideas.push({
      text: ideaText,
    });
    newAreas[areaIndex].newIdeaText = "";
    setAreas(newAreas);
  };

  const handleDeleteArea = (areaIndex) => {
    const newAreas = [...areas];
    newAreas.splice(areaIndex, 1);
    setAreas(newAreas);
  };

  const handleDeleteIdea = (areaIndex, ideaIndex) => {
    const newAreas = [...areas];
    newAreas[areaIndex].google_search_ideas.splice(ideaIndex, 1);
    setAreas(newAreas);
  };

  const handleEditArea = (areaIndex, newName) => {
    const newAreas = [...areas];
    newAreas[areaIndex].name = newName;
    setAreas(newAreas);
  };

  const handleEditIdea = (areaIndex, ideaIndex, newText) => {
    const newAreas = [...areas];
    newAreas[areaIndex].google_search_ideas[ideaIndex].text = newText;
    setAreas(newAreas);
  };

  const handleProcess = () => {
    const selectedAreas = areas.map((area) => ({
      name: area.name,
      purpose: area.purpose,
      google_search_ideas: area.google_search_ideas.map((idea) => idea.text),
    }));
    onProcessSelection(selectedAreas);
  };

  // Just return the card content normally.
  // The parent wraps this component in a card, so we don't need another card here.
  return (
    <div className="p-4">
      <div className="w-full mb-6 flex flex-col md:flex-row justify-between items-center">
        <h1 className="text-2xl font-bold text-center md:text-left">
          Delete Areas You Don't Like Then Click On Proceed 
        </h1>
        <Button onClick={handleProcess} className="mt-4 md:mt-0">
          Proceed
        </Button>
      </div>

      <ScrollArea orientation="horizontal" className="w-full relative">
        <div className="flex flex-nowrap space-x-4 pl-4 pr-24 pb-4">
          {areas.map((area, areaIndex) => (
            <motion.div
              key={areaIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Card className="w-[350px] flex flex-col">
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between">
                    <CardTitle>{area.name}</CardTitle>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newName = prompt("Edit area name:", area.name);
                          if (newName !== null && newName.trim() !== "") {
                            handleEditArea(areaIndex, newName);
                          }
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDeleteArea(areaIndex)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Add new query"
                      value={area.newIdeaText}
                      onChange={(e) => {
                        const newAreas = [...areas];
                        newAreas[areaIndex].newIdeaText = e.target.value;
                        setAreas(newAreas);
                      }}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={() =>
                        handleAddIdea(areaIndex, area.newIdeaText || "")
                      }
                    >
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent>
                  <ScrollArea className="h-60">
                    {area.google_search_ideas.map((idea, ideaIndex) => (
                      <div
                        key={ideaIndex}
                        className="flex items-center justify-between mb-2"
                      >
                        <span>{idea.text}</span>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newText = prompt("Edit query:", idea.text);
                              if (newText !== null && newText.trim() !== "") {
                                handleEditIdea(areaIndex, ideaIndex, newText);
                              }
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() =>
                              handleDeleteIdea(areaIndex, ideaIndex)
                            }
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {/* Add New Area Card */}
          <Card className="w-[350px] flex flex-col">
            <CardHeader>
              <CardTitle>Add New Area</CardTitle>
              <CardDescription>
                Create a new area to explore additional queries.
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="new-area">Area Name</Label>
                <Input
                  id="new-area"
                  placeholder="Enter area name"
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleAddArea}>Add Area</Button>
            </CardFooter>
          </Card>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default AreaSelection;
