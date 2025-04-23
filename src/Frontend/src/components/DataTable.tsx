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
}

export function DataTable<T>({
  filteredData,
  columns: initialColumns,
  keyExtractor,
  defaultRowsPerPage = 5,
  rowsPerPageOptions = [5, 10, 25, 50, 100],
  paperProps,
  onFilterChange,
  tableProps,
}: DataTableProps<T>) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [columns, setColumns] = useState<Column<T>[]>(initialColumns);
  const [filters, setFilters] = useState<Filter[]>([]);
  
  const [resizingColumnId, setResizingColumnId] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  
  //Funzione che si occuperà del filtraggio, facendo in modo che i dati vengano tagliati fuori
  const handleFilterChange = (columnId: string, value: string) => {
    setFilters((prevFilters) => {
      const newFilters = prevFilters.some(f => f.columnId === columnId)
        ? prevFilters.map(f => f.columnId === columnId ? { ...f, value } : f)
        : [...prevFilters, { columnId, value }];
      
      if (onFilterChange) {
        onFilterChange(newFilters); // comunica all'esterno l'operazione di filtraggio
      }
  
      return newFilters;
    });
  };
  //Funzione che prende il valore del filtering in base all'id della colonna

  const getFilterValue = (columnId: string) => {
    const filter = filters.find(f => f.columnId === columnId);
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
    <Paper {...paperProps}>
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
                            value={getFilterValue(column.id)}
                            onChange={(e) => handleFilterChange(column.id, e.target.value)}
                            size="small"
                            fullWidth
                            variant="outlined"
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
                  Dati non trovati
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