import React, { useState, useEffect } from 'react';
import './App.css';

const emptyGrid = Array.from({ length: 9 }, () => Array(9).fill(''));
type NoteType = string[];
const emptyNotes: NoteType[][] = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => []));
const LEVELS = [
  'NORMAL', 'FÁCIL', 'INTERMEDIÁRIO', 'AVANÇADO', 'DIFÍCIL',
  'DESAFIO', 'EXPERTO', 'MESTRE', 'INSANO', 'INJUSTO'
];

function shuffle(array: string[]): string[] {
  let arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateFullBoard(): string[][] {
  const board = Array.from({ length: 9 }, () => Array(9).fill(''));
  function fill(pos = 0): boolean {
    if (pos === 81) return true;
    const row = Math.floor(pos / 9);
    const col = pos % 9;
    const nums = shuffle(['1','2','3','4','5','6','7','8','9']);
    for (const num of nums) {
      if (
        !board[row].includes(num) &&
        !board.some(r => r[col] === num) &&
        !(() => {
          const sr = Math.floor(row/3)*3, sc = Math.floor(col/3)*3;
          for (let r=sr; r<sr+3; r++) for (let c=sc; c<sc+3; c++) if (board[r][c] === num) return true;
          return false;
        })()
      ) {
        board[row][col] = num;
        if (fill(pos+1)) return true;
        board[row][col] = '';
      }
    }
    return false;
  }
  fill();
  return board;
}

function generatePuzzle(full: string[][], level: number): string[][] {
  const clues = Math.max(17, 50 - (level-1)*4);
  const puzzle = full.map(row => row.slice());
  let cells = shuffle(Array.from({length:81}, (_,i)=>i.toString())); // Corrigido para string[]
  let removed = 0;
  for (let idx of cells) {
    if (81 - removed <= clues) break;
    const row = Math.floor(Number(idx)/9), col = Number(idx)%9; // Convertendo idx para número
    puzzle[row][col] = '';
    removed++;
  }
  return puzzle;
}

const App: React.FC = () => {
  // Desmarca seleção ao clicar fora do grid
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      // Só desmarca se o clique não for dentro do grid nem em botões
      const grid = document.querySelector('.grid');
      if (!grid) return;
      if (!grid.contains(e.target as Node)) {
        // Ignora se for botão
        if ((e.target as HTMLElement).closest('button')) return;
        setSelectedCells([]);
        setHighlightNum(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [grid, setGrid] = useState(emptyGrid);
  // Novo estado: matriz booleana indicando se a célula está preenchida
  const [filledCells, setFilledCells] = useState<boolean[][]>(
    Array.from({ length: 9 }, (_, r) => Array.from({ length: 9 }, (_, c) => emptyGrid[r][c] !== ''))
  ); 
  const [notes, setNotes] = useState<NoteType[][]>(emptyNotes);
  // Agora um array de células selecionadas
  const [selectedCells, setSelectedCells] = useState<{ row: number; col: number }[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  // Estado para saber se o arrasto começou em célula selecionada
  const [dragStartedOnSelectedCell, setDragStartedOnSelectedCell] = useState(false);
  const [noteMode, setNoteMode] = useState(false);
  const [highlightNum, setHighlightNum] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [pickerValue, setPickerValue] = useState(1);
  const [history, setHistory] = useState<{grid: string[][], notes: NoteType[][]}[]>([]);

  const handleNewGame = (level: number) => {
    const full = generateFullBoard();
    const puzzle = generatePuzzle(full, level);
    setGrid(puzzle);
    setNotes(emptyNotes);
    setSelectedCells([]);
    setShowWelcome(false);
    setHistory([]);
  };

  const handleCellClick = (row: number, col: number) => {
    // Clique simples: adiciona célula vazia ao array sem desmarcar outras

    // (Optional) You can use cellIsSelected for logic here if needed

    if (!filledCells[row][col]) {
      setSelectedCells(prev => {
        const exists = prev.some(cell => cell.row === row && cell.col === col);
        if (!exists) {
          return [...prev, { row, col }];
        }
        return prev; // Se já está selecionada, mantém
      });
    } else {
      // Se preenchida, só destaca o número
      
      const value = grid[row][col];
      setHighlightNum(value);
    }

  };

  const handleCellMouseDown = (row: number, col: number, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    // Não inicia seleção se célula está preenchida
    if (filledCells[row][col]) return;
    setIsSelecting(true);
    
    // Armazena se o mouse começou em uma célula selecionada para determinar comportamento do drag
    const cellIsSelected = selectedCells.some(cell => cell.row === row && cell.col === col);
    setDragStartedOnSelectedCell(cellIsSelected);
    
    // No mouse down, alterna o estado da célula
    setSelectedCells(prev => {
      if (cellIsSelected) {
        // Se está selecionada, remove
        return prev.filter(cell => !(cell.row === row && cell.col === col));
      } else {
        // Se não está selecionada, adiciona
        return [...prev, { row, col }];
      }
    });
  };

  const handleCellMouseEnter = (row: number, col: number) => {
     if (!isSelecting) return;
     // Não seleciona se célula está preenchida
     if (filledCells[row][col]) return;
     
     setSelectedCells(prev => {
       const exists = prev.some(cell => cell.row === row && cell.col === col);
       
       if (dragStartedOnSelectedCell) {
         // Se começou em célula selecionada, desmarca as células no arrasto
         if (exists) {
           return prev.filter(cell => !(cell.row === row && cell.col === col));
         }
         return prev; // Se não está selecionada, não faz nada
       } else {
         // Se começou em célula não selecionada, marca as células no arrasto
         if (!exists) {
           return [...prev, { row, col }];
         }
         return prev; // Se já está selecionada, não faz nada
       }
     });
   };

  // Finaliza seleção por arrasto
  React.useEffect(() => {
    const up = () => setIsSelecting(false);
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, [isSelecting]);

  const isValidMove = (row: number, col: number, num: string) => {
    for (let c = 0; c < 9; c++) {
      if (grid[row][c] === num) return false;
    }
    for (let r = 0; r < 9; r++) {
      if (grid[r][col] === num) return false;
    }
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let r = startRow; r < startRow + 3; r++) {
      for (let c = startCol; c < startCol + 3; c++) {
        if (grid[r][c] === num) return false;
      }
    }
    return true;
  };

  function isCellInvalid(row: number, col: number, value: string) {
    if (!value) return false;
    for (let c = 0; c < 9; c++) {
      if (c !== col && grid[row][c] === value) return true;
    }
    for (let r = 0; r < 9; r++) {
      if (r !== row && grid[r][col] === value) return true;
    }
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let r = startRow; r < startRow + 3; r++) {
      for (let c = startCol; c < startCol + 3; c++) {
        if ((r !== row || c !== col) && grid[r][c] === value) return true;
      }
    }
    return false;
  }

  function isHighlightedNum(row: number, col: number) {
    if (!highlightNum) return false;
    return grid[row][col] === highlightNum;
  }

  function isHighlightedNote(row: number, col: number) {
    if (!highlightNum) return false;
    return notes[row][col]?.includes(highlightNum);
  }

  function handleNumberInput(num: string) {
    if (!selectedCells.length) return;
    setHistory(h => [...h, { grid: grid.map(r => [...r]), notes: notes.map(r => r.map(n => [...n])) }]);
    if (noteMode) {
      setNotes(prev => {
        const newNotes = prev.map(r => r.map(n => [...n]));
        selectedCells.forEach(({row, col}) => {
          const cellNotes = newNotes[row][col];
          if (cellNotes.includes(num)) {
            newNotes[row][col] = cellNotes.filter((n: string) => n !== num);
          } else {
            newNotes[row][col].push(num);
          }
        });
        return newNotes;
      });
    } else {
      // Só insere se todas as selecionadas estiverem vazias e o número for válido em todas
      if (selectedCells.some(({row, col}) => grid[row][col])) return;
      if (selectedCells.some(({row, col}) => !isValidMove(row, col, num))) return;
      setGrid(prev => {
        const newGrid = prev.map(r => [...r]);
        selectedCells.forEach(({row, col}) => {
          newGrid[row][col] = num;
        });
        return newGrid;
      });
      setNotes(prev => {
        const newNotes = prev.map(row => row.map(notesCell => [...notesCell]));
        selectedCells.forEach(({row, col}) => {
          // Limpa as notas da célula preenchida
          newNotes[row][col] = [];
          // Remove o número das notas da linha
          for (let c = 0; c < 9; c++) {
            if (c !== col) {
              newNotes[row][c] = newNotes[row][c].filter(n => n !== num);
            }
          }
          // Remove o número das notas da coluna
          for (let r = 0; r < 9; r++) {
            if (r !== row) {
              newNotes[r][col] = newNotes[r][col].filter(n => n !== num);
            }
          }
          // Remove o número das notas do bloco 3x3
          const startRow = Math.floor(row / 3) * 3;
          const startCol = Math.floor(col / 3) * 3;
          for (let r = startRow; r < startRow + 3; r++) {
            for (let c = startCol; c < startCol + 3; c++) {
              if (r !== row || c !== col) {
                newNotes[r][c] = newNotes[r][c].filter(n => n !== num);
              }
            }
          }
        });
        return newNotes;
      });
    }
  }

  function handleClear() {
    if (!selectedCells.length) return;
    setHistory(h => [...h, { grid: grid.map(r => [...r]), notes: notes.map(r => r.map(n => [...n])) }]);
    setGrid(prev => {
      const newGrid = prev.map(r => [...r]);
      selectedCells.forEach(({row, col}) => {
        newGrid[row][col] = '';
      });
      return newGrid;
    });
    setNotes(prev => prev.map(row => row.map(() => [])));
  }

  function handleUndo() {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setGrid(last.grid);
    setNotes(last.notes);
    setHistory(h => h.slice(0, -1));
  }

  function fillAllPossibilities() {
    setNotes(prev => {
      const newNotes: NoteType[][] = prev.map(row => row.map(() => []));
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (!grid[row][col]) {
            newNotes[row][col] = [];
            for (let n = 1; n <= 9; n++) {
              if (isValidMove(row, col, n.toString())) {
                newNotes[row][col].push(n.toString());
              }
            }
          }
        }
      }
      return newNotes;
    });
  }

  // Atualiza filledCells sempre que grid mudar
  useEffect(() => {
    setFilledCells(
      grid.map(row => row.map(cell => cell !== ''))
    );
    //quero desmarcar a célula que foi preenchida
    setSelectedCells(prev => {
      let newPrev = prev
      grid.forEach((row, rowIdx) => {
        row.forEach((cell, colIdx) => {
          if (cell !== '' && prev.some(selected => selected.row === rowIdx && selected.col === colIdx)) {
            // Se a célula foi preenchida, remove da seleção
            newPrev = newPrev.filter(selected => !(selected.row === rowIdx && selected.col === colIdx));
          }
        });
      });
      prev = newPrev
      return prev
    });

    if (grid.flat().every(cell => cell !== '')) {
      // Se o grid está completamente preenchido, mostra mensagem de vitória
      alert('Parabéns! Você completou o Sudoku!');
      setShowWelcome(true); // Reseta para mostrar tela de boas-vindas
    }
  }, [grid]);

  return (
    <div className="sudoku-app">
      {/* Exemplo de uso: filledCells[row][col] indica se está preenchida */}
      {showWelcome && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Bem-vindo ao Sudoku!</h2>
            <p>Selecione a dificuldade:</p>
            <select value={pickerValue} onChange={e => setPickerValue(Number(e.target.value))}>
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <option key={n} value={n}>{n} - {LEVELS[n-1]}</option>
              ))}
            </select>
            <button className="start-btn" onClick={() => handleNewGame(pickerValue)}>Começar</button>
          </div>
        </div>
      )}
      {!showWelcome && (
        <div className="container">
          <div className="grid">
            {grid.map((row, rowIdx) => (
              <div className="row" key={rowIdx}>
                {row.map((cell, colIdx) => {
                  const isSelected = selectedCells.some(cell => cell.row === rowIdx && cell.col === colIdx);
                  const invalid = isCellInvalid(rowIdx, colIdx, cell);
                  const highlighted = isHighlightedNum(rowIdx, colIdx);
                  const highlightedNote = isHighlightedNote(rowIdx, colIdx);
                  return (
                    <div
                      className={`cell${isSelected ? ' selected' : ''}${invalid ? ' invalid' : ''}${highlighted ? ' highlighted' : ''}${highlightedNote ? ' highlighted-note' : ''}`}
                      key={colIdx}
                      onClick={() => handleCellClick(rowIdx, colIdx)}
                      onMouseDown={e => handleCellMouseDown(rowIdx, colIdx, e)}
                      onMouseEnter={() => handleCellMouseEnter(rowIdx, colIdx)}
                    >
                      {cell ? (
                        <span className="cell-text">{cell}</span>
                      ) : notes[rowIdx][colIdx]?.length > 0 ? (
                        <div className="notes-container">
                          {[1,2,3,4,5,6,7,8,9].map(n => (
                            <span key={n} className={`note-text${notes[rowIdx][colIdx]?.includes(n.toString()) && highlightNum === n.toString() ? ' highlighted-cell-note-text' : ''}`}>
                              {notes[rowIdx][colIdx]?.includes(n.toString()) ? n : ' '}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="keyboard-row">
            <div className="keyboard-nums">
              {[...'123456789'].map(num => (
                <button key={num} className="key-num" onClick={() => handleNumberInput(num)}>{num}</button>
              ))}
            </div>
            <div className="keyboard-actions">
              <button className="key-action" onClick={handleClear}>🗑️</button>
              <button className="key-action" onClick={handleUndo}>↩️</button>
              <button className={`key-action${noteMode ? ' note-mode' : ''}`} onClick={() => setNoteMode(m => !m)}>✏️</button>
              <button className="key-action" onClick={fillAllPossibilities}>?</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
