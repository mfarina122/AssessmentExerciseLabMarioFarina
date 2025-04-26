import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Box,
  TextField,
  tableCellClasses,
  styled,
  CircularProgress,
  Backdrop,
  Typography,
} from "@mui/material";

export interface Column<T> {
  id: string;
  label: string;
  width: number;
  renderCell: (item: T) => React.ReactNode; //Qui renderizzerò gli elementi della cella vera e propria, che sarà di fatto un react node che passerò nella colonna (da qui la funzione)
  filterable?: boolean;
  filterOptions?: { value: string, label: string }[];
  getValue?: (item: T) => string | number; // Funzione per ottenere il valore raw per filtro
}

interface Filter {
  columnId: string;
  value: string;
}

interface DataTableProps<T> {
  filteredData: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  defaultRowsPerPage?: number;
  rowsPerPageOptions?: number[];
  showGlobalSearch?: boolean;
  onFilterChange?: (filters: Filter[]) => void, // prop con la funzione di ricerca da usare fuori
  paperProps?: React.ComponentProps<typeof Paper>; //Props del paper che contiene la tabella (fa da container, in modo che lo possa customizzare come voglio se mi servirà)
  tableProps?: React.ComponentProps<typeof Table>; //Props della tabella stessa, per la stessa ragione del paper
  isLoading?: boolean; // Nuovo prop per indicare se i dati stanno caricando
}

