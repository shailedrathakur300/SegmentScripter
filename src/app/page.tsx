"use client"

import { useState, type ChangeEvent, type FormEvent } from "react"
import { Plus, Trash2, Download, Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

interface TimeRange {
  id: string
  start: string
  end: string
}

interface TranscriptSegment {
  range: string
  text: string
}

interface ApiResponse {
  transcripts?: TranscriptSegment[]
  error?: string
}

export default function TranscriberPage() {
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [timeRanges, setTimeRanges] = useState<TimeRange[]>([{ id: Date.now().toString(), start: "", end: "" }])
  const [transcripts, setTranscripts] = useState<TranscriptSegment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddTimeRange = () => {
    setTimeRanges([...timeRanges, { id: Date.now().toString(), start: "", end: "" }])
  }

  const handleRemoveTimeRange = (id: string) => {
    if (timeRanges.length > 1) {
      setTimeRanges(timeRanges.filter((range) => range.id !== id))
    }
  }

  const handleTimeRangeChange = (id: string, field: "start" | "end", value: string) => {
    setTimeRanges(timeRanges.map((range) => (range.id === id ? { ...range, [field]: value } : range)))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setTranscripts([])

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: youtubeUrl,
          ranges: timeRanges.map(({ start, end }) => ({ start, end })),
        }),
      })

      const data: ApiResponse = await response.json()

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to get transcript. Please try again.")
      }

      if (data.transcripts) {
        setTranscripts(data.transcripts)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  const formatTranscriptForDownload = (segments: TranscriptSegment[], format: "txt" | "md"): string => {
    if (format === "txt") {
      return segments.map((segment) => `Section: ${segment.range}\n\n${segment.text}\n\n---\n`).join("")
    } else {
      // md
      return segments.map((segment) => `## Section: ${segment.range}\n\n${segment.text}\n`).join("\n---\n\n")
    }
  }

  const handleDownload = (format: "txt" | "md") => {
    if (transcripts.length === 0) return
    const content = formatTranscriptForDownload(transcripts, format)
    const filename = `transcript.${format}`
    const mimeType = format === "txt" ? "text/plain" : "text/markdown"

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-gray-100 font-mono p-4 md:p-8 selection:bg-violet-500 selection:text-white">
      <header className="text-center mb-10 mt-8">
        <h1 className="text-4xl md:text-5xl font-bold text-violet-400">SegmentScripter</h1>
        <p className="text-lg text-gray-400 mt-2">Cut the Noise. Transcribe What You Need.</p>
      </header>

      <main className="w-full max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="youtubeUrl" className="block text-sm font-medium text-gray-300 mb-1">
              YouTube Video URL
            </Label>
            <Input
              id="youtubeUrl"
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setYoutubeUrl(e.target.value)}
              required
              className="bg-gray-800 border-gray-700 focus:ring-violet-500 focus:border-violet-500 text-gray-100"
            />
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-300 mb-1">Time Ranges (HH:MM:SS)</Label>
            {timeRanges.map((range, index) => (
              <div key={range.id} className="flex items-center space-x-2 mb-2">
                <Input
                  type="text"
                  placeholder="00:30:00"
                  pattern="[0-9]{2}:[0-5][0-9]:[0-5][0-9]"
                  title="Format: HH:MM:SS"
                  value={range.start}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleTimeRangeChange(range.id, "start", e.target.value)
                  }
                  required
                  className="bg-gray-800 border-gray-700 focus:ring-violet-500 focus:border-violet-500 text-gray-100 w-full"
                />
                <span className="text-gray-400">to</span>
                <Input
                  type="text"
                  placeholder="01:00:00"
                  pattern="[0-9]{2}:[0-5][0-9]:[0-5][0-9]"
                  title="Format: HH:MM:SS"
                  value={range.end}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleTimeRangeChange(range.id, "end", e.target.value)
                  }
                  required
                  className="bg-gray-800 border-gray-700 focus:ring-violet-500 focus:border-violet-500 text-gray-100 w-full"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveTimeRange(range.id)}
                  disabled={timeRanges.length <= 1}
                  className="text-gray-400 hover:text-red-500 disabled:hover:text-gray-400"
                  aria-label="Remove time range"
                >
                  <Trash2 size={18} />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={handleAddTimeRange}
              className="border-violet-500 text-violet-400 hover:bg-violet-500 hover:text-gray-900 w-full sm:w-auto"
            >
              <Plus size={18} className="mr-2" /> Add Range
            </Button>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white text-lg py-3 disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={24} className="animate-spin mr-2" /> : "Get Transcript"}
          </Button>
        </form>

        {error && (
          <Card className="mt-8 bg-red-900 border-red-700 text-red-100">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle size={20} className="mr-2 text-red-300" />
                Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{error}</p>
            </CardContent>
          </Card>
        )}

        {transcripts.length > 0 && (
          <section className="mt-10">
            <h2 className="text-2xl font-semibold mb-4 text-violet-300">Transcript Sections</h2>
            <div className="space-y-6">
              {transcripts.map((segment, index) => (
                <Card key={index} className="bg-gray-800 border-gray-700 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-violet-400 text-lg">Section: {segment.range}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="whitespace-pre-wrap text-gray-200 text-sm leading-relaxed">{segment.text}</pre>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-8 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <Button
                onClick={() => handleDownload("txt")}
                variant="outline"
                className="border-violet-500 text-violet-400 hover:bg-violet-500 hover:text-gray-900 w-full"
              >
                <Download size={18} className="mr-2" /> Download as .txt
              </Button>
              <Button
                onClick={() => handleDownload("md")}
                variant="outline"
                className="border-violet-500 text-violet-400 hover:bg-violet-500 hover:text-gray-900 w-full"
              >
                <Download size={18} className="mr-2" /> Download as .md
              </Button>
            </div>
          </section>
        )}
      </main>

      <footer className="text-center mt-12 mb-6 text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} SegmentScripter. All rights reserved.</p>
      </footer>
    </div>
  )
}
