import {
  type CSSProperties,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { type Puzzle, WORDS } from './words'
import './App.css'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const MAX_WRONG_GUESSES = 6

function pickPuzzle(): Puzzle {
  return WORDS[Math.floor(Math.random() * WORDS.length)]
}

function App() {
  const [puzzle, setPuzzle] = useState<Puzzle>(() => pickPuzzle())
  const [guesses, setGuesses] = useState<string[]>([])
  const [wordGuess, setWordGuess] = useState('')
  const [wrongWordGuesses, setWrongWordGuesses] = useState<string[]>([])

  const wrongGuesses = guesses.filter((letter) => !puzzle.word.includes(letter))
  const wrongAttempts = [...wrongGuesses, ...wrongWordGuesses]
  const isWon = puzzle.word.split('').every((letter) => guesses.includes(letter))
  const isLost = wrongAttempts.length >= MAX_WRONG_GUESSES
  const isFinished = isWon || isLost

  const revealedWord = useMemo(
    () =>
      puzzle.word
        .split('')
        .map((letter) => (guesses.includes(letter) || isLost ? letter : '')),
    [guesses, isLost, puzzle.word],
  )
  const wordStyle = {
    '--letter-count': puzzle.word.length,
    '--letter-font-size': `${Math.max(15, Math.min(34, Math.floor(260 / puzzle.word.length)))}px`,
  } as CSSProperties

  const guessLetter = useCallback((letter: string) => {
    if (isFinished || guesses.includes(letter)) {
      return
    }

    setGuesses((current) => [...current, letter])
  }, [guesses, isFinished])

  function submitWordGuess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedGuess = wordGuess.trim().toUpperCase().replace(/[^A-Z]/g, '')

    if (!normalizedGuess || isFinished) {
      return
    }

    if (normalizedGuess === puzzle.word) {
      setGuesses(Array.from(new Set(puzzle.word.split(''))))
      setWordGuess('')
      return
    }

    setWrongWordGuesses((current) =>
      current.includes(normalizedGuess) ? current : [...current, normalizedGuess],
    )
    setWordGuess('')
  }

  const startNewGame = useCallback(() => {
    let nextPuzzle = pickPuzzle()

    while (nextPuzzle.word === puzzle.word && WORDS.length > 1) {
      nextPuzzle = pickPuzzle()
    }

    setPuzzle(nextPuzzle)
    setGuesses([])
    setWrongWordGuesses([])
    setWordGuess('')
  }, [puzzle.word])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement) {
        return
      }

      const letter = event.key.toUpperCase()

      if (/^[A-Z]$/.test(letter)) {
        guessLetter(letter)
      }

      if (event.key === 'Enter' && isFinished) {
        startNewGame()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [guessLetter, isFinished, startNewGame])

  return (
    <main className="game-shell">
      <section className="game-header">
        <h1>Hangman</h1>
        <p className="intro">
          힌트를 보고 알파벳을 맞히거나 단어 전체를 입력해 한 번에 도전하세요.
        </p>
      </section>

      <section className="play-area" aria-label="Hangman game board">
        <div className="gallows" aria-label={`${wrongAttempts.length} wrong guesses`}>
          <div className="beam base"></div>
          <div className="beam pole"></div>
          <div className="beam top"></div>
          <div className="beam rope"></div>
          <div className={`body-part head ${wrongAttempts.length >= 1 ? 'show' : ''}`}></div>
          <div className={`body-part torso ${wrongAttempts.length >= 2 ? 'show' : ''}`}></div>
          <div className={`body-part arm left ${wrongAttempts.length >= 3 ? 'show' : ''}`}></div>
          <div className={`body-part arm right ${wrongAttempts.length >= 4 ? 'show' : ''}`}></div>
          <div className={`body-part leg left ${wrongAttempts.length >= 5 ? 'show' : ''}`}></div>
          <div className={`body-part leg right ${wrongAttempts.length >= 6 ? 'show' : ''}`}></div>
        </div>

        <div className="puzzle-panel">
          <div className="status-row">
            <span className={`badge ${isLost ? 'danger' : isWon ? 'success' : ''}`}>
              {isWon
                ? '성공'
                : isLost
                  ? '실패'
                  : `남은 기회 ${MAX_WRONG_GUESSES - wrongAttempts.length}`}
            </span>
            <span className="misses">
              오답: {wrongAttempts.length > 0 ? wrongAttempts.join(', ') : '없음'}
            </span>
          </div>

          <p className="hint">
            <span>Hint</span>
            {puzzle.hint}
          </p>

          <div className="word" aria-label="word to guess" style={wordStyle}>
            {revealedWord.map((letter, index) => (
              <span className="letter-slot" key={`${puzzle.word}-${index}`}>
                {letter}
              </span>
            ))}
          </div>

          <p className="result" aria-live="polite">
            {isWon && '정답입니다. Enter를 누르거나 새 게임을 시작하세요.'}
            {isLost && `아쉽네요. 정답은 ${puzzle.word}였습니다.`}
            {!isFinished && '알파벳 하나씩 맞히거나 단어 전체를 제출하세요.'}
          </p>

          <form className="word-guess" onSubmit={submitWordGuess}>
            <label htmlFor="word-guess-input">단어 입력</label>
            <div className="word-guess-row">
              <input
                autoComplete="off"
                disabled={isFinished}
                id="word-guess-input"
                maxLength={18}
                onChange={(event) => setWordGuess(event.target.value)}
                placeholder="정답 단어"
                type="text"
                value={wordGuess}
              />
              <button disabled={isFinished || wordGuess.trim().length === 0} type="submit">
                제출
              </button>
            </div>
          </form>

          <div className="keyboard" aria-label="letter choices">
            {ALPHABET.map((letter) => {
              const guessed = guesses.includes(letter)
              const correct = guessed && puzzle.word.includes(letter)
              const wrong = guessed && !puzzle.word.includes(letter)

              return (
                <button
                  className={`${correct ? 'correct' : ''} ${wrong ? 'wrong' : ''}`}
                  disabled={guessed || isFinished}
                  key={letter}
                  onClick={() => guessLetter(letter)}
                  type="button"
                >
                  {letter}
                </button>
              )
            })}
          </div>

          <button className="new-game" onClick={startNewGame} type="button">
            새 게임
          </button>
        </div>
      </section>
    </main>
  )
}

export default App