export function DataTable<T>({
  filteredData,
  columns: initialColumns,
  keyExtractor,
  defaultRowsPerPage = 10,
  rowsPerPageOptions = [5, 10, 25, 50, 100],
  paperProps,
  onFilterChange,
  tableProps,
  isLoading = false, // Default a false
}: DataTableProps<T>) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [columns, setColumns] = useState<Column<T>[]>(initialColumns);
  const [filters, setFilters] = useState<Filter[]>([]);
  
  // Nuovo stato per memorizzare i valori temporanei dei filtri prima che vengano applicati
  const [tempFilters, setTempFilters] = useState<Filter[]>([]);
  
  const [resizingColumnId, setResizingColumnId] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  
  // Inizializza tempFilters con gli stessi valori di filters quando il componente viene montato
  useEffect(() => {
    setTempFilters(filters);
  }, []);
  
  // Funzione che gestisce i cambiamenti temporanei di filtro (senza applicarli)
  const handleTempFilterChange = (columnId: string, value: string) => {
    setTempFilters((prevFilters) => {
      return prevFilters.some(f => f.columnId === columnId)
        ? prevFilters.map(f => f.columnId === columnId ? { ...f, value } : f)
        : [...prevFilters, { columnId, value }];
    });
  };
  
  //Funzione che si occuperà del filtraggio, facendo in modo che i dati vengano tagliati fuori
  const handleFilterChange = (columnId: string, value: string) => {
    // Ottieni il valore attuale del filtro per verificare se è cambiato
    const currentFilterValue = getFilterValue(columnId);
    
    // Applica il filtro solo se il valore è effettivamente cambiato
    if (value !== currentFilterValue) {
      setFilters((prevFilters) => {
        const newFilters = prevFilters.some(f => f.columnId === columnId)
          ? prevFilters.map(f => f.columnId === columnId ? { ...f, value } : f)
          : [...prevFilters, { columnId, value }];
        
        if (onFilterChange) {
          onFilterChange(newFilters); // comunica all'esterno l'operazione di filtraggio
        }
    
        return newFilters;
      });
      
      // Reset della pagina quando si applica un nuovo filtro
      setPage(0);
    }
  };
  
  //Funzione che prende il valore del filtering in base all'id della colonna
  const getFilterValue = (columnId: string, temp: boolean = false) => {
    const filterArray = temp ? tempFilters : filters;
    const filter = filterArray.find(f => f.columnId === columnId);
    return filter ? filter.value : '';
  };
  
  //Controllo se le colonne sono filtrabili
  const filterableColumns = columns.filter(col => col.filterable);
  const hasFilterableColumns = filterableColumns.length > 0;

  //Sezione riguardante il resizing delle colonne
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingColumnId !== null) {
        const diff = e.clientX - startX;
        setColumns(prevColumns => 
          prevColumns.map(col => 
            col.id === resizingColumnId 
              ? { ...col, width: Math.max(50, startWidth + diff) } 
              : col
          )
        );
      }
    };
    
    const handleMouseUp = () => {
      setResizingColumnId(null);
    };
    
    if (resizingColumnId) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingColumnId, startX, startWidth]);
  
  const handleResizeStart = (columnId: string, initialWidth: number, e: React.MouseEvent) => {
    e.preventDefault();
    setResizingColumnId(columnId);
    setStartX(e.clientX);
    setStartWidth(initialWidth);
  };

  //Fine sezione riguardante il resizing

  //Sezione riguardante la paginazione
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  //Fine della sezione paginazione

  return (
    <Paper {...paperProps} sx={{ position: 'relative', ...paperProps?.sx }}>
      {/* Unico indicatore di caricamento centrale con messaggio "Ricerca in corso" */}
      <Backdrop
        sx={{
          position: 'absolute',
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
        }}
        open={isLoading}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress color="inherit" />
          <Typography variant="h6" component="div" color="inherit">
            Ricerca in corso...
          </Typography>
        </Box>
      </Backdrop>
      
      <TableContainer>
        <Table sx={{ minWidth: 650, ...tableProps?.sx }} {...tableProps}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <StyledTableHeadCell
                  key={column.id}
                  sx={{
                    width: column.width,
                    position: 'relative',
                    userSelect: 'none'
                  }}
                >
                  {column.label}
                  <Box
                    sx={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      height: '100%',
                      width: '5px',
                      cursor: 'col-resize',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.2)'
                      }
                    }}
                    onMouseDown={(e) => handleResizeStart(column.id, column.width, e)}
                  />
                </StyledTableHeadCell>
              ))}
            </TableRow>
            {hasFilterableColumns && (
              <TableRow>
                {columns.map((column) => (
                  <TableCell 
                    key={`filter-${column.id}`}
                    sx={{ 
                      padding: '8px', 
                      borderTop: 0,
                      backgroundColor: 'background.paper'
                    }}
                  >
                    {column.filterable ? (
                        <Box>
                          <TextField
                            placeholder="Filtra..."
                            value={getFilterValue(column.id, true)} // Usa i valori temporanei per l'input
                            onChange={(e) => handleTempFilterChange(column.id, e.target.value)} // Aggiorna solo i valori temporanei
                            onBlur={(e) => {
                              // Verifica se il valore è cambiato rispetto al filtro attuale prima di applicarlo
                              const newValue = e.target.value;
                              const currentValue = getFilterValue(column.id);
                              if (newValue !== currentValue) {
                                handleFilterChange(column.id, newValue);
                              }
                            }} 
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const newValue = (e.target as HTMLInputElement).value;
                                const currentValue = getFilterValue(column.id);
                                // Verifica se il valore è cambiato prima di applicare il filtro
                                if (newValue !== currentValue) {
                                  handleFilterChange(column.id, newValue);
                                }
                              }
                            }}
                            size="small"
                            fullWidth
                            variant="outlined"
                            // Disabilita l'input durante il caricamento
                            disabled={isLoading}
                          />
                        </Box>
                      ) : null}
                  </TableCell>
                ))}
              </TableRow>
            )}
          </TableHead>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) //Dividiamo in base al valore della paginazione inserito NB: questo ora è frontend. Devo vedere se ci sono filtri di paginazione lato backend
                .map((item) => (
                  <TableRow
                    key={keyExtractor(item)}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    {columns.map(column => (
                      <TableCell
                        key={`${keyExtractor(item)}-${column.id}`}
                        sx={{ width: column.width }}
                      >
                        {column.renderCell(item)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                  {/* Mostro un messaggio diverso in base allo stato di caricamento */}
                  {isLoading ? '' : 'Dati non trovati'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination //Componente della paginazione per ora preso da MUI
        rowsPerPageOptions={rowsPerPageOptions}
        component="div"
        count={filteredData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        // Disabilita la paginazione durante il caricamento
        disabled={isLoading}
      />
    </Paper>
  );
}

const StyledTableHeadCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.common.white,
  },
}));