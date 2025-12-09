"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { RefreshCw, HelpCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const WORD_LENGTH = 5
const MAX_GUESSES = 6

// Greek 5-letter words for the game
const GREEK_WORDS = [
  "ΛΟΓΟΣ", // word/reason
  "ΚΑΛΟΣ", // good
  "ΝΕΡΟΥ", // water
  "ΨΥΧΗΣ", // soul
  "ΠΟΛΗΣ", // city
  "ΤΕΧΝΗ", // art/skill
  "ΜΑΝΕΣ", // man (adding Ρ to make 5)
  "ΓΝΩΣΗ", // knowledge
  "ΔΟΞΑΣ", // glory (adding Σ to make 5)  
  "ΣΠΙΤΙ", // peace
]

// Greek keyboard layout (uppercase)
const GREEK_KEYS = [
  ["Ε", "Ρ", "Τ", "Υ", "Θ", "Ι", "Ο", "Π"],
  ["Α", "Σ", "Δ", "Φ", "Γ", "Η", "Ξ", "Κ", "Λ"],
  ["ENTER", "Ζ", "Χ", "Ψ", "Ω", "Β", "Ν", "Μ", "⌫"],
]

type LetterStatus = "correct" | "present" | "absent" | "empty"

interface Tile {
  letter: string
  status: LetterStatus
}

