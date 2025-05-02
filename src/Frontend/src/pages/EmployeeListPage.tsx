import { useEffect, useState } from "react";
import { Button, Container, Typography } from "@mui/material";
import { DataTable, Column } from "../components/DataTable"; 
import { js2xml } from 'xml-js';
import { Snackbar, Alert } from "@mui/material";

interface department {
  code: string;
  description: string;
}

interface EmployeeListQuery {
  address: string;
  code: string;
  department: department | null;
  email: string;
  firstName: string;
  id: number,
  lastName: string,
  phone: string,
}
interface Filter {
  columnId: string;
  value: string;
}

function downloadXmlFile(data: EmployeeListQuery[], filename: string) {
  //Creiamo l'insieme dei dati da trasformare in XML, iterando su di essi e specificando i tipi e i dati
  const formattedData = {
    elements: data.map(employee => ({
      type: 'element',
      name: 'employee',
      elements: [
        { type: 'element', name: 'id', elements: [{ type: 'text', text: employee.id.toString() }] },
        { type: 'element', name: 'code', elements: [{ type: 'text', text: employee.code }] },
        { type: 'element', name: 'firstName', elements: [{ type: 'text', text: employee.firstName }] },
        { type: 'element', name: 'lastName', elements: [{ type: 'text', text: employee.lastName }] },
        { type: 'element', name: 'address', elements: [{ type: 'text', text: employee.address }] },
        { type: 'element', name: 'email', elements: [{ type: 'text', text: employee.email }] },
        { type: 'element', name: 'phone', elements: [{ type: 'text', text: employee.phone }] },
        {
          type: 'element',
          name: 'department',
          elements: [
            { type: 'element', name: 'code', elements: [{ type: 'text', text: employee.department?.code || '' }] },
            { type: 'element', name: 'description', elements: [{ type: 'text', text: employee.department?.description || '' }] }
          ]
        }
      ]
    }))
  };
  //Invochiamo js2xml dalla libreria
  const xml = js2xml({ elements: [{ type: 'element', name: 'employees', elements: formattedData.elements }] }, { compact: false, spaces: 2 });

  const blob = new Blob([xml], { type: 'application/xml' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function EmployeeListPage() {
  const [filteredList, setFilteredList] = useState<EmployeeListQuery[]>([]);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const columns: Column<EmployeeListQuery>[] = [
    {
      id: 'firstName',
      label: 'First Name',
      width: 120,
      renderCell: (employee) => employee.firstName,
      filterable: true,
      getValue: (employee) => employee.firstName
    },
    {
      id: 'lastName',
      label: 'Last Name',
      width: 120,
      renderCell: (employee) => employee.lastName,
      filterable: true,
      getValue: (employee) => employee.lastName
    },
    {
      id: 'code',
      label: 'Code',
      width: 100,
      renderCell: (employee) => employee.code,
      filterable: false,
      getValue: (employee) => employee.code
    },
    {
      id: 'department',
      label: 'Department',
      width: 150,
      renderCell: (employee) => employee.department ? employee.department.description : '-',
      filterable: false,
      getValue: (employee) => employee.department ? employee.department.description : ''
    },
    {
      id: 'address',
      label: 'Address',
      width: 200,
      renderCell: (employee) => employee.address,
      filterable: false,
      getValue: (employee) => employee.address
    },
    {
      id: 'email',
      label: 'Email',
      width: 200,
      renderCell: (employee) => employee.email,
      filterable: false,
      getValue: (employee) => employee.email
    },
    {
      id: 'phone',
      label: 'Phone',
      width: 120,
      renderCell: (employee) => employee.phone,
      filterable: false,
      getValue: (employee) => employee.phone
    }
  ];

  // Fetch iniziale
  useEffect(() => {
    setLoading(true);
    fetch("/api/employees/list")
      .then((response) => response.json())
      .then((data: EmployeeListQuery[]) => {
        setFilteredList(data); // iniziale = tutti
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching employees:", error);
        setSnackbarMessage("Attenzione, errore nel recupero dati!");
        setSnackbarOpen(true);
        setLoading(false);
      });
  }, []);

  // Logica di filtro esterno
  useEffect(() => {
    const queryParams = filters
    .filter((f) => f.value.trim() !== '')
    .map((f) => `${encodeURIComponent(f.columnId)}=${encodeURIComponent(f.value)}`)
    .join('&');
  setLoading(true);
  const url = queryParams ? `/api/employees/list?${queryParams}` : `/api/employees/list`;
  fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error('Errore nella risposta');
      return response.json();
    })
    .then((data: EmployeeListQuery[]) => {
      setFilteredList(data);
      setLoading(false);
    })
    .catch((error) => {
        console.error("Errore durante il filtraggio:", error);
        setLoading(false);
    });
  }, [filters]);

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ p: 2, textAlign: 'center' }}>
        Employee
      </Typography>
      <div style={{display:"flex",flexDirection:"row",justifyContent:"center"}}>
      <Button 
  variant="contained" 
  color="primary" 
  sx={{ mb: 2 }}
  onClick={() => {
    downloadXmlFile(filteredList,'employees.xml');
  }}
>
  Esporta XML
</Button></div>
        <DataTable
          filteredData={filteredList} // Usiamo i dati filtrati
          columns={columns}
          keyExtractor={(employee) => employee.id}
          onFilterChange={setFilters} // Comunica i filtri in uscita
          isLoading={loading}
        />
        <Snackbar
  open={snackbarOpen}
  autoHideDuration={6000}
  onClose={() => setSnackbarOpen(false)}
  anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
>
  <Alert onClose={() => setSnackbarOpen(false)} severity="error" sx={{ width: '100%' }}>
    {snackbarMessage}
  </Alert>
</Snackbar>
    </Container>
  );
}