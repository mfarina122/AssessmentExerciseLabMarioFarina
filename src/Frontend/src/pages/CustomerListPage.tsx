import { useEffect, useState } from "react";
import { Button, Container, Typography } from "@mui/material";
import { DataTable, Column } from "../components/DataTable";
import { js2xml } from 'xml-js';
import { Snackbar, Alert } from "@mui/material";


interface customerCategory {
    code: string;
    description: string;
}
  
interface CustomerListQuery {
    name: string;
    customerCategory: customerCategory | null;
    email: string;
    id: number,
    phone: string,
    iban: string,
}

interface Filter {
    columnId: string;
    value: string;
}

function downloadXmlFile(data: CustomerListQuery[], filename: string) {
  //Creiamo l'insieme dei dati da trasformare in XML, iterando su di essi e specificando i tipi e i dati
  const formattedData = {
    elements: data.map(customer => ({
      type: 'element',
      name: 'customer',
      elements: [
        { type: 'element', name: 'id', elements: [{ type: 'text', text: customer.id.toString() }] },
        { type: 'element', name: 'iban', elements: [{ type: 'text', text: customer.iban }] },
        { type: 'element', name: 'name', elements: [{ type: 'text', text: customer.name }] },
        { type: 'element', name: 'email', elements: [{ type: 'text', text: customer.email }] },
        { type: 'element', name: 'phone', elements: [{ type: 'text', text: customer.phone }] },
        {
          type: 'element',
          name: 'category',
          elements: [
            { type: 'element', name: 'code', elements: [{ type: 'text', text: customer.customerCategory?.code || '' }] },
            { type: 'element', name: 'description', elements: [{ type: 'text', text: customer.customerCategory?.description || '' }] }
          ]
        }
      ]
    }))
  };
  //Invochiamo js2xml dalla libreria
  const xml = js2xml({ elements: [{ type: 'element', name: 'customers', elements: formattedData.elements }] }, { compact: false, spaces: 2 });

  const blob = new Blob([xml], { type: 'application/xml' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
  

export default function CustomerListPage() {
    
    const [filteredList, setFilteredList] = useState<CustomerListQuery[]>([]);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');


  const columns: Column<CustomerListQuery>[] = [
    {
      id: 'name',
      label: 'Name',
      width: 120,
      renderCell: (customer) => customer.name,
      filterable: true,
      getValue: (customer) => customer.name
    },
    {
        id: 'email',
        label: 'Email',
        width: 200,
        renderCell: (customer) => customer.email,
        filterable: true,
        getValue: (customer) => customer.email
    },
    {
      id: 'category',
      label: 'Category',
      width: 150,
      renderCell: (customer) => customer.customerCategory ? customer.customerCategory.description : '-',
      filterable: false,
      getValue: (customer) => customer.customerCategory ? customer.customerCategory.description : ''
    },
    {
      id: 'address',
      label: 'Address',
      width: 200,
      renderCell: (customer) => customer.iban,
      filterable: false,
      getValue: (customer) => customer.iban
    },
    {
      id: 'phone',
      label: 'Phone',
      width: 120,
      renderCell: (customer) => customer.phone,
      filterable: false,
      getValue: (customer) => customer.phone
    }
  ];

  // Fetch iniziale
  useEffect(() => {
    setLoading(true);
    fetch("/api/customer/list")
      .then((response) => response.json())
      .then((data: CustomerListQuery[]) => {
        setFilteredList(data); // iniziale = tutti
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching customers:", error);
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
  const url = queryParams ? `/api/customer/list?${queryParams}` : `/api/customer/list`;
  fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error('Errore nella risposta');
      return response.json();
    })
    .then((data: CustomerListQuery[]) => {
      setFilteredList(data);
      setLoading(false);
    })
    .catch((error) => {
        console.error("Errore durante il filtraggio:", error);
        setSnackbarMessage("Attenzione, errore durante il filtraggio!");
        setSnackbarOpen(true);
        setLoading(false);
    });
  }, [filters]);

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ p: 2, textAlign: 'center' }}>
        Customers
      </Typography>
      <div style={{display:"flex",flexDirection:"row",justifyContent:"center"}}>
      <Button 
  variant="contained" 
  color="primary" 
  sx={{ mb: 2 }}
  onClick={() => {
    downloadXmlFile(filteredList,'customers.xml');
  }}
>
  Esporta XML
</Button></div>
        <DataTable
          filteredData={filteredList} // Usiamo i dati filtrati
          columns={columns}
          keyExtractor={(customers) => customers.id}
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