export default function GreekWordleGame() {
  const [targetWord, setTargetWord] = useState("")
  const [guesses, setGuesses] = useState<Tile[][]>(
    Array(MAX_GUESSES)
      .fill(null)
      .map(() => Array(WORD_LENGTH).fill({ letter: "", status: "empty" })),
  )
  const [currentGuess, setCurrentGuess] = useState("")
  const [currentRow, setCurrentRow] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)
  const [shake, setShake] = useState(false)
  const [keyStatuses, setKeyStatuses] = useState<Record<string, LetterStatus>>({})

  useEffect(() => {
    startNewGame()
  }, [])

  const startNewGame = () => {
    const randomWord = GREEK_WORDS[Math.floor(Math.random() * GREEK_WORDS.length)]
    setTargetWord(randomWord)
    setGuesses(
      Array(MAX_GUESSES)
        .fill(null)
        .map(() => Array(WORD_LENGTH).fill({ letter: "", status: "empty" })),
    )
    setCurrentGuess("")
    setCurrentRow(0)
    setGameOver(false)
    setWon(false)
    setKeyStatuses({})
  }

  const handleKeyPress = (key: string) => {
    if (gameOver) return

    if (key === "ENTER") {
      if (currentGuess.length !== WORD_LENGTH) {
        setShake(true)
        setTimeout(() => setShake(false), 500)
        return
      }
      submitGuess()
    } else if (key === "⌫") {
      setCurrentGuess(currentGuess.slice(0, -1))
    } else if (currentGuess.length < WORD_LENGTH) {
      setCurrentGuess(currentGuess + key)
    }
  }

  const submitGuess = () => {
    const newGuesses = [...guesses]
    const newTiles: Tile[] = []
    const targetLetters = targetWord.split("")
    const guessLetters = currentGuess.split("")
    const letterCounts: Record<string, number> = {}

    // Count letters in target word
    targetLetters.forEach((letter) => {
      letterCounts[letter] = (letterCounts[letter] || 0) + 1
    })

    // First pass: mark correct letters
    guessLetters.forEach((letter, i) => {
      if (letter === targetLetters[i]) {
        newTiles[i] = { letter, status: "correct" }
        letterCounts[letter]--
      } else {
        newTiles[i] = { letter, status: "absent" }
      }
    })

    // Second pass: mark present letters
    guessLetters.forEach((letter, i) => {
      if (newTiles[i].status === "absent" && letterCounts[letter] > 0) {
        newTiles[i] = { letter, status: "present" }
        letterCounts[letter]--
      }
    })

    newGuesses[currentRow] = newTiles
    setGuesses(newGuesses)

    // Update keyboard statuses
    const newKeyStatuses = { ...keyStatuses }
    newTiles.forEach((tile) => {
      const currentStatus = newKeyStatuses[tile.letter]
      if (
        !currentStatus ||
        (currentStatus === "absent" && tile.status !== "absent") ||
        (currentStatus === "present" && tile.status === "correct")
      ) {
        newKeyStatuses[tile.letter] = tile.status
      }
    })
    setKeyStatuses(newKeyStatuses)

    if (currentGuess === targetWord) {
      setWon(true)
      setGameOver(true)
    } else if (currentRow === MAX_GUESSES - 1) {
      setGameOver(true)
    } else {
      setCurrentRow(currentRow + 1)
      setCurrentGuess("")
    }
  }

  const getKeyClass = (key: string) => {
    const status = keyStatuses[key]
    if (status === "correct") return "bg-primary text-primary-foreground"
    if (status === "present") return "bg-secondary text-secondary-foreground"
    if (status === "absent") return "bg-muted text-muted-foreground"
    return "bg-card text-card-foreground hover:bg-accent"
  }

  const getTileClass = (tile: Tile, colIndex: number, rowIndex: number) => {
    const isCurrentRow = rowIndex === currentRow && !gameOver
    const isCurrentTile = isCurrentRow && colIndex < currentGuess.length

    if (tile.status === "correct") return "bg-primary text-primary-foreground border-primary"
    if (tile.status === "present") return "bg-secondary text-secondary-foreground border-secondary"
    if (tile.status === "absent") return "bg-muted text-muted-foreground border-muted"
    if (isCurrentTile) return "border-ring border-2 animate-pulse"
    return "bg-card border-border"
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 gap-8">
      {/* Header */}
      <div className="w-full max-w-2xl flex items-center justify-between">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <HelpCircle className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-balance">How to play</DialogTitle>
              <DialogDescription className="space-y-4 text-left">
                <p className="text-pretty">
                  Guess the Greek word in 6 tries. Each guess must be a valid 5-letter Greek word.
                </p>
                <div className="space-y-2">
                  <p className="font-semibold text-foreground">After each guess, the color of the tiles will change:</p>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-primary rounded flex items-center justify-center text-primary-foreground font-bold">
                      Λ
                    </div>
                    <span className="text-pretty">The letter is in the word and in the correct spot</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-secondary rounded flex items-center justify-center text-secondary-foreground font-bold">
                      Ο
                    </div>
                    <span className="text-pretty">The letter is in the word but in the wrong spot</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-muted-foreground font-bold">
                      Γ
                    </div>
                    <span className="text-pretty">The letter is not in the word</span>
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        <h1 className="text-4xl md:text-5xl font-bold text-primary text-balance">GREEK WORDLE</h1>

        <Button variant="ghost" size="icon" onClick={startNewGame}>
          <RefreshCw className="h-6 w-6" />
        </Button>
      </div>

      {/* Game Board */}
      <Card className="p-4 md:p-8">
        <div className={cn("grid gap-2", shake && "animate-shake")}>
          {guesses.map((guess, rowIndex) => (
            <div key={rowIndex} className="flex gap-2">
              {guess.map((tile, colIndex) => {
                const displayLetter =
                  rowIndex === currentRow && colIndex < currentGuess.length ? currentGuess[colIndex] : tile.letter

                return (
                  <div
                    key={colIndex}
                    className={cn(
                      "w-12 h-12 md:w-16 md:h-16 border-2 rounded-md flex items-center justify-center text-2xl md:text-3xl font-bold transition-all duration-300",
                      getTileClass(tile, colIndex, rowIndex),
                    )}
                  >
                    {displayLetter}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </Card>

      {/* Game Over Message */}
      {gameOver && (
        <Card className="p-6 max-w-md text-center animate-in fade-in slide-in-from-bottom-4">
          <h2 className="text-2xl font-bold mb-2 text-balance">{won ? "Συγχαρητήρια! 🎉" : "Καλή Τύχη! 😢"}</h2>
          <p className="text-muted-foreground mb-4 text-pretty">
            {won
              ? `You guessed the word in ${currentRow + 1} ${currentRow === 0 ? "try" : "tries"}!`
              : `The word was: ${targetWord}`}
          </p>
          <Button onClick={startNewGame} className="w-full">
            Play Again
          </Button>
        </Card>
      )}

      {/* Greek Keyboard */}
      <div className="w-full max-w-2xl space-y-2">
        {GREEK_KEYS.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-1 md:gap-2 justify-center">
            {row.map((key) => (
              <Button
                key={key}
                onClick={() => handleKeyPress(key)}
                disabled={gameOver}
                className={cn(
                  "font-bold text-sm md:text-base transition-colors",
                  key === "ENTER" || key === "⌫" ? "px-4 md:px-6" : "w-8 h-10 md:w-10 md:h-12 p-0",
                  getKeyClass(key),
                )}
                variant="outline"
              >
                {key}
              </Button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
