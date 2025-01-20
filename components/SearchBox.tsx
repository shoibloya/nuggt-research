"use client"

import type React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { X } from "lucide-react"

interface SearchBoxProps {
  query: string
  setQuery: React.Dispatch<React.SetStateAction<string>>
  handleSubmit: (event: React.FormEvent) => void
  showFlow: boolean
  onClose: () => void
}

const SearchBox: React.FC<SearchBoxProps> = ({ query, setQuery, handleSubmit, showFlow, onClose }) => {
  const handleTopicClick = (topic: string) => {
    setQuery(topic)
    const syntheticEvent = {
      preventDefault: () => {},
      stopPropagation: () => {},
    } as unknown as React.FormEvent<HTMLFormElement>
    handleSubmit(syntheticEvent)
  }

  const columns = [
    {
      title: "Business",
      topics: [
        "Strategies for Scaling Startups",
        "Effective Digital Marketing Techniques",
        "The Rise of Subscription-based Business Models",
        "Challenges in Cross-border E-commerce",
        "Understanding Behavioral Finance in Investments",
      ],
    },
    {
      title: "Technology",
      topics: [
        "The Impact of Artificial Intelligence on Healthcare",
        "Blockchain Applications in Supply Chain Management",
        "Emerging Trends in Frontend Web Frameworks",
        "Advanced Techniques in Data Science for Predictive Analytics",
        "Securing IoT Devices Against Cyber Threats",
      ],
    },
    {
      title: "Lifestyle",
      topics: [
        "Sustainable Travel Practices for Eco-conscious Tourists",
        "Meal Prepping for a Balanced Diet on Busy Schedules",
        "High-intensity Interval Training for Beginners",
        "The Psychology of Fashion Choices",
        "Meditation Techniques for Stress Reduction",
      ],
    },
  ]

  return (
    <div className="relative w-full max-w-5xl mx-auto p-4 space-y-6">
      {/* Close button in the top-right corner */}
      <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={onClose}>
        <X className="h-4 w-4" />
      </Button>

      {/* Header */}
      <h2 className="text-2xl font-semibold text-center">Gather content on any topic</h2>

      {/* Search box (input + button) */}
      <form onSubmit={handleSubmit} className="flex items-center justify-center gap-3 max-w-3xl mx-auto">
        <Input
          type="text"
          placeholder="Type your topic here..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit">Search</Button>
      </form>

      {/* Horizontal separator */}
      <Separator className="my-6" />

      {/* Three columns with topics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {columns.map((col, colIndex) => (
          <div key={colIndex} className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">{col.title}</h3>
            <div className="flex flex-col items-start gap-3">
              {col.topics.map((topic) => (
                <Button
                  key={topic}
                  variant="link"
                  className="h-auto p-0 text-primary hover:text-primary/80 text-left whitespace-normal justify-start"
                  onClick={() => handleTopicClick(topic)}
                >
                  {topic}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SearchBox
