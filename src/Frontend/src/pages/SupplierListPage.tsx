import { useEffect, useState } from "react";
import { Container, Typography } from "@mui/material";
import { DataTable, Column } from "../components/DataTable";
import { Snackbar, Alert } from "@mui/material";


interface SupplierListQuery {
  id: number;
  name: string;
  address: string;
  email: string;
  phone: string;
}

export default function SupplierListPage() {
  const [list, setList] = useState<SupplierListQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');


  // Definizione delle colonne per la DataTable
  const columns: Column<SupplierListQuery>[] = [
    {
      id: 'name',
      label: 'Name',
      width: 150,
      renderCell: (supplier) => supplier.name,
    },
    {
      id: 'address',
      label: 'Address',
      width: 200,
      renderCell: (supplier) => supplier.address,
    },
    {
      id: 'email',
      label: 'Email',
      width: 200,
      renderCell: (supplier) => supplier.email,
    },
    {
      id: 'phone',
      label: 'Phone',
      width: 120,
      renderCell: (supplier) => supplier.phone,
    }
  ];

  useEffect(() => {
    setLoading(true);
    fetch("/api/suppliers/list")
      .then((response) => response.json())
      .then((data) => {
        setList(data as SupplierListQuery[]);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching suppliers:", error);
        setSnackbarMessage("Attenzione, errore nel recupero dati!");
        setSnackbarOpen(true);
        setLoading(false);
      });
  }, []);

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ p: 2, textAlign: 'center' }}>
        Suppliers
      </Typography>
      <DataTable
        filteredData={list}
        columns={columns}
        keyExtractor={(supplier) => supplier.id}
